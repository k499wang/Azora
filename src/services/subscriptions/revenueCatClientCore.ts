export interface RevenueCatIdentityUser {
  id: string;
  email?: string | null;
}

export interface RevenueCatSdk {
  configure: (options: { apiKey: string; appUserID: string }) => void;
  getCustomerInfo: () => Promise<unknown>;
  isConfigured: () => Promise<boolean>;
  logIn: (appUserId: string) => Promise<unknown>;
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
      return;
    }

    await dependencies.sdk.setLogLevel(
      dependencies.isDev ? dependencies.debugLogLevel : dependencies.errorLogLevel,
    );

    const isConfigured = await dependencies.sdk.isConfigured();
    if (!isConfigured) {
      dependencies.sdk.configure({
        apiKey: dependencies.apiKey,
        appUserID: appUserId,
      });
      currentAppUserId = appUserId;
      return;
    }

    if (currentAppUserId !== appUserId) {
      await dependencies.sdk.logIn(appUserId);
      currentAppUserId = appUserId;
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

  return {
    clearIdentity(): Promise<void> {
      return runSerial(async () => {
        currentAppUserId = null;
      });
    },
    getCurrentAppUserId(): string | null {
      return currentAppUserId;
    },
    isReady,
    requireCurrentAppUserId,
    syncIdentity(user: RevenueCatIdentityUser): Promise<void> {
      return runSerial(async () => {
        if (!isReady()) {
          currentAppUserId = user.id;
          return;
        }

        await ensureConfigured(user.id);
        currentAppUserId = user.id;
        requireCurrentAppUserId();
        await dependencies.sdk.setEmail(user.email ?? null);
        await dependencies.sdk.getCustomerInfo();
      });
    },
  };
}
