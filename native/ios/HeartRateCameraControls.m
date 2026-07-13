#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HeartRateCameraControls, NSObject)

RCT_EXTERN_METHOD(lockForHeartRate:(NSString *)deviceId targetFps:(nonnull NSNumber *)targetFps)

RCT_EXTERN_METHOD(unlockForHeartRate:(NSString *)deviceId)

@end
