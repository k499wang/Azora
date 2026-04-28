hat It Is

  React Query is the layer that manages data that comes from your backend.

  In this app, that means data like:

  - onboarding status
  - profile
  - entitlement/subscription state
  - streaks
  - breath-hold stats
  - daily activity
  - session history

  It is not for:

  - auth boot state
  - whether a modal is open
  - current onboarding step
  - timer values during a session

  Those belong in:

  - Zustand for small app-global client state
  - local React state for screen/workflow state

  For this repo, the mental model is:

  - services/ = how to talk to Supabase
  - queries/ = how to cache and use that data in React
  - screens/components = how to display it

  Why This App Uses It

  Without React Query, every screen has to do this itself:

  - fetch data
  - track loading
  - track error
  - cache result
  - decide when to refetch
  - refresh after writes

  React Query does that for you.

  That is why useAppGate() can ask “is onboarding complete?” through a query
  instead of hand-rolling fetch state.

  Example:

  - src/queries/profile/useOnboardingStatusQuery.ts:1
  - src/queries/profile/useCompleteOnboardingMutation.ts:1

  The 3-State Rule

  For this app, always decide first:

  1. Local UI/workflow state?
     Use useState, useRef, useEffect
     Examples:

  - current breathing phase
  - timer countdown
  - selected onboarding intent

  2. Small app-global client state?
     Use Zustand
     Examples:

  - current auth session
  - current user
  - auth boot status
    See src/stores/authStore.ts:1

  3. Backend/server state?
     Use React Query
     Examples:

  - onboarding status
  - user entitlement
  - breath-hold stats

  If you remember only one thing, remember that rule.

  How The Pattern Works Here

  The usual flow is:

  1. Service function in src/services/...
     This does the real Supabase call.

  Example:

  - src/services/profile/onboardingStatusService.ts:1

  2. Query hook in src/queries/...
     This wraps the service with caching/refetch behavior.

  Example:

  - src/queries/profile/useOnboardingStatusQuery.ts:1

  3. Screen or hook uses the query
     Example:

  - src/hooks/useAppGate.ts:1

  So:

  - service = backend access
  - query hook = React Query logic
  - screen/hook = UI usage

  Basic Query Syntax

  This is the core shape:

  return useQuery({
    queryKey: ['onboarding-status', userId],
    enabled: userId != null,
    queryFn: () => getOnboardingStatus(userId as string),
  });

  What each part means:

  - useQuery(...)
    This creates a cached backend read.
  - queryKey
    This is the cache identity.
    If the key is the same, React Query treats it as the same data.
    If the key changes, it is a different cache entry.
  - enabled
    This says whether the query should run at all.
    Very important for auth-dependent data.
    If userId is missing, do not fetch.
  - queryFn
    The actual async fetch function.

  Query Keys

  A query key is just the name of the cached data.

  Examples:

  - ['onboarding-status', userId]
  - ['entitlement', userId]
  - ['breath-hold-stats', userId]

  Why include userId?
  Because user A’s stats and user B’s stats must not share cache.

  That is why this helper pattern is good:

  export function getBreathHoldStatsQueryKey(userId: string | null) {
    return ['breath-hold-stats', userId] as const;
  }

  What A Query Returns

  A query gives you things like:

  - data
  - isLoading
  - isError
  - error
  - refetch

  Example usage:

  const statsQuery = useBreathHoldStatsQuery(user?.id ?? null);

  if (statsQuery.isLoading) return <Loading />;
  if (statsQuery.isError) return <ErrorState />;
  return <StatsCard stats={statsQuery.data} />;

  In this app, that is usually enough.

  Mutations

  A mutation is a write:

  - update onboarding
  - save profile
  - restore subscription
  - complete breath-hold session

  Example from this repo:

  return useMutation({
    mutationFn: async () => {
      if (userId == null) {
        throw new Error('Cannot complete onboarding without a signed-in
  user.');
      }

      await completeOnboarding(userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: getOnboardingStatusQueryKey(userId),
      });
    },
  });

  What this does:

  - mutationFn performs the write
  - onSuccess tells React Query: “the old cached data is now stale”

  That invalidateQueries(...) part is one of the most important patterns in
  the app.

  Invalidation

  Invalidation means:

  - “this cached data may no longer be correct”
  - “please refresh it next time / now depending on usage”

  Example:

  - user completes onboarding
  - cached onboarding status was false
  - now it should be true
  - invalidate ['onboarding-status', userId]

  Then the app re-reads and the root gate updates.

  For future breath-hold stats:

  - user finishes a breath hold
  - you save the session
  - invalidate ['breath-hold-stats', userId]
  - Home/Profile cards update

  Caching And Refetching

  This is the part that usually confuses people.

  React Query keeps data in memory.
  So if you already fetched something, it does not always need to fetch again
  immediately.

  Important options:

  - staleTime
    How long data is considered fresh
  - gcTime
    How long unused cached data stays in memory
  - refetchOnMount
    Whether remounting should refetch
  - refetchOnWindowFocus
    Whether app/window focus should refetch

  In your app, QueryClient is set globally in src/app/providers/
  AppProviders.tsx:1 with:

  - retry: 1
  - refetchOnWindowFocus: false

  That means the app already avoids some noisy refresh behavior.

  For a stats card, you might do:

  useQuery({
    queryKey: ['breath-hold-stats', userId],
    enabled: userId != null,
    queryFn: () => getBreathHoldStats(userId as string),
    staleTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  That means:

  - fetch once
  - treat it as fresh for 10 minutes
  - do not refetch every time the screen remounts

  Why This Is Good For Your App

  For your app, a lot of data is:

  - user-specific
  - backend-backed
  - shared across screens
  - updated after writes

  That is exactly what React Query is good at.

  Example:

  - Home screen shows best breath hold
  - Profile screen shows statistics
  - Daily result screen saves a new record
  - one invalidation can refresh both Home and Profile data

  Without React Query, you would manually pass refresh flags around or build
  your own cache.

  Best Pattern For This Repo

  When adding a new backend-backed feature, use this order:

  1. Add service function
     Example:
     src/services/tracking/breathHoldService.ts
  2. Add query hook
     Example:
     src/queries/tracking/useBreathHoldStatsQuery.ts
  3. Use it in screen/component
  4. If you add a write, add a mutation hook too
  5. Invalidate related query keys on success

  That is the house pattern.

  What Not To Do

  Do not:

  - fetch Supabase directly inside lots of screens
  - put backend records into Zustand
  - use React Query for local timer state
  - create random query keys in different formats for the same data
  - forget to invalidate after writes

  Tradeoffs

  React Query is great, but not free.

  Pros:

  - caching
  - loading/error handling
  - fewer duplicate fetches
  - predictable refresh after writes
  - easier shared backend state across screens

  Cons:

  - extra abstraction to learn
  - you must think about query keys
  - you must think about invalidation
  - you can get stale data if cache settings are wrong

  For this app, the pros clearly win.

  Simple Real Example For Your App

  If you wanted breath-hold stats:

  Service:

  export async function getBreathHoldStats(userId: string):
  Promise<BreathHoldStats> {
    // Supabase read here
  }

  Query:

  export function useBreathHoldStatsQuery(userId: string | null) {
    return useQuery({
      queryKey: ['breath-hold-stats', userId],
      enabled: userId != null,
      queryFn: () => getBreathHoldStats(userId as string),
      staleTime: 1000 * 60 * 10,
      refetchOnMount: false,
    });
  }

  UI:

  const user = useAuthStore((state) => state.user);
  const statsQuery = useBreathHoldStatsQuery(user?.id ?? null);

  That is the whole pattern.

  Rule Of Thumb

  Ask this every time:

  - “Is this from the backend?”
    If yes, probably React Query.
  - “Is this just app-local shared state?”
    If yes, probably Zustand.
  - “Is this just this screen’s temporary state?”
    If yes, local React state.

  If you want, I can do a follow-up that is even more concrete:

  1. build a fake breath hold stats feature end-to-end as an example
  2. explain every line of the service, query hook, and screen usage in plain
     English