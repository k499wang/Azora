#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CameraSettingsLock, NSObject)

RCT_EXTERN_METHOD(lockSettings:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(unlockSettings:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
