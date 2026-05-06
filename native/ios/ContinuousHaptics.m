#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(ContinuousHaptics, NSObject)

RCT_EXTERN_METHOD(start:(nonnull NSNumber *)intensity
                  sharpness:(nonnull NSNumber *)sharpness
                  duration:(nonnull NSNumber *)duration)

RCT_EXTERN_METHOD(stop)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end

@interface RCT_EXTERN_MODULE(HeartRateCameraControls, NSObject)

RCT_EXTERN_METHOD(lockForHeartRate:(NSString *)deviceId
                  options:(NSDictionary *)options)

RCT_EXTERN_METHOD(unlockForHeartRate:(NSString *)deviceId)

@end
