# Referral Program Plan

This document is the simplest referral system I would ship for this app while still keeping it hard to abuse.

The goal is not to build a giant affiliate platform.

The goal is:

- let users invite other users
- credit the inviter correctly
- stop obvious abuse
- keep the implementation small
- keep it easy to extend later

## Best System

Use **Supabase** for the referral system.

Why:

- the app already plans to use Supabase Auth and Supabase data storage
- referral logic needs server-side validation
- Supabase gives us RLS for protection and RPCs for trusted writes
- this keeps referral state in the same backend as the rest of the app

Do **not** put referral trust logic in the client.

The client can:

- show a code
- share a code
- submit a code

The server must:

- validate the code
- prevent self-referrals
- prevent duplicate claims
- grant rewards only after a qualifying event

## What The Referral Program Should Do

Simple version:

1. Every user gets one referral code.
2. They share it.
3. A new user enters that code after sign-up or during onboarding.
4. The backend records the referral claim.
5. The referred user must complete a real qualifying action.
6. Only then does the backend grant the reward.

## Best Qualifying Action

Pick one simple qualifying action.

Best options for this app:

- first completed heart-rate measurement
- first completed breathing session
- first completed daily hold

The cleanest choice is usually:

- **first completed heart-rate measurement**

Why:

- it is a real product action
- it is hard to fake compared to just opening the app
- it proves the referred user actually used the app

## Best Reward

Keep the reward simple.

Good rewards:

- free Pro days
- one-time unlock credit
- a small subscription discount

For V1, I would choose:

- **1 free Pro week after qualification**

That is easy to understand and easy to communicate.

If you want to avoid subscription complexity at first, use:

- a temporary Pro entitlement credit

## Data Model

Keep the schema small.

Recommended tables:

### `profiles`

Add:

- `referral_code`
- `referred_by_user_id`

### `referrals`

Fields:

- `id`
- `referrer_user_id`
- `referred_user_id`
- `code`
- `status`
- `claimed_at`
- `qualified_at`
- `reward_granted_at`

### Optional `referral_rewards`

Only add this if you want a more explicit reward ledger later.

For V1, `referrals` alone is enough.

## State Machine

Keep the referral lifecycle explicit.

Recommended statuses:

- `available`
- `claimed`
- `qualified`
- `reward_granted`
- `rejected`

This keeps the program easy to reason about.

Example:

```text
available -> claimed -> qualified -> reward_granted
available -> rejected
claimed -> rejected
claimed -> available  (only if you intentionally allow code change / reset)
```

## Anti-Abuse Rules

These are the rules that matter most.

### 1. No self-referrals

The same user cannot refer themselves.

### 2. One claim per user

Each new user can claim only one referral code.

### 3. One reward per referred user

Do not grant multiple rewards for the same referred account.

### 4. Reward only after qualification

Entering a code should not grant the reward.

The user must complete a real product action first.

### 5. Server-side validation only

The client should never be trusted to mark a referral as valid.

### 6. Optional delay window

If abuse becomes a problem later, add a short delay before the reward is granted.

That is not required for V1.

### 7. Optional account-age check

If needed later, require the account to be older than a small threshold before the reward is granted.

That is also not required for V1.

## Server-Side Flow

### Step 1: Generate a referral code

When a profile is created:

- generate a short code
- store it on the profile
- ensure it is unique

Example code style:

- `A7K9Q2`
- `B4M8T1`

Keep it short and easy to share.

### Step 2: Claim a code

Add one Supabase RPC, something like:

- `claim_referral_code(code text)`

This function should:

- look up the code
- verify the user is signed in
- reject self-referral
- reject duplicate claims
- insert the referral row atomically

### Step 3: Record qualification

When the referred user completes the chosen qualifying action:

- check whether they have a claimed referral
- if yes, mark it `qualified`

### Step 4: Grant reward

After qualification:

- mark the referral `reward_granted`
- grant the reward only once

This can be done by:

- a second RPC
- a Postgres trigger
- a backend job if you want more control later

For V1, a simple RPC or trigger is enough.

## Recommended App Flow

### In the app

The app should only handle:

- showing the referral code
- copying or sharing the code
- accepting a code
- showing referral status

### In the backend

The backend should handle:

- ownership
- validation
- qualification
- reward granting

That keeps the app simple and secure.

## Suggested File Structure

Add a small referral boundary in the app:

```text
src/
  services/
    referrals/
      referralClient.ts
      referralService.ts
      referralTypes.ts
      referralEvents.ts
  hooks/
    useReferral.ts
  components/
    referrals/
```

Responsibilities:

- `referralClient.ts`
  - Supabase calls

- `referralService.ts`
  - claim code
  - fetch referral status
  - fetch current user code

- `referralTypes.ts`
  - typed referral state and RPC results

- `referralEvents.ts`
  - analytics event names

- `useReferral.ts`
  - orchestration hook for screens

## Where To Show It In The App

Good places:

- profile screen
- post-signup onboarding
- share sheet after a successful action

Good UI sections:

- “Invite friends”
- “Your code”
- “Enter a referral code”
- “Your reward status”

## What To Track

Track the funnel with analytics.

Recommended events:

- `referral_code_viewed`
- `referral_code_shared`
- `referral_code_copied`
- `referral_code_entered`
- `referral_code_claimed`
- `referral_qualified`
- `referral_reward_granted`
- `referral_claim_failed`

Useful properties:

- `source_screen`
- `success`
- `failure_reason`
- `reward_type`
- `placement`

## What Not To Do

Do not:

- store referral trust in the client
- reward immediately on code entry
- allow multiple referrals per user
- make the flow dependent on manual admin intervention
- overbuild a marketplace or affiliate dashboard in V1

## Minimal V1 Rule Set

If you want the simplest safe version, ship only this:

- every user gets a unique code
- one new user can claim one code
- self-referrals are blocked
- code claim is server-validated
- reward is granted only after the referred user completes one real app action
- referral events are tracked in analytics

That is enough for a real referral program.

## Recommended Rollout

1. Add referral code generation on profile creation.
2. Add code claim RPC.
3. Add referral status storage.
4. Add qualification check on one real user action.
5. Grant reward once.
6. Add analytics.
7. Add UI entry points in profile and onboarding.

## Best First Version For This App

I would ship:

- a short referral code
- one claim action
- one qualification action
- one reward
- one analytics funnel

That is the best balance of simple and safe.

## Final Recommendation

For this app, the best referral system is:

- **Supabase-backed**
- **server-validated**
- **one code per user**
- **one reward per referred user**
- **reward only after a real qualifying action**

That is the simplest version that still works properly and resists obvious abuse.
