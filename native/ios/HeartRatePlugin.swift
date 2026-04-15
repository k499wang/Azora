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

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
  }

  private func sampleROI(
    _ roi: HeartRateROI,
    width: Int,
    height: Int,
    bytesPerRow: Int,
    bytes: UnsafePointer<UInt8>,
    bufferSize: Int
  ) -> [String: Any] {
    let startX = Int(floor(Double(width) * roi.x))
    let startY = Int(floor(Double(height) * roi.y))
    let roiWidth = max(1, Int(floor(Double(width) * roi.width)))
    let roiHeight = max(1, Int(floor(Double(height) * roi.height)))
    let endX = min(width, startX + roiWidth)
    let endY = min(height, startY + roiHeight)
    let step = 4

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
        if offset + 2 < bufferSize {
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

    let rois = [
      HeartRateROI(id: "full", x: 0.0, y: 0.0, width: 1.0, height: 1.0),
      HeartRateROI(id: "center", x: 0.25, y: 0.25, width: 0.5, height: 0.5),
      HeartRateROI(id: "left", x: 0.0, y: 0.0, width: 0.5, height: 1.0),
      HeartRateROI(id: "right", x: 0.5, y: 0.0, width: 0.5, height: 1.0),
      HeartRateROI(id: "top", x: 0.0, y: 0.0, width: 1.0, height: 0.5),
      HeartRateROI(id: "bottom", x: 0.0, y: 0.5, width: 1.0, height: 0.5),
    ]

    let roiSamples = rois.map {
      sampleROI(
        $0,
        width: width,
        height: height,
        bytesPerRow: bytesPerRow,
        bytes: bytes,
        bufferSize: bufferSize
      )
    }

    let presentationTime = CMSampleBufferGetPresentationTimeStamp(frame.buffer)
    var timestampMs = CACurrentMediaTime() * 1000
    if presentationTime.isValid && !presentationTime.isIndefinite {
      let seconds = CMTimeGetSeconds(presentationTime)
      if seconds.isFinite {
        timestampMs = seconds * 1000
      }
    }

    return [
      "timestamp": timestampMs,
      "rois": roiSamples,
    ]
  }
}
