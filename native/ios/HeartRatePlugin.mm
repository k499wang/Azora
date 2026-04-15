#import <VisionCamera/FrameProcessorPlugin.h>
#import <CoreMedia/CMSampleBuffer.h>
#import <CoreVideo/CoreVideo.h>

@interface HeartRatePlugin : FrameProcessorPlugin
@end

@implementation HeartRatePlugin

- (id _Nullable)callback:(Frame*)frame withArguments:(NSDictionary* _Nullable)arguments {
  CVImageBufferRef imageBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  if (imageBuffer == nil) {
    return nil;
  }

  OSType pixelFormat = CVPixelBufferGetPixelFormatType(imageBuffer);
  if (pixelFormat != kCVPixelFormatType_32BGRA) {
    return nil;
  }

  CVPixelBufferLockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);

  size_t width = CVPixelBufferGetWidth(imageBuffer);
  size_t height = CVPixelBufferGetHeight(imageBuffer);
  size_t bytesPerRow = CVPixelBufferGetBytesPerRow(imageBuffer);
  uint8_t* bytes = static_cast<uint8_t*>(CVPixelBufferGetBaseAddress(imageBuffer));

  if (bytes == nil || width == 0 || height == 0) {
    CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
    return nil;
  }

  size_t startX = width / 4;
  size_t endX = width - startX;
  size_t startY = height / 4;
  size_t endY = height - startY;
  size_t step = 4;
  size_t bufferSize = bytesPerRow * height;

  double redSum = 0;
  size_t count = 0;

  for (size_t y = startY; y < endY; y += step) {
    for (size_t x = startX; x < endX; x += step) {
      size_t offset = y * bytesPerRow + x * 4;
      if (offset + 2 >= bufferSize) {
        CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);
        return nil;
      }

      // BGRA pixel format: B=offset, G=offset+1, R=offset+2, A=offset+3.
      redSum += bytes[offset + 2];
      count += 1;
    }
  }

  CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);

  if (count == 0) {
    return nil;
  }

  return @(redSum / (double)count);
}

VISION_EXPORT_FRAME_PROCESSOR(HeartRatePlugin, heartRatePlugin)

@end
