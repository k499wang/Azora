/**
 * Once per launch for each account, and deliberately not component state: the
 * gate unmounts on entitlement refetches, and a guard in a ref died with it.
 */
export function createBootPaywallLatch() {
  let presentedForUserId: string | null = null;
  return {
    hasPresented: (userId: string) => presentedForUserId === userId,
    markPresented: (userId: string) => {
      presentedForUserId = userId;
    },
  };
}

export const bootPaywallLatch = createBootPaywallLatch();
