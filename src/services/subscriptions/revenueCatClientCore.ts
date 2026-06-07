export interface RevenueCatIdentityUser {
  id: string;
  email?: string | null;
}

export interface RevenueCatSdk {
  collectDeviceIdentifiers?: () => Promise<void>;
  configure: (options: { apiKey: string; appUserID: string }) => void;
  getCustomerInfo: () => Promise<unknown>;
  getCurrentOfferingForPlacement?: (placement: string) => Promise<unknown>;
  getOfferings?: () => Promise<{ current: unknown | null }>;
  isConfigured: () => Promise<boolean>;
  logIn: (appUserId: string) => Promise<unknown>;
  purchasePackage?: (revenueCatPackage: unknown) => Promise<{ customerInfo: unknown }>;
  restorePurchases?: () => Promise<unknown>;
  setEmail: (email: string | null) => Promise<void>;
  setLogLevel: (level: unknown) => Promise<void> | void;
}

export interface RevenueCatClientDependencies {
  apiKey: string | null;
  debugLogLevel: unknown;
  errorLogLevel: unknown;
  isDev: boolean;
  isSupportedPlatform: boolean;
  sdk: RevenueCatSdk;
}

export class RevenueCatSignedOutError extends Error {
  constructor() {
    super('RevenueCat is unavailable while signed out.');
    this.name = 'RevenueCatSignedOutError';
  }
}

export function createRevenueCatClient(
  dependencies: RevenueCatClientDependencies,
) {
  let currentAppUserId: string | null = null;
  let serialTask: Promise<void> = Promise.resolve();

  function runSerial(task: () => Promise<void>): Promise<void> {
    serialTask = serialTask.then(task, task);
    return serialTask;
  }

  async function ensureConfigured(appUserId: string): Promise<void> {
    if (!dependencies.isSupportedPlatform || dependencies.apiKey == null) {
      logRevenueCat('revenuecat.ensure_config_skipped', {
        reason: dependencies.isSupportedPlatform ? 'missing_api_key' : 'unsupported_platform',
        revenuecat_current_app_user_id: currentAppUserId,
      });
      return;
    }

    logRevenueCat('revenuecat.set_log_level_started', {
      revenuecat_target_app_user_id: appUserId,
      revenuecat_current_app_user_id: currentAppUserId,
    });
    await dependencies.sdk.setLogLevel(
      dependencies.isDev ? dependencies.debugLogLevel : dependencies.errorLogLevel,
    );
    logRevenueCat('revenuecat.set_log_level_completed', {
      revenuecat_target_app_user_id: appUserId,
      revenuecat_current_app_user_id: currentAppUserId,
    });

    const isConfigured = await dependencies.sdk.isConfigured();
    if (!isConfigured) {
      logRevenueCat('revenuecat.configure_started', {
        revenuecat_target_app_user_id: appUserId,
        revenuecat_current_app_user_id: currentAppUserId,
      });
      dependencies.sdk.configure({
        apiKey: dependencies.apiKey,
        appUserID: appUserId,
      });
      currentAppUserId = appUserId;
      logRevenueCat('revenuecat.configure_completed', {
        revenuecat_current_app_user_id: currentAppUserId,
      });
      return;
    }

    if (currentAppUserId !== appUserId) {
      logRevenueCat('revenuecat.login_started', {
        revenuecat_target_app_user_id: appUserId,
        revenuecat_current_app_user_id: currentAppUserId,
      });
      await dependencies.sdk.logIn(appUserId);
      currentAppUserId = appUserId;
      logRevenueCat('revenuecat.login_completed', {
        revenuecat_current_app_user_id: currentAppUserId,
      });
    }
  }

  function isReady(): boolean {
    return dependencies.isSupportedPlatform && dependencies.apiKey != null;
  }

  function requireCurrentAppUserId(): string {
    if (currentAppUserId == null) {
      throw new RevenueCatSignedOutError();
    }

    return currentAppUserId;
  }

  async function collectDeviceIdentifiers(): Promise<void> {
    if (!isReady() || dependencies.sdk.collectDeviceIdentifiers == null) return;

    try {
      await dependencies.sdk.collectDeviceIdentifiers();
    } catch {
      // Attribution metadata is best-effort and should never block the app.
    }
  }

  return {
    clearIdentity(): Promise<void> {
      return runSerial(async () => {
        logRevenueCat('revenuecat.clear_identity_started', {
          revenuecat_current_app_user_id: currentAppUserId,
        });
        currentAppUserId = null;
        logRevenueCat('revenuecat.clear_identity_completed', {
          revenuecat_current_app_user_id: currentAppUserId,
        });
      });
    },
    getCurrentAppUserId(): string | null {
      return currentAppUserId;
    },
    isReady,
    collectDeviceIdentifiers,
    requireCurrentAppUserId,
    async getCustomerInfo(): Promise<unknown> {
      requireCurrentAppUserId();
      if (!isReady()) {
        throw new Error('RevenueCat is not configured for this platform.');
      }

      return dependencies.sdk.getCustomerInfo();
    },
    async getOfferingForPlacement(placement: string): Promise<unknown | null> {
      requireCurrentAppUserId();
      if (!isReady()) {
        return null;
      }

      if (dependencies.sdk.getCurrentOfferingForPlacement != null) {
        return dependencies.sdk.getCurrentOfferingForPlacement(placement);
      }

      const offerings = await dependencies.sdk.getOfferings?.();
      return offerings?.current ?? null;
    },
    async purchasePackage(revenueCatPackage: unknown): Promise<unknown> {
      requireCurrentAppUserId();
      if (!isReady() || dependencies.sdk.purchasePackage == null) {
        throw new Error('RevenueCat purchases are not available.');
      }

      const result = await dependencies.sdk.purchasePackage(revenueCatPackage);
      return result.customerInfo;
    },
    async restorePurchases(): Promise<unknown> {
      requireCurrentAppUserId();
      if (!isReady() || dependencies.sdk.restorePurchases == null) {
        throw new Error('RevenueCat restore is not available.');
      }

      return dependencies.sdk.restorePurchases();
    },
    syncIdentity(user: RevenueCatIdentityUser): Promise<void> {
      return runSerial(async () => {
        logRevenueCat('revenuecat.sync_identity_started', {
          revenuecat_target_app_user_id: user.id,
          revenuecat_target_email: user.email ?? null,
          revenuecat_current_app_user_id: currentAppUserId,
          revenuecat_ready: isReady(),
        });
        if (!isReady()) {
          currentAppUserId = user.id;
          logRevenueCat('revenuecat.sync_identity_completed_local_only', {
            revenuecat_current_app_user_id: currentAppUserId,
            revenuecat_ready: false,
          });
          return;
        }

        await ensureConfigured(user.id);
        currentAppUserId = user.id;
        requireCurrentAppUserId();
        await collectDeviceIdentifiers();
        logRevenueCat('revenuecat.set_email_started', {
          revenuecat_current_app_user_id: currentAppUserId,
          revenuecat_target_email: user.email ?? null,
        });
        await dependencies.sdk.setEmail(user.email ?? null);
        logRevenueCat('revenuecat.set_email_completed', {
          revenuecat_current_app_user_id: currentAppUserId,
          revenuecat_target_email: user.email ?? null,
        });
        logRevenueCat('revenuecat.get_customer_info_started', {
          revenuecat_current_app_user_id: currentAppUserId,
        });
        await dependencies.sdk.getCustomerInfo();
        logRevenueCat('revenuecat.sync_identity_completed', {
          revenuecat_current_app_user_id: currentAppUserId,
          revenuecat_ready: true,
        });
      });
    },
  };
}

function logRevenueCat(
  event: string,
  payload: Record<string, unknown>,
): void {
  if (!(typeof __DEV__ !== 'undefined' && __DEV__)) {
    return;
  }

  console.log(`[identity-sync] ${event}`, {
    timestamp: new Date().toISOString(),
    ...payload,
  });
}
