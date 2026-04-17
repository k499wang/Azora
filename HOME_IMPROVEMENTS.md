# Home Screen Improvements

Ordered by ease of implementation, ranked by importance (1 = highest).

---

## Tier 1 — Easy

### 1. Streak Card · Importance: ★★★★★
Replace the top bar badge with a visible "🔥 3 day streak" card on the home screen.
Drives daily retention more than any other single element. Competitors (Calm, Headspace) make this a hero element.

### 2. Time-based Exercise Recommendation · Importance: ★★★★☆
Show a "Try this today" card that auto-suggests an exercise based on time of day.
- Morning → Wim Hof (energy)
- Afternoon → Box Breathing (focus)
- Evening → 4-7-8 (sleep/calm)
Data (TECHNIQUES array) already exists. Just needs a card component.

### 3. Horizontal Exercise Quick-Start Strip · Importance: ★★★★☆
A horizontal scroll of 2–3 exercise pills below the orb. One tap to begin without going to the library tab.
All exercise data already exists — just needs a horizontal list on the home screen.

---

## Tier 2 — Medium

### 4. Mood / Intent Selector · Importance: ★★★★★
3 pills at the top: **Calm · Focus · Sleep**.
Tapping one filters or auto-launches the right exercise. Breathwrk does this best — immediately directs users without them having to think.

### 5. Last Session Recap Card · Importance: ★★★☆☆
Small card showing the most recent session: exercise name, hold time, date.
e.g. "Box Breathing · 2:14 hold · 2 hours ago"
Requires persisting session data (AsyncStorage or similar).

---

## Tier 3 — Harder

### 6. Heart Rate Snapshot · Importance: ★★★☆☆
Show resting BPM with a trend arrow on the home screen using existing HR infrastructure.
Unique differentiator — no competitor does real-time HR on home. Needs data persistence and HR history.

### 7. Health Score Explanation / Breakdown · Importance: ★★☆☆☆
The health score concept is unique but currently unexplained. Add a tappable card that breaks down what contributes to it (hold time, HR, consistency).
Requires defining the scoring algorithm and a detail screen.
