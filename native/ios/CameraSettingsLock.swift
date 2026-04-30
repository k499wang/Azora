import AVFoundation
import Foundation
import React

@objc(CameraSettingsLock)
public class CameraSettingsLock: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  private func backWideAngleDevice() -> AVCaptureDevice? {
    if let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) {
      return device
    }
    return AVCaptureDevice.default(for: .video)
  }

  @objc(lockSettings:rejecter:)
  func lockSettings(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let device = backWideAngleDevice() else {
      reject("no_device", "No back wide-angle camera device available", nil)
      return
    }

    do {
      try device.lockForConfiguration()
      defer { device.unlockForConfiguration() }

      if device.isFocusModeSupported(.locked) {
        device.focusMode = .locked
      }
      if device.isExposureModeSupported(.locked) {
        device.exposureMode = .locked
      }
      if device.isWhiteBalanceModeSupported(.locked) {
        device.whiteBalanceMode = .locked
      }
      if device.isLowLightBoostSupported {
        device.automaticallyEnablesLowLightBoostWhenAvailable = false
      }
      if device.activeFormat.isVideoHDRSupported {
        device.automaticallyAdjustsVideoHDREnabled = false
      }

      resolve([
        "focusLocked": device.focusMode == .locked,
        "exposureLocked": device.exposureMode == .locked,
        "whiteBalanceLocked": device.whiteBalanceMode == .locked,
      ])
    } catch {
      reject("lock_failed", "Failed to lock camera settings: \(error.localizedDescription)", error)
    }
  }

  @objc(unlockSettings:rejecter:)
  func unlockSettings(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let device = backWideAngleDevice() else {
      resolve(nil)
      return
    }

    do {
      try device.lockForConfiguration()
      defer { device.unlockForConfiguration() }

      if device.isFocusModeSupported(.continuousAutoFocus) {
        device.focusMode = .continuousAutoFocus
      }
      if device.isExposureModeSupported(.continuousAutoExposure) {
        device.exposureMode = .continuousAutoExposure
      }
      if device.isWhiteBalanceModeSupported(.continuousAutoWhiteBalance) {
        device.whiteBalanceMode = .continuousAutoWhiteBalance
      }

      resolve(nil)
    } catch {
      reject("unlock_failed", "Failed to unlock camera settings: \(error.localizedDescription)", error)
    }
  }
}
