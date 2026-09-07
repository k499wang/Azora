# Coins, Floors, and Mochi's Home — Product & Change Doc

Status: approved direction; wallet and inventory foundations implemented, user-facing cutover not built
Date: 2026-09-06
Reviewed against the repository: 2026-09-07
Build plan: `docs/plans/room-currency-and-floors-plan.md`

---

## 1. The change in one sentence

Decorations stop being *granted* on a schedule and start being *bought* with a
currency the user earns by practising — which turns the hotel from an archive of
weeks into a building the user is paying to construct, one floor at a time, with
Mochi living on whichever floor they choose.

```text
Today
finish dailies -> one decoration granted -> forced into slot day(n) -> 7/7 seals the floor

After
finish dailies -> coins
open shop     -> spend coins on objects, floors, looks
open a floor  -> arrange freely, no cost, no order, no daily gate
```

---

## 2. Why change it

Three problems with the current loop, in order of severity.

1. **Effort above the minimum earns nothing.** `roomProgress.canClaim` is a
   once-per-day boolean. A user who does three dailies and a user who does three
   dailies plus four extra sessions progress at an identical rate. The app's most
   engaged behaviour is unrewarded.
2. **The reward has no cost, so the choice has no weight.** Five options, all
   free, all equal. It is a taste preference dressed as a decision.
3. **The building has no ambition.** A floor arrives every seven earn-days
   whether the user wants one or not. There is nothing to want, nothing to save
   for, and nothing that says *I chose this*.

A currency fixes all three at once: variable earn rewards effort, price creates
weight, and an expensive floor creates ambition.

---

## 3. What the user has

**Coins.** One currency, earned by practising, spent in the shop. Never bought
with money, never granted by subscription, never expiring.

**An inventory.** Every object the user buys is theirs permanently. An object
exists **once** — you own one checker rug, and it sits on one floor or another,
never both for new placements. Existing duplicate placements are preserved during
migration (see §12). This is the load-bearing rule of the whole economy; §7 explains why.

**A building.** The ground floor is free and everyone starts with it. Further
floors are purchased. Each floor has **seven slots**, one per object category
(rug, plant, small furniture, and so on — the existing `DAYS` categories).

**Looks are permanent unlocks.** Buy a shell once and apply it to any owned
floor, free, as often as desired. The default shell and every shell already used
in a user's building remain owned. A floor purchase includes an owned look; it
does not silently charge for a second purchase.

**Mochi lives on one floor at a time.** The user chooses which. Home shows the
floor Mochi is currently in. Moving Mochi is free, instant, and reversible.

---

## 4. What the user does

| Moment | What happens |
| --- | --- |
| Finishes all three dailies | +25 coins, shown on the result screen, quietly |
| Does an extra session | +5 coins, capped at two per day |
| Opens the Shop | Objects, Floors and Looks, priced, with a balance |
| Buys an object | It lands in inventory; a prompt offers to place it now |
| Buys a floor | Opens in the building, arriving part-furnished (3 objects) |
| Arranges a floor | Place, remove, swap — free, unlimited, any order |
| Moves Mochi | Picks a floor; Home now shows that room |

**Arranging never costs coins.** You pay to acquire, never to rearrange. That
single rule is what keeps the building feeling like a home rather than a meter.

---

## 5. What is removed

| Removed | Why |
| --- | --- |
| The Heart tab | The Heart page remains intact and opens from Home's top-bar bell. The tab slot becomes the Shop. |
| The `day1 → day7` fill order | Slots become categories you can fill in any order, or leave empty |
| `canClaim` / `claimedToday` / the one-per-day gate | Replaced by "can you afford it" |
| `NextRoomScreen` (pick your next room's look) | Looks become a purchase, not a consolation prize for finishing |
| Floor sealing | A floor is never finished; it is always editable |

**`HotelScreen`, `PyramidCanvas`, `pyramidLayout`, `RoomPager` all survive.**
The building view is the centrepiece of the new system, not a casualty of it.

### The Heart tab removal, specifically

The full Heart page remains a stack screen with RHR, HRV, recovery, recent
readings and its measurement button. Home's existing top-bar bell opens it. A
measurement remains optional and does not become a fourth qualifying daily.

---

## 6. What replaces "floor 12"

The old system's progress metric was floor count, which was really a count of
elapsed weeks. That reading goes away, because floors are now bought rather than
accrued. Two numbers replace it, both in Profile:

- **Collection: 12 of 35 objects.** Grows with the catalogue, never resets,
  generated for free by the shop.
- **Lifetime coins earned** — never reduced by spending. This is the honest
  record of practice, and unlike a streak it cannot be lost. Consistent with
  design principle 4: it is a count of something real, not an estimate.

---

## 7. The four rules that make it work

These are the conditions the design depends on. Each will feel inconvenient at
some point; each should be defended anyway.

### 7.1 An object exists once

Owning the checker rug means new placements can occupy *one* floor at a time.
Legacy duplicate placements stay visible, but cannot create additional copies.

This is the rule that keeps the shop alive. If objects duplicate across floors,
buying a floor means displaying everything you already own, the collection stops
competing with itself, and object demand collapses. With uniqueness, buying a
floor makes the collection feel *thinner* — a new floor generates demand for
objects rather than satisfying it.

The temptation to relax this will arrive as a generosity ("let them put their
favourite plant in every room"). It is not generosity; it is the end of the
economy.

### 7.2 Seven slots, forever

Never scale slots with wealth or floor count. Scarcity of display space is what
makes owning 35 objects interesting. Unlimited slots turn a collection into a
junk drawer.

### 7.3 A floor never arrives empty

A paid floor opens with three placed objects, not an empty room followed by an
optional setup that can be abandoned after payment.

**Proposed starter rule, pending review:** before checkout, choose three objects
from distinct categories. Each choice is either an owned, unplaced object or an
unowned catalogue object included in the floor price. Already placed objects are
unavailable; furnishing never silently empties another floor. Checkout creates
the floor, grants any new ownership, places all three objects, and deducts coins
atomically. Cancelling changes nothing. If three eligible categories are not
available, explain which objects must be freed before allowing purchase.

The free ground floor uses the same starter selection without a debit, created
once on confirmation. Existing ground floors and their contents are preserved.

### 7.4 Coins are never sold, and never a Pro perk

Coins have the same earn rules regardless of subscription status. Selling coins
would change the tone of the practice loop and is outside this design.
Coins come from practising. That is the only source.

---

## 8. Pacing and prices

Flat earn rate — no streak multiplier. The streak stays as a displayed stat and
does not affect coin income. Rationale: a multiplier makes a missed day cost *future*
income as well as today's, which is loss-framing by another name, and principle 3
says the blob is never hurt that you left.

| Action | Coins |
| --- | --- |
| All three dailies complete | 25 |
| Each extra session | 5, max 2/day |
| Typical day | 25 |
| Committed day | 35 |

| Item | Price | Notes |
| --- | --- | --- |
| Object, tier 1 | 30 | 2 typical earn-days from zero |
| Object, tier 2 | 60 | ~2–3 days |
| Object, tier 3 | 100 | ~4 days |
| Room look (shell) | 60 | |
| **Floor** | **250** | ~2 weeks at 5 practice days/week |

A floor at 250 is worth roughly 2.5–8 objects, so it is a genuine tradeoff rather
than an obvious purchase. It arrives with three objects included, which makes the
price honest rather than punitive.

**Tune the floor price, not the earn rate.** The earn rate is visible on every
result screen and users will remember it; the price of an unbought item can move
without anyone feeling robbed.

---

## 9. Content runway — the real constraint

There are **35 authored objects**, five in each of seven categories, and six
shells. Under the object-exists-once rule that is a hard cap:

> **35 objects ÷ 7 slots = a fully-furnished 5-floor building.**

So the launch shape is the free ground floor plus **four purchasable floors**. At
250 coins each, that is roughly two months of floor purchases, and rather longer
once objects compete for the same coins. That is an acceptable first version and
it should be stated plainly rather than discovered later.

The catalogue must grow before the building can. Cheapest expansions, in order of
value per hour of authoring:

1. **Split the shell into wall + floor pattern.** `roomShells.ts` already builds
   shells from a palette plus a pattern; they are merely bundled. Unbundling them
   gives 6 × 5 = 30 looks from existing art. Highest leverage in the whole app.
2. **Colorways.** Author an object once, sell it in several palettes.
3. **Mochi accessories.** A sink that keeps paying after the building is settled,
   and small to author.
4. **New objects within the existing seven categories**, on a slow cadence.

None of these are in scope now. They identify a finite content runway; no content
expansion schedule has been committed. After the catalogue is owned, show an
honest collection-complete state rather than implying more purchases exist.

---

## 10. Forward compatibility: a second currency

Blob XP is a likely future addition. The ledger is therefore keyed by currency
from day one — `wallet_entries.currency` defaults to `'coin'` — so adding XP is
an insert of a new value, not a migration and not a parallel table.

Nothing else in this design assumes a single currency. Prices are per-item and
could be denominated in either. What *is* assumed, and should stay true: **one
currency per sink.** Coins buy things; if XP arrives it should unlock or level
something, never co-price the same object. A two-currency checkout is where calm
apps start feeling like arcades.

---

## 11. How this reads against the design principles

| Principle | Effect |
| --- | --- |
| 1. Calm inside, celebration at the seams | Coin grants stay quiet on the result screen, replacing the current daily-completion sheet. The celebration is spent on a new floor opening. |
| 2. One screen answers "what now?" | Home still shows dailies and Mochi's current room. The Shop is a destination, never a Home badge. |
| 3. Blob is glad you came, never hurt you left | Flat earn rate, no multiplier to lose, no decay, no expiring balance. |
| 4. Numbers never flatter | Lifetime coins earned is a true count. Collection is a true count. Neither is smoothed or floored. |
| 5. A reward has to change something you own | Purchases unlock objects, looks, or furnished floors. A 35-coin day can buy a tier-1 object; a 25-coin day needs saving — a balance that only rises is the failure mode. |

**The coin balance never appears in the Home header.** It belongs next to prices,
in the shop, where the number means something. A number that goes up with nothing
to spend it on is precisely the "points with no home" that principle 5 rules out.

---

## 12. Migration

Existing users keep everything.

- Every existing room becomes an **owned floor**, free, at its current floor
  number. A user with four floors has a four-storey building.
- Every placed decoration stays exactly where it is, and is retroactively
  **owned** in inventory.
- Mochi is placed on the user's highest floor by default.
- Existing duplicate placements stay exactly where they are, even if only one
  duplicate exists. Inventory counts the option once; removing a duplicate does
  not grant a second copy or allow additional duplicate placements.
- Buildings already at or above five floors keep every floor and can arrange
  them, but cannot purchase another floor until the catalogue/cap expands.
- Previously earned rewards remain visible on their original History dates,
  even after the user moves, replaces, or removes their furnishings.
- No compensation coins, no legacy screens, no second mental model on screen.

Backfill ownership and historical reward records before switching on purchases
or mutable rooms. Older app versions must not keep adding untracked free rooms
and decorations after cutover; the build plan must settle that compatibility
boundary before release.

The only visible loss is that a floor is no longer "sealed" — which reads as a
gain, since it is now editable.

---

## 13. Decisions required before implementation

These affect behavior and cannot be left to individual screen implementations:

- Confirm the proposed starter rule above.
- Define an extra session: eligible session types, completion requirements,
  whether it must follow all three dailies, and how a completion contributing to
  two daily slots is counted. Define the reward date at completion and preserve
  it through retries, midnight, timezone changes, and app restarts. A persisted
  session ID identifies an extra reward; reopening its result cannot earn again.
- Map all 35 option IDs to price tiers. The three tier prices alone do not define
  a catalogue. Confirm whether the included starter choices span all tiers.
- Set the cutover date/version: no historical coin backpay is implied, and the
  old decoration reward and new coin reward must not both run after cutover.

## 14. Open questions, deliberately deferred

- Should a floor be **sellable back** for partial coins? Leaning no: refunds
  invite optimisation and this is a home, not a portfolio.
- Should objects be **giftable or shareable** between users? Out of scope; would
  need a second look at the uniqueness rule.
- Does the **building have a visible height cap**? The pyramid layout should not
  imply twenty floors that will never be authored.
