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
  let targetSamples: Int
}

private let targetFrameSize = 300

@objc(HeartRatePlugin)
public class HeartRatePlugin: FrameProcessorPlugin {

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  private func sampleROI(
    _ roi: HeartRateROI,
    frameWidth: Int,
    frameHeight: Int,
    originX: Int,
    originY: Int,
    width: Int,
    height: Int,
    bytesPerRow: Int,
    bytes: UnsafePointer<UInt8>,
    bufferSize: Int
  ) -> [String: Any] {
    let startX = originX + Int(floor(Double(width) * roi.x))
    let startY = originY + Int(floor(Double(height) * roi.y))
    let roiWidth = max(1, Int(floor(Double(width) * roi.width)))
    let roiHeight = max(1, Int(floor(Double(height) * roi.height)))
    let endX = min(frameWidth, startX + roiWidth)
    let endY = min(frameHeight, startY + roiHeight)
    let sampleArea = max(1, (endX - startX) * (endY - startY))
    let step = max(2, Int(sqrt(Double(sampleArea) / Double(max(1, roi.targetSamples)))))

    var redSum = 0.0
    var greenSum = 0.0
    var blueSum = 0.0
    var redSquareSum = 0.0
    var saturatedCount = 0
    var darkCount = 0
    var count = 0

    var y = startY
    while y < endY {
      var x = startX
      while x < endX {
        let offset = y * bytesPerRow + x * 4
        if offset + 3 < bufferSize {
          let blue = Double(bytes[offset])
          let green = Double(bytes[offset + 1])
          let red = Double(bytes[offset + 2])

          redSum += red
          greenSum += green
          blueSum += blue
          redSquareSum += red * red

          if red >= 245 || green >= 245 || blue >= 245 {
            saturatedCount += 1
          }

          if red <= 10 && green <= 10 && blue <= 10 {
            darkCount += 1
          }

          count += 1
        }
        x += step
      }
      y += step
    }

    guard count > 0 else {
      return [
        "id": roi.id,
        "r": 0,
        "g": 0,
        "b": 0,
        "saturatedPct": 1,
        "darkPct": 1,
        "variance": 0,
      ]
    }

    let redMean = redSum / Double(count)
    let variance = max(0, redSquareSum / Double(count) - redMean * redMean)

    return [
      "id": roi.id,
      "r": redMean,
      "g": greenSum / Double(count),
      "b": blueSum / Double(count),
      "saturatedPct": Double(saturatedCount) / Double(count),
      "darkPct": Double(darkCount) / Double(count),
      "variance": variance,
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
    guard pixelFormat == kCVPixelFormatType_32BGRA else { return nil }

    CVPixelBufferLockBaseAddress(imageBuffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(imageBuffer, .readOnly) }

    let width = CVPixelBufferGetWidth(imageBuffer)
    let height = CVPixelBufferGetHeight(imageBuffer)
    let bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer)
    guard let baseAddress = CVPixelBufferGetBaseAddress(imageBuffer) else { return nil }

    let bytes = baseAddress.assumingMemoryBound(to: UInt8.self)
    let bufferSize = bytesPerRow * height
    let sampleWidth = min(width, targetFrameSize)
    let sampleHeight = min(height, targetFrameSize)
    let sampleOriginX = max(0, (width - sampleWidth) / 2)
    let sampleOriginY = max(0, (height - sampleHeight) / 2)

    let rois = [
      HeartRateROI(id: "full", x: 0.05, y: 0.05, width: 0.9, height: 0.9, targetSamples: 1400),
      HeartRateROI(id: "center", x: 0.25, y: 0.25, width: 0.5, height: 0.5, targetSamples: 900),
      HeartRateROI(id: "inner", x: 0.35, y: 0.35, width: 0.3, height: 0.3, targetSamples: 600),
      HeartRateROI(id: "left", x: 0.05, y: 0.2, width: 0.45, height: 0.6, targetSamples: 700),
      HeartRateROI(id: "right", x: 0.5, y: 0.2, width: 0.45, height: 0.6, targetSamples: 700),
      HeartRateROI(id: "top", x: 0.2, y: 0.05, width: 0.6, height: 0.45, targetSamples: 700),
      HeartRateROI(id: "bottom", x: 0.2, y: 0.5, width: 0.6, height: 0.45, targetSamples: 700),
    ]

    let roiSamples = rois.map {
      sampleROI(
        $0,
        frameWidth: width,
        frameHeight: height,
        originX: sampleOriginX,
        originY: sampleOriginY,
        width: sampleWidth,
        height: sampleHeight,
        bytesPerRow: bytesPerRow,
        bytes: bytes,
        bufferSize: bufferSize
      )
    }

    let timestampMs = frameTimestampMs(for: frame.buffer)

    return [
      "timestamp": timestampMs,
      "rois": roiSamples,
    ]
  }
}
