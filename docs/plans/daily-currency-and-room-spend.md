# Daily Currency and Room Spending — Simple Supabase Plan

Status: future proposal  
Date: 2026-08-30

## The change in one sentence

Finishing all three of Today's Dailies grants currency, and decorating a room
later spends that currency.

```text
Current
finish dailies -> earn one decoration -> place it

Proposed
finish dailies -> earn currency
open room later -> spend currency -> place decoration
```

This uses the existing Supabase backend. It does not need another service, an
inventory system, multiple currencies, XP, or a large economy framework.

## What the user sees

### After finishing Today's Dailies

Today, the completion result asks the user to choose a decoration.

After the pivot, it shows something like:

```text
All 3 dailies done
+10 [currency]
Balance: 30

Continue
```

The user returns Home. They are not forced into the room flow.

### When opening the room

The existing room and decoration picker remain. The picker now shows a fixed
price:

```text
Decoration: 20 [currency]
Your balance: 30
```

Confirming the choice spends 20 and places the decoration. If the balance is
too low, the picker explains that more currency can be earned by completing
Today's Dailies.

## What stays the same in Azora

- Today's Dailies are still the recommended breathing technique, hand-picked
  technique, and daily breath hold.
- `src/hooks/useDailiesCompletion.ts` still decides when all three are done.
- The existing room art and decoration options remain.
- Room slots still fill from `day1` through `day7`.
- Seven decorations still complete a room.
- Completed rooms still appear in the hotel.
- Users still choose the look of their next room.
- Every existing room and decoration remains owned and visible.

## What changes in Azora

### Daily completion becomes the earn action

When `useDailiesCompletion` reports that all three canonical activities are
complete, the app calls Supabase to grant that day's currency.

The grant is stored immediately. It does not depend on opening the room or
placing a decoration.

### Room placement becomes the spend action

`RoomDecorateScreen` no longer asks whether today's dailies are complete or
whether today's decoration was claimed. It asks only:

- what is the next open slot;
- what is the user's balance;
- can the user afford the fixed decoration price?

Confirming a choice deducts the price and inserts the decoration together.

## The complete Supabase model

Use one new table and one read-only view.

### `currency_transactions`

Every currency change is one row:

```text
currency_transactions
  id                uuid primary key
  user_id           uuid references profiles(user_id)
  amount            integer, non-zero
  transaction_type  daily_reward | decoration_purchase | adjustment
  idempotency_key   text
  local_date        date
  created_at        timestamptz

  unique (user_id, idempotency_key)
```

Positive amounts are earnings. Negative amounts are purchases.

Example:

```text
+10  daily_reward
+10  daily_reward
-20  decoration_purchase
-------------------------
  0  current balance
```

There is no separate wallet table. The balance is the sum of the user's
transactions. That is sufficient for this app and keeps the system small.

### `user_currency_balance_v`

Add a `security_invoker` Supabase view that groups transactions by user and
returns the sum as `balance`. A user with no transaction row has a balance of
zero in the app.

The client may read its own transactions and balance. It cannot insert, update,
or delete them directly. Only the two Supabase RPCs below change currency.

## RPC 1: grant the daily currency

Add:

```text
claim_daily_currency(
  local_date,
  guided_technique_id,
  hand_picked_technique_id
)
```

The function:

1. Gets the user from `auth.uid()`.
2. Verifies that the two technique IDs are different and known.
3. Verifies completed `breathing_sessions` for both techniques on that date.
4. Verifies `daily_activity.daily_breath_hold_completed` on that date.
5. Inserts one positive transaction using the key
   `daily-reward:YYYY-MM-DD`.
6. Returns the amount granted and the new balance.

The unique idempotency key means calling the function again for the same date
does not grant currency twice. If the first request succeeded but the response
was lost, retrying returns the existing grant and current balance.

The daily reward amount is a constant owned by the Supabase function. The app
does not submit the amount.

### Why the technique IDs are passed in

Azora currently resolves the assigned techniques in TypeScript. There is no
simple daily-assignment table in Supabase. Passing the two resolved IDs avoids
reimplementing the seven-day plan in SQL, while Supabase still verifies that
the user actually completed both sessions and the breath hold.

That is enough for a private cosmetic currency. If the currency is ever sold,
transferred, or used competitively, daily assignments should first become
canonical server records.

## RPC 2: purchase and place a decoration

Replace the current direct `placeDecoration` insert with:

```text
purchase_room_decoration(
  operation_id,
  slot,
  option_id,
  local_date
)
```

The function:

1. Gets the user from `auth.uid()`.
2. Locks the user's `profiles` row so two purchases cannot spend the same
   balance concurrently.
3. Calculates the current balance from `currency_transactions`.
4. Checks that the user can afford the fixed decoration price.
5. Reads or lazily creates the current room.
6. Verifies that `slot` is the next empty room slot.
7. Inserts one negative currency transaction.
8. Inserts the selected `room_decorations` row.
9. Returns the new balance and complete current room.

The debit and decoration insert happen inside one Supabase function call and
one database transaction. Either both happen or neither happens.

The client creates one `operation_id` before the request and reuses it for a
retry. That prevents a double charge after repeated taps or a lost response.

All decorations use one fixed server-owned price initially. The current
client-side authored options remain the catalog. A server pricing/catalog table
is only needed later if different decorations receive different prices.

## Backward compatibility

Backward compatibility means preserving the data created by the current room
system.

### Existing decorations

- Do not delete, convert, or charge for any existing decoration.
- Existing `rooms` and `room_decorations` rows continue rendering normally.
- Existing decorations are treated as legacy-owned items.
- Add an optional `currency_transaction_id` to `room_decorations`.
- Old rows have `currency_transaction_id = null`.
- New purchased rows link to their negative currency transaction.

The renderer does not need to care whether a decoration is legacy or purchased.
It continues reading `slot` and `option_id` exactly as it does today.

### `earned_local_date`

Keep `room_decorations.earned_local_date` so old clients and History do not
break during the transition. For a new purchase, store the placement date in
that field even though its old name is no longer ideal.

The new source of truth for what was earned on a date is the positive currency
transaction, not the decoration row.

### Transition day

Before granting currency for the cutover date, the grant RPC checks whether an
unlinked legacy decoration (`currency_transaction_id is null`) already exists
with the same `earned_local_date`. If it does, that date is considered already
rewarded and does not also receive currency. New purchased decorations are
linked to their debit, so buying one does not block that day's daily reward.

Past decorations are not converted into a starting balance. A small starting
balance can be added later as one `adjustment` transaction if desired, but it is
not required for compatibility.

### Old app versions

The current app writes decorations directly. The new app will use only the
purchase RPC.

For a simple rollout:

1. Add the transaction table, balance view, and RPCs without removing current
   room policies.
2. Release the new app.
3. Once the new version is required, remove direct room-decoration write
   policies so future placements must use the purchase RPC.

Supporting old and new binaries indefinitely would let old clients place free
decorations without a debit. Requiring the currency-compatible version at
cutover is the simplest honest solution.

## Exact app changes

### Keep

- `src/hooks/useDailiesCompletion.ts`
- Existing room rendering components
- Existing authored decoration choices
- Hotel and completed-room storage
- `RoomDecorate` and next-room navigation routes

### Change

- `src/features/room/useDailyCompleteSnapshot.ts`
  - snapshot daily progress only;
  - remove `RoomClaim`, `nextSlot`, and room eligibility.
- `src/features/room/DailyCompleteSheet.tsx`
  - replace **Choose your decoration** with the currency receipt;
  - support saving, success, and retry states.
- `src/screens/SessionCompleteScreen.tsx`
  - stop replacing the result route with `RoomDecorate`.
- `src/screens/ShareableResultScreen.tsx`
  - stop replacing the result route with `RoomDecorate`.
- `src/screens/HomeScreen.tsx`
  - read daily reward state, balance, and room state separately;
  - retry an eligible daily grant if the result screen closed early.
- `src/lib/room/roomProgress.ts`
  - keep `placedCount`, `nextSlot`, and `isComplete`;
  - remove `claimedToday` and `canClaim` after the legacy path is retired.
- `src/screens/RoomDecorateScreen.tsx`
  - read balance instead of daily entitlement;
  - show the fixed price and insufficient-balance state;
  - call the purchase RPC.
- `src/services/room/roomService.ts`
  - replace the direct placement sequence with the RPC call.
- `src/queries/room/usePlaceDecorationMutation.ts`
  - replace it with a purchase mutation;
  - update both balance and current-room caches from the RPC response.

### Add

- `src/services/rewards/currencyService.ts`
- `src/queries/rewards/useCurrencyBalanceQuery.ts`
- `src/queries/rewards/useClaimDailyCurrencyMutation.ts`
- `src/features/rewards/useDailyCurrencyReward.ts`
- One additive Supabase migration containing the transaction table, balance
  view, RLS, and both RPCs.

No inventory module, shop service, wallet table, XP module, or external backend
is required.

## History, analytics, and documentation

- Keep `dailies_completed` because it still describes completing the routine.
- Replace `room_reward_unlocked` with `daily_currency_granted`.
- Record `currency_amount` and `balance_after`.
- Add the price and resulting balance to `room_decoration_placed`, or rename it
  to `room_decoration_purchased`.
- Use `currency_transactions`, not PostHog, to calculate real earning and
  spending totals.
- Update History so daily currency earned and decorations placed are separate
  events.
- Update `docs/query-cache-invalidation-map.md` for the balance query and both
  mutations.
- Rewrite `docs/mochi-story.md` and onboarding copy because the current product
  story explicitly says there is no economy and promises one daily decoration.

## Minimum tests

Supabase tests:

- claiming the same date twice produces one positive transaction;
- two concurrent claims produce one reward;
- insufficient balance inserts neither a debit nor a decoration;
- retrying one purchase operation produces one debit and one decoration;
- concurrent purchases cannot make the balance negative;
- one user cannot read or mutate another user's transactions;
- existing decorations with a null currency link still render;
- the transition date cannot receive both a legacy decoration and currency.

App tests:

- the third daily shows the currency receipt instead of forcing room navigation;
- Home can retry a missed grant safely;
- purchasing updates the displayed balance and room together;
- insufficient balance has a clear message;
- existing rooms and the hotel are unchanged.

## Decisions needed later

- Currency name and icon.
- Daily reward amount.
- Fixed decoration price.
- Whether to provide a one-time starting balance.
- The minimum supported app version for the cutover.

Everything else can stay out of the first implementation.
