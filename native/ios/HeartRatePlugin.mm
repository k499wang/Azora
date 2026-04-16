#import <VisionCamera/FrameProcessorPlugin.h>
#import <CoreMedia/CMSampleBuffer.h>
#import <CoreVideo/CoreVideo.h>
#import <QuartzCore/QuartzCore.h>
#import <math.h>

typedef struct {
  NSString* identifier;
  CGFloat x;
  CGFloat y;
  CGFloat width;
  CGFloat height;
  size_t targetSamples;
} HeartRateROI;

@interface HeartRatePlugin : FrameProcessorPlugin
@end

@implementation HeartRatePlugin

- (NSDictionary*)sampleROI:(HeartRateROI)roi
                    width:(size_t)width
                   height:(size_t)height
              bytesPerRow:(size_t)bytesPerRow
                    bytes:(uint8_t*)bytes
               bufferSize:(size_t)bufferSize {
  size_t startX = (size_t)floor((double)width * roi.x);
  size_t startY = (size_t)floor((double)height * roi.y);
  size_t roiWidth = MAX((size_t)1, (size_t)floor((double)width * roi.width));
  size_t roiHeight = MAX((size_t)1, (size_t)floor((double)height * roi.height));
  size_t endX = MIN(width, startX + roiWidth);
  size_t endY = MIN(height, startY + roiHeight);
  size_t sampleArea = MAX((size_t)1, (endX - startX) * (endY - startY));
  size_t step = MAX((size_t)2, (size_t)sqrt((double)sampleArea / (double)MAX((size_t)1, roi.targetSamples)));

  double redSum = 0;
  double greenSum = 0;
  double blueSum = 0;
  double redSquareSum = 0;
  size_t saturatedCount = 0;
  size_t darkCount = 0;
  size_t count = 0;

  for (size_t y = startY; y < endY; y += step) {
    for (size_t x = startX; x < endX; x += step) {
      size_t offset = y * bytesPerRow + x * 4;
      if (offset + 3 >= bufferSize) {
        continue;
      }

      double blue = bytes[offset];
      double green = bytes[offset + 1];
      double red = bytes[offset + 2];

      redSum += red;
      greenSum += green;
      blueSum += blue;
      redSquareSum += red * red;

      if (red >= 245 || green >= 245 || blue >= 245) {
        saturatedCount += 1;
      }

      if (red <= 10 && green <= 10 && blue <= 10) {
        darkCount += 1;
      }

      count += 1;
    }
  }

  if (count == 0) {
    return @{
      @"id": roi.identifier,
      @"r": @0,
      @"g": @0,
      @"b": @0,
      @"saturatedPct": @1,
      @"darkPct": @1,
      @"variance": @0,
    };
  }

  double redMean = redSum / (double)count;
  double variance = MAX(0, redSquareSum / (double)count - redMean * redMean);

  return @{
    @"id": roi.identifier,
    @"r": @(redMean),
    @"g": @(greenSum / (double)count),
    @"b": @(blueSum / (double)count),
    @"saturatedPct": @((double)saturatedCount / (double)count),
    @"darkPct": @((double)darkCount / (double)count),
    @"variance": @(variance),
  };
}

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

  size_t bufferSize = bytesPerRow * height;
  HeartRateROI rois[] = {
    {@"full", 0.05, 0.05, 0.9, 0.9, 1400},
    {@"center", 0.25, 0.25, 0.5, 0.5, 900},
    {@"inner", 0.35, 0.35, 0.3, 0.3, 600},
    {@"left", 0.05, 0.2, 0.45, 0.6, 700},
    {@"right", 0.5, 0.2, 0.45, 0.6, 700},
    {@"top", 0.2, 0.05, 0.6, 0.45, 700},
    {@"bottom", 0.2, 0.5, 0.6, 0.45, 700},
  };
  NSMutableArray* roiSamples = [NSMutableArray arrayWithCapacity:7];

  for (NSUInteger i = 0; i < 7; i++) {
    [roiSamples addObject:[self sampleROI:rois[i]
                                    width:width
                                   height:height
                              bytesPerRow:bytesPerRow
                                    bytes:bytes
                               bufferSize:bufferSize]];
  }

  CVPixelBufferUnlockBaseAddress(imageBuffer, kCVPixelBufferLock_ReadOnly);

  double timestampMs = CACurrentMediaTime() * 1000.0;

  return @{
    @"timestamp": @(timestampMs),
    @"rois": roiSamples,
  };
}

VISION_EXPORT_FRAME_PROCESSOR(HeartRatePlugin, heartRatePlugin)

@end
