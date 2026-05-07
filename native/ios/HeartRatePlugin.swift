import Accelerate
import AVFoundation
import CoreMedia
import CoreVideo
import Foundation
import QuartzCore
import VisionCamera

private struct HeartRateROI {
  let id: String
  let x: Double
  let y: Double
  let width: Double
  let height: Double
}

@objc(HeartRatePlugin)
public class HeartRatePlugin: FrameProcessorPlugin {

  private var yBuffer: [Float] = []
  private var cbBuffer: [Float] = []
  private var crBuffer: [Float] = []

  private static let rois: [HeartRateROI] = [
    HeartRateROI(id: "full", x: 0.05, y: 0.05, width: 0.9, height: 0.9),
    HeartRateROI(id: "center", x: 0.25, y: 0.25, width: 0.5, height: 0.5),
    HeartRateROI(id: "inner", x: 0.35, y: 0.35, width: 0.3, height: 0.3),
    HeartRateROI(id: "left", x: 0.05, y: 0.2, width: 0.45, height: 0.6),
    HeartRateROI(id: "right", x: 0.5, y: 0.2, width: 0.45, height: 0.6),
    HeartRateROI(id: "top", x: 0.2, y: 0.05, width: 0.6, height: 0.45),
    HeartRateROI(id: "bottom", x: 0.2, y: 0.5, width: 0.6, height: 0.45),
  ]

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  private func defaultRoiResult(id: String) -> [String: Any] {
    return [
      "id": id,
      "r": 0,
      "g": 0,
      "b": 0,
      "saturatedPct": 1,
      "darkPct": 1,
      "variance": 0,
    ]
  }

  private func sampleROI(
    _ roi: HeartRateROI,
    yWidth: Int, yHeight: Int,
    cWidth: Int, cHeight: Int,
    yPlane: UnsafePointer<Float>,
    cbPlane: UnsafePointer<Float>,
    crPlane: UnsafePointer<Float>,
    isVideoRange: Bool
  ) -> [String: Any] {
    let yStartX = max(0, Int(floor(Double(yWidth) * roi.x)))
    let yStartY = max(0, Int(floor(Double(yHeight) * roi.y)))
    let yEndX = min(yWidth, yStartX + max(1, Int(floor(Double(yWidth) * roi.width))))
    let yEndY = min(yHeight, yStartY + max(1, Int(floor(Double(yHeight) * roi.height))))
    let yRoiW = yEndX - yStartX
    let yRoiH = yEndY - yStartY

    let cStartX = max(0, Int(floor(Double(cWidth) * roi.x)))
    let cStartY = max(0, Int(floor(Double(cHeight) * roi.y)))
    let cEndX = min(cWidth, cStartX + max(1, Int(floor(Double(cWidth) * roi.width))))
    let cEndY = min(cHeight, cStartY + max(1, Int(floor(Double(cHeight) * roi.height))))
    let cRoiW = cEndX - cStartX
    let cRoiH = cEndY - cStartY

    guard yRoiW > 0, yRoiH > 0, cRoiW > 0, cRoiH > 0 else {
      return defaultRoiResult(id: roi.id)
    }

    let satThresh: Float = isVideoRange ? 235 : 245
    let darkThresh: Float = isVideoRange ? 25 : 10

    var ySum: Float = 0
    var ySqSum: Float = 0
    var saturatedCount: Int = 0
    var darkCount: Int = 0

    for row in 0..<yRoiH {
      let rowPtr = yPlane.advanced(by: (yStartY + row) * yWidth + yStartX)
      var rowSum: Float = 0
      var rowSqSum: Float = 0
      vDSP_sve(rowPtr, 1, &rowSum, vDSP_Length(yRoiW))
      vDSP_svesq(rowPtr, 1, &rowSqSum, vDSP_Length(yRoiW))
      ySum += rowSum
      ySqSum += rowSqSum

      for i in 0..<yRoiW {
        let v = rowPtr[i]
        if v >= satThresh { saturatedCount += 1 }
        if v <= darkThresh { darkCount += 1 }
      }
    }

    var cbSum: Float = 0
    var crSum: Float = 0
    for row in 0..<cRoiH {
      let cbRow = cbPlane.advanced(by: (cStartY + row) * cWidth + cStartX)
      let crRow = crPlane.advanced(by: (cStartY + row) * cWidth + cStartX)
      var s: Float = 0
      vDSP_sve(cbRow, 1, &s, vDSP_Length(cRoiW))
      cbSum += s
      vDSP_sve(crRow, 1, &s, vDSP_Length(cRoiW))
      crSum += s
    }

    let yCount = Float(yRoiW * yRoiH)
    let cCount = Float(cRoiW * cRoiH)
    let yMean = ySum / yCount
    let cbMean = cbSum / cCount
    let crMean = crSum / cCount

    let r: Float
    let g: Float
    let b: Float
    let aFactor: Float
    if isVideoRange {
      let yScaled = 1.164 * (yMean - 16)
      r = yScaled + 1.596 * (crMean - 128)
      g = yScaled - 0.813 * (crMean - 128) - 0.392 * (cbMean - 128)
      b = yScaled + 2.017 * (cbMean - 128)
      aFactor = 1.164
    } else {
      r = yMean + 1.402 * (crMean - 128)
      g = yMean - 0.714 * (crMean - 128) - 0.344 * (cbMean - 128)
      b = yMean + 1.772 * (cbMean - 128)
      aFactor = 1.0
    }

    let yVar = max(0, ySqSum / yCount - yMean * yMean)
    let variance = yVar * aFactor * aFactor

    return [
      "id": roi.id,
      "r": Double(min(255, max(0, r))),
      "g": Double(min(255, max(0, g))),
      "b": Double(min(255, max(0, b))),
      "saturatedPct": Double(saturatedCount) / Double(yCount),
      "darkPct": Double(darkCount) / Double(yCount),
      "variance": Double(variance),
    ]
  }

  private func frameTimestampMs(for sampleBuffer: CMSampleBuffer) -> Double {
    let presentationTimestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    let seconds = CMTimeGetSeconds(presentationTimestamp)
    if seconds.isFinite {
      return seconds * 1000
    }
    return CACurrentMediaTime() * 1000
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    guard let imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer) else { return nil }
    let pixelFormat = CVPixelBufferGetPixelFormatType(imageBuffer)

    let isVideoRange: Bool
    switch pixelFormat {
    case kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange:
      isVideoRange = true
    case kCVPixelFormatType_420YpCbCr8BiPlanarFullRange:
      isVideoRange = false
    default:
      return nil
    }

    CVPixelBufferLockBaseAddress(imageBuffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(imageBuffer, .readOnly) }

    let yWidth = CVPixelBufferGetWidthOfPlane(imageBuffer, 0)
    let yHeight = CVPixelBufferGetHeightOfPlane(imageBuffer, 0)
    let yStride = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 0)
    let cWidth = CVPixelBufferGetWidthOfPlane(imageBuffer, 1)
    let cHeight = CVPixelBufferGetHeightOfPlane(imageBuffer, 1)
    let cStride = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 1)

    guard yWidth > 0, yHeight > 0, cWidth > 0, cHeight > 0,
          let yBase = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 0),
          let cBase = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 1) else { return nil }

    let yBytes = yBase.assumingMemoryBound(to: UInt8.self)
    let cBytes = cBase.assumingMemoryBound(to: UInt8.self)

    let yCount = yWidth * yHeight
    let cCount = cWidth * cHeight

    if yBuffer.count != yCount { yBuffer = [Float](repeating: 0, count: yCount) }
    if cbBuffer.count != cCount { cbBuffer = [Float](repeating: 0, count: cCount) }
    if crBuffer.count != cCount { crBuffer = [Float](repeating: 0, count: cCount) }

    yBuffer.withUnsafeMutableBufferPointer { dst in
      let dstBase = dst.baseAddress!
      if yStride == yWidth {
        vDSP_vfltu8(yBytes, 1, dstBase, 1, vDSP_Length(yCount))
      } else {
        for row in 0..<yHeight {
          vDSP_vfltu8(
            yBytes.advanced(by: row * yStride), 1,
            dstBase.advanced(by: row * yWidth), 1,
            vDSP_Length(yWidth)
          )
        }
      }
    }

    cbBuffer.withUnsafeMutableBufferPointer { cbDst in
      crBuffer.withUnsafeMutableBufferPointer { crDst in
        let cbBase = cbDst.baseAddress!
        let crBase = crDst.baseAddress!
        for row in 0..<cHeight {
          let src = cBytes.advanced(by: row * cStride)
          vDSP_vfltu8(src, 2, cbBase.advanced(by: row * cWidth), 1, vDSP_Length(cWidth))
          vDSP_vfltu8(src.advanced(by: 1), 2, crBase.advanced(by: row * cWidth), 1, vDSP_Length(cWidth))
        }
      }
    }

    let roiSamples: [[String: Any]] = yBuffer.withUnsafeBufferPointer { yPtr in
      cbBuffer.withUnsafeBufferPointer { cbPtr in
        crBuffer.withUnsafeBufferPointer { crPtr in
          HeartRatePlugin.rois.map { roi in
            sampleROI(
              roi,
              yWidth: yWidth, yHeight: yHeight,
              cWidth: cWidth, cHeight: cHeight,
              yPlane: yPtr.baseAddress!,
              cbPlane: cbPtr.baseAddress!,
              crPlane: crPtr.baseAddress!,
              isVideoRange: isVideoRange
            )
          }
        }
      }
    }

    let timestampMs = frameTimestampMs(for: frame.buffer)

    return [
      "timestamp": timestampMs,
      "rois": roiSamples,
    ]
  }
}

@objc(HeartRateCameraControls)
public class HeartRateCameraControls: NSObject {
  private let queue = DispatchQueue(label: "heart-rate-camera-controls", qos: .userInitiated)

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  @objc(lockForHeartRate:)
  func lockForHeartRate(_ deviceId: NSString) {
    let id = deviceId as String

    queue.async {
      guard let device = AVCaptureDevice(uniqueID: id) else { return }

      do {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }

        if device.isWhiteBalanceModeSupported(.locked) {
          device.whiteBalanceMode = .locked
        }
        if device.isFocusModeSupported(.locked) {
          device.focusMode = .locked
        }

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
      } catch {
        return
      }
    }
  }
}
