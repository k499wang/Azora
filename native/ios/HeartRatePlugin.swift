import CoreVideo
import VisionCamera

@objc(HeartRatePlugin)
public class HeartRatePlugin: FrameProcessorPlugin {

  public override init(proxy: VisionCameraProxyHolder, options: [AnyHashable: Any]! = [:]) {
    super.init(proxy: proxy, options: options)
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

    // Sample center 50% of frame to reduce edge noise
    let startX = width / 4
    let endX = width - startX
    let startY = height / 4
    let endY = height - startY
    let step = 4

    var redSum: Double = 0
    var count = 0

    var y = startY
    while y < endY {
      var x = startX
      while x < endX {
        let offset = y * bytesPerRow + x * 4
        guard offset + 2 < bufferSize else { return nil }
        // BGRA pixel format: B=offset, G=offset+1, R=offset+2, A=offset+3
        redSum += Double(bytes[offset + 2])
        count += 1
        x += step
      }
      y += step
    }

    guard count > 0 else { return nil }
    return redSum / Double(count)
  }
}
