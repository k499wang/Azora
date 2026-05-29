# Result-Screen Research — Credible Wellness Apps

Research backing the lung-age daily-result screen (`src/screens/ShareableResultScreen.tsx`) and share card (`src/components/exercise/ShareCard.tsx`).

Scope: modeled on **trusted wellness products** (WHOOP, Oura, Bevel, Gentler Streak, Apple Health) — not social-media-trend apps. The goal is a result screen people respect *because it's credible and useful*, where sharing is a byproduct of trust, not a growth hack bolted on.

Core finding: the best wellness result screens win on **one clear number, grounded in science, framed kindly, judged against the user's own baseline.** They translate raw data into plain words and a single next action.

---

## Reference apps (concrete details)

### WHOOP — one number, oversized type, narrow color language
- Composite of HRV, resting HR, respiratory rate, sleep → a **single 0–100% Recovery score**. One number gives the answer ("train hard" / "take it easy") without interpreting raw biometrics.
- **Typography hierarchy:** primary metric rendered ~72pt-equivalent for arm's-length readability; supporting text small and secondary. Size signals what matters first.
- **Intentionally narrow color system:** green = ready, yellow = in-between, red = strain/low. Repeats on *every* screen so users learn the visual language once.
- Three dials (Sleep / Recovery / Strain) up top, each with a deep-dive page showing contributing metrics.
- 1-week / 1-month / 6-month trends in one tap.
- **"The score IS the coaching"** — no context-switch between understanding data and knowing what to do.

### Oura — 0–100 with named bands, trend-over-time emphasis
- Readiness / Sleep / Activity each **0–100**, with labeled ranges: 85+ Optimal, 70–84 Good, <70 prioritize rest.
- **Crown icon** for scores 85+ — a small, earned reward, not a gimmick.
- **Contributors breakdown** — nine inputs shown individually; weak areas get a "pay attention" message with a red progress bar.
- Philosophy: emphasizes how health is **trending over time** (Sleep/Activity/HRV Balance), not just today.

### Bevel — "Apple-esque," translate signals into scores + context
- Clean, minimal, responsive; **intuitive color coding + smooth animations**; avoids the cluttered data-heavy look of pro athletic software.
- Centers on three daily scores (Recovery, Sleep, Strain) + Stress — **complex signals translated into a single score plus plain-language context**, so users never have to read charts.
- Privacy-first: never stores/sells data without explicit permission. Interoperable (not locked to one wearable).
- Reviews praise it as "beautifully designed, easy to use, easy to understand."

### Gentler Streak — kindness as a design principle (Apple Design Award)
- **Translates stats into words** — presents a daily "fitness status" / wellbeing state rather than cold numbers.
- "Simplicity with depth" — not overwhelming by default, but data is there if you dig.
- Friendly, non-judgmental tone; frames setbacks as part of the journey; encouragement for all levels.

### How credible apps handle sharing
- The shared artifact is a **printable/shareable report for a healthcare provider** (Oura Shareable Reports; WHOOP share ECG/labs with a clinician) — clinical relevance, not vanity.
- Social sharing, where it exists (Oura Circle), is **supportive/opt-in**, framed around encouragement, never invite-walls or shame.

---

## Principles to apply

### Data presentation
- **One hero number.** Lung age already is that — protect it; don't bury it under competing metrics.
- **Translate to plain language + one next action** (WHOOP/Bevel/Gentler Streak). "Lung age 34 — younger than most. Keep your weekly holds up."
- **Banded, named ranges** (Oura) so the number is instantly interpretable.
- **Context every supporting number** — "62 bpm, within healthy range," not a bare "62."
- **Progressive disclosure** — hero insight first; contributors/details on demand.
- **Estimate honesty + cite the science** — keep the "estimate, not clinical" framing and the Schagatay / Jouven / Foster references already in `lungAge.ts`; surface them subtly as a trust asset.

### Color
- **Muted, narrow palette** used consistently (WHOOP). Reserve red for genuine "pay attention," not as the default alarm state.

### Typography & motion
- **Oversized hero number**, small secondary text (WHOOP hierarchy). Fits the repo's semibold direction.
- **Slow, gentle animations paced to breathing** — the ~2.2s reveal sweep is exactly right.

### Tone & copy
- **Supportive, descriptive, forward-looking** (Gentler Streak). "Here's what to work toward," never "you failed."
- No fear-mongering, no fabricated urgency.

### Trending over time
- Show progress against the **user's own baseline** (WHOOP/Oura). A personal "down 2 years this month" beats any population comparison and is the credible recurring share.

---

## What to apply to the lung-age screen (ranked)

1. **Hero number + plain-language verdict + one action.** Keep lung age huge; add a single interpretive line and one suggested next step.
2. **Named bands (Oura-style) judged against the user's age baseline**, with a small earned marker (crown-equivalent) for great results.
3. **Muted, consistent color language.** Reserve red for true outliers, not the default.
4. **Contributors breakdown on demand** — reframe Hold / Avg HR / HR Drop as transparent inputs to the score (you already compute these).
5. **Surface the science quietly** — a "How this is calculated" affordance citing the references; differentiating and trust-building.
6. **Personal-progress share + provider-ready framing.** Lead the share artifact with the user's own improvement over time; consider a clean, printable/shareable summary rather than a bait card.

**Tension to resolve:** this direction is the opposite of the earlier alarmist/clickbait pass (red-alarm framing, fabricated "50,000+" social proof, urgency line). Per this research, drop the fabricated social proof and shame framing — they undercut trust and carry App Store / PR risk for a health app.

---

## Sources

- [WHOOP Design Breakdown: Data-Dense UI That Feels Simple — 925 Studios](https://www.925studios.co/blog/whoop-design-breakdown)
- [The All-New WHOOP Home Screen — WHOOP](https://www.whoop.com/us/en/thelocker/the-all-new-whoop-home-screen/)
- [WHOOP — UI/UX Showcase](https://uiuxshowcase.com/industrial-design/whoop/)
- [WHOOP: Behaviorally designed to maximise engagement — Choice Hacking (Medium)](https://medium.com/choice-hacking/whoop-behaviorally-designed-to-maximise-engagement-f4364efdb564)
- [Your Oura Readiness Score & How To Measure It — Oura](https://ouraring.com/blog/readiness-score/)
- [Readiness Score — Oura Help](https://support.ouraring.com/hc/en-us/articles/360025589793-Readiness-Score)
- [Export & Share Your Oura Data — Oura Member Care](https://support.ouraring.com/hc/en-us/articles/360025441594-Export-Share-Your-Oura-Data)
- [Bevel — The Connected Health Coach (official)](https://www.bevel.health/)
- [Bevel Health Review — Neura Health](https://neura.health/insight/bevel-health-app-in-depth-review)
- [Bevel: All-In-One Health App — ScreensDesign (UI reference)](https://screensdesign.com/showcase/bevel-health-performance)
- [How Gentler Streak brings kindness to fitness — Sketch Blog](https://www.sketch.com/blog/gentler-streak/)
- [Behind the Design: Gentler Streak's "humanity" — Apple Developer](https://developer.apple.com/news/?id=3m0ht22s)
- [Interpreting Wearable Metrics: WHOOP, Oura, Apple Watch — The Lyons' Share](https://www.thelyonsshare.org/2025/03/04/interpreting-wearable-metrics-how-to-use-whoop-oura-and-apple-watch-to-optimize-your-health/)
- [WHOOP Advanced Labs (share with provider) — T3](https://www.t3.com/active/fitness-trackers/whoop-advanced-labs-uploads-rollout)
