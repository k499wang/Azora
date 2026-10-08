#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CompletionAudio, NSObject)

RCT_EXTERN_METHOD(prepare:(NSString *)ownerId
                  uri:(NSString *)uri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(restart:(NSString *)ownerId
                  volume:(nonnull NSNumber *)volume
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(schedule:(NSString *)ownerId
                  volume:(nonnull NSNumber *)volume
                  targetTimeMs:(nonnull NSNumber *)targetTimeMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stop:(NSString *)ownerId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(release:(NSString *)ownerId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup { return NO; }

@end
