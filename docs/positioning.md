# Positioning

What Azora claims to be, ranked, so copy written months apart makes the same
promise. `docs/azo-story.md` fixes who Mochi is; `design.md` fixes how the app
looks and behaves; this fixes what the app *says it is*.

Read this before writing onboarding copy, paywall copy, notification copy, App
Store text, or an ad brief.

---

## The sentence

> Your days got away from you. Azora gives you a short daily reset — and shows
> you in your own heart rate that it's working.

Problem, mechanism, proof, in that order.

Say it the same way everywhere: App Store subtitle, `personalizeIntro`, the
paywall headline, the ad hook. Rewording it per surface to avoid repetition is
how the framing goes soft. Repetition is the mechanism.

---

## The three stories, ranked

Azora tells three stories. Told at equal volume they cancel out, which is the
root of every "this feels muddled" note. Each has a rank and a home.

| Rank | Story | Leads on |
| --- | --- | --- |
| **Pitch** | Your days got away from you | Ads, App Store, onboarding 1–5, paywall |
| **Proof** | Your body shows it, and we measure it | Heart module, diagnosis, the home stat |
| **Pull** | Mochi's room fills as you rebuild | Home hero, reward moments, notifications |

**The rule: a story never appears above its rank on a given screen.**

- Mochi never opens an ad.
- The camera never opens onboarding.
- The life claim is never absent from either.

That rule decides most framing questions without further judgment.

### Why this order

The life claim is the pitch because it is the largest true thing we can say and
the one the product already delivers — the assessment audits procrastination,
routine, sleep and days, and `onboardingStarterPlan.ts` writes a to-do list out
of those answers. Leading with breathing undersells a product that is mostly
not about breathing.

Measurement is the proof rather than the pitch because it is the only thing in
Azora a competitor cannot screenshot, and because a proof beat lands hardest
after a claim, not before one. It must never be removed — a life-reset app
without a physiological receipt is indistinguishable from every other one.

Mochi is the pull because care is a better reason to return than discipline,
but a mascot cannot explain what an app does. He earns attention we already
have; he does not win it.

---

## Vocabulary

The banned-words round on "breathwork" and "exercise" worked — the app reads as
one voice now. Same discipline, extended to the life frame.

**Say**

- **Reset** — the unit of practice, from a two-minute session to the whole day.
  Scales, which is why it survives the reframe.
- **The Azora Protocol** — the named practice, and the name of the plan every
  user is put on. Our only proprietary term; it carries the seriousness the life
  frame needs. One name, never five: five titled plans read as a catalogue to
  choose between, which is the browsing frame we reject below. What differs
  between two people's Protocol is its days and its outcome line.
- **Your day**, **your days** — what the product acts on.

**Never say**

- **Breathwork**, **exercise** — settled, already swept.
- **Dailies** — game jargon that reads as chores, on our most-viewed screen.
  User-facing, the section is *My Plan*, because what is in it comes from the
  plan and changes as the plan grows. Internal identifiers keep `dailies`.
- **Session** in user-facing copy — it is a Reset. Code keeps `session`.
- **Practice**, **journey**, **mindfulness**, **wellness** — category wallpaper
  that makes us sound like the apps we are not.
- Privacy denials — no "never shared or sold", no "stays private". Positive
  independence framing only.

---

## We are not

- **Not a meditation app.** No library to browse, no content to complete. The
  plan hands out one thing to do, and adds a second and a third on days it has
  already chosen; the user never picks from a menu of them.
- **Not a habit tracker.** The to-dos are written from the assessment, not
  configured by the user, and nothing decays if they are missed.
- **Not a streak game.** Mochi is glad you came, never hurt that you left.
  Absence changes nothing on screen. See `design.md` principle 3.

---

## Two standing checks

**The six-screen test.** Six screens into onboarding, three seconds into an ad,
or from the App Store subtitle alone, a stranger must be able to finish "it's an
app that ___". If they cannot, the framing failed there, however good each
screen is on its own.

**Numbers never flatter.** `design.md` principle 4 is absolute and it is a
positioning commitment, not only an ethical one. The honest number is what makes
the pitch believable, so no claim may imply an improvement we did not measure.
