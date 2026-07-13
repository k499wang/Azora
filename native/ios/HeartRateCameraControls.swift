import AVFoundation
import CoreMedia
import Foundation

@objc(HeartRateCameraControls)
public class HeartRateCameraControls: NSObject {
  private let queue = DispatchQueue(label: "heart-rate-camera-controls", qos: .userInitiated)

  // The torch is deliberately left at full (VisionCamera's `torch` prop): on
  // devices where the flash sits far from the lens, a dimmed torch starves the
  // transmitted signal. Saturation is instead managed by freezing exposure at
  // an AE-settled operating point below.
  //
  // Exposure duration cap: continuous AE in dim conditions extends exposure
  // toward the frame duration, which drops the real frame rate and blurs beat
  // timing. Capping at 1/60s keeps the 30fps cadence honest; the lost
  // brightness is compensated with ISO so the JS finger-detection thresholds
  // see the same image.
  private static let maxExposureSeconds = 1.0 / 60.0
  private static let targetFrameDuration = CMTime(value: 1, timescale: 30)

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  // The JS pipeline's band-pass coefficients and group-delay compensation
  // assume exactly 30 samples/s; an AE-driven frame-rate drop silently breaks
  // both. Pinned defensively even though the fps camera prop requests 30.
  private func pinFrameRate(_ device: AVCaptureDevice) {
    let supports30 = device.activeFormat.videoSupportedFrameRateRanges.contains {
      $0.minFrameRate <= 30 && 30 <= $0.maxFrameRate
    }
    guard supports30 else { return }
    device.activeVideoMinFrameDuration = HeartRateCameraControls.targetFrameDuration
    device.activeVideoMaxFrameDuration = HeartRateCameraControls.targetFrameDuration
  }

  // Freeze exposure at a chosen operating point instead of `.locked`, which
  // freezes whatever AE happened to be doing at that instant (possibly mid-hunt
  // or at a frame-rate-dropping long duration).
  private func freezeExposure(_ device: AVCaptureDevice) {
    guard device.isExposureModeSupported(.custom) else {
      if device.isExposureModeSupported(.locked) {
        device.exposureMode = .locked
      }
      return
    }

    let format = device.activeFormat
    let settledSeconds = CMTimeGetSeconds(device.exposureDuration)
    let minSeconds = CMTimeGetSeconds(format.minExposureDuration)
    let cappedSeconds = max(
      minSeconds,
      min(settledSeconds, HeartRateCameraControls.maxExposureSeconds)
    )
    let duration = CMTime(seconds: cappedSeconds, preferredTimescale: 1_000_000)
    let isoScale = settledSeconds > 0 ? settledSeconds / cappedSeconds : 1
    let iso = min(
      format.maxISO,
      max(format.minISO, device.iso * Float(isoScale))
    )
    device.setExposureModeCustom(duration: duration, iso: iso, completionHandler: nil)
  }

  @objc(lockForHeartRate:)
  func lockForHeartRate(_ deviceId: NSString) {
    let id = deviceId as String

    queue.async {
      guard let device = AVCaptureDevice(uniqueID: id) else { return }

      do {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }

        self.pinFrameRate(device)
        if device.isWhiteBalanceModeSupported(.locked) {
          device.whiteBalanceMode = .locked
        }
        if device.isFocusModeSupported(.locked) {
          device.focusMode = .locked
        }
        self.freezeExposure(device)

      } catch {
        return
      }
    }
  }

  @objc(unlockForHeartRate:)
  func unlockForHeartRate(_ deviceId: NSString) {
    let id = deviceId as String

    queue.async {
      guard let device = AVCaptureDevice(uniqueID: id) else { return }

      do {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }

        if device.isWhiteBalanceModeSupported(.continuousAutoWhiteBalance) {
          device.whiteBalanceMode = .continuousAutoWhiteBalance
        }
        if device.isFocusModeSupported(.continuousAutoFocus) {
          device.focusMode = .continuousAutoFocus
        }
        if device.isExposureModeSupported(.continuousAutoExposure) {
          device.exposureMode = .continuousAutoExposure
        }
      } catch {
        return
      }
    }
  }
}
