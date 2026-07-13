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
  // timing. Capping at 1/60s preserves PPG brightness/SNR while preventing
  // exposure from dropping the 30fps fallback cadence; the lost
  // brightness is compensated with ISO so the JS finger-detection thresholds
  // see the same image.
  private static let maxExposureSeconds = 1.0 / 60.0

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  // Pin the active format to the rate selected by JS. Full HRV capture requests
  // 60 only after VisionCamera has selected a format that supports it; every
  // other heart-rate path continues to request 30.
  private func pinFrameRate(_ device: AVCaptureDevice, targetFps: Int32) {
    let supportsTarget = device.activeFormat.videoSupportedFrameRateRanges.contains {
      $0.minFrameRate <= Double(targetFps) && Double(targetFps) <= $0.maxFrameRate
    }
    guard supportsTarget else { return }
    let targetFrameDuration = CMTime(value: 1, timescale: targetFps)
    device.activeVideoMinFrameDuration = targetFrameDuration
    device.activeVideoMaxFrameDuration = targetFrameDuration
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

  @objc(lockForHeartRate:targetFps:)
  func lockForHeartRate(_ deviceId: NSString, targetFps: NSNumber) {
    let id = deviceId as String
    let requestedFps: Int32 = targetFps.int32Value >= 60 ? 60 : 30

    queue.async {
      guard let device = AVCaptureDevice(uniqueID: id) else { return }

      do {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }

        self.pinFrameRate(device, targetFps: requestedFps)
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
