# CLAUDE.md

Project-specific guide for Claude Code. Complements `AGENTS.md` — read that first for architecture philosophy, abstraction rules, and platform/testing policies. This file documents **the specific tokens, patterns, and commands** that already exist in the repo so you don't have to re-derive them.

---

## Stack

- **Expo** (React Native) + **TypeScript** (strict mode on)
- **Navigation:** `@react-navigation/native` (native stack + bottom tabs)
- **Rendering:** `@shopify/react-native-skia` for progress rings, `react-native-svg` for custom icons
- **Fonts:** `@expo-google-fonts/*` (Nunito, Fredoka, Baloo2, Unbounded, Sniglet — all loaded, only one active at a time)
- **Targets:** iOS now, Android soon — all new code must work on both

## Commands

- `npm start` — Expo dev server
- `npx expo start --ios` / `--android` — platform simulators
- `npx tsc --noEmit` — type-check (run before finishing any non-trivial change)

There is no test suite yet. When one exists, add it here.

---

## Design System — use these, never reinvent

### Colors
Import from `src/theme/colors.ts`. Full blue + orange + neutral + semantic palettes already defined. **Never hardcode a hex** — if the color you need isn't in the palette, add it to `colors.ts` first.

### Spacing
Import `spacing`, `padding`, `margin` from `src/theme/spacing.ts`. Use the named scale (`spacing.md`, `spacing['2xl']`) — magic-number padding is a bug.

### Typography
Import `typography` AND `fonts` from `src/theme/typography.ts`.

- For text styles: `...typography.title.title3`, `...typography.body.small`, etc.
- For inline `fontFamily` overrides: `fonts.bold` / `fonts.semibold` — **never** `'Nunito-Bold'` or `'Fredoka-Bold'` as string literals. The `FONT_FAMILY` switch in `typography.ts` must stay the single source of truth.

### Cards
Import `card` from `src/theme/card.ts`. Every elevated surface uses `...card.base` (bg + border + radius) and/or `...card.shadow`. **Do not hand-roll shadow/border/radius on new cards** — update `card.ts` if the system needs a new variant.

### Icons
- Custom icons live in `src/components/common/icons/paths.ts` as inline SVG bodies (24×24 viewBox, `currentColor` for recoloring).
- Render via `<Icon name="..." size={...} color={...} />` from `src/components/common/icons/Icon.tsx`.
- `MaterialCommunityIcons` is still used in some places — prefer adding a custom icon to `paths.ts` when introducing new iconography so the visual language stays unified.

---

## Folder Conventions

See `AGENTS.md` §"Default Architecture" for the rules. Current layout:

```
src/
  theme/            colors, spacing, typography, card tokens
  components/
    common/         reusable primitives (Icon, Pill, AppTopBar, SectionHeader)
    home/           home-screen-only components (cards, sections)
  screens/          top-level route components — thin
  hooks/            shared React behavior (empty — add as needed)
  lib/              pure domain logic (e.g. hrv.ts)
  data/             static config (techniques.ts)
```

**Rules:**
- If a component is used by one screen, it lives under that screen's feature folder.
- If it's used by two+, promote to `common/`.
- Don't create `utils.ts`, `helpers.ts`, or `shared.ts` — they rot. Name files after what they contain (`hrv.ts`, `streak.ts`).

---

## React Native Patterns Already In Use

- **Function components with typed `interface Props`** — no `React.FC`, no inline prop types.
- **Pressable** for all touchables (cross-platform-safe).
- **`useSafeAreaInsets()`** from `react-native-safe-area-context` for safe areas.
- **Skia for arc drawing** (see `RingStatCard.tsx`, `BigRingStatCard.tsx`) — reuse the pattern, don't introduce `react-native-svg` arc math.
- **SVG for vector illustrations** via `Icon` wrapper — don't use Skia for simple shapes.

---

## Android Readiness (recurring check)

- Every card's shadow must include **both** `shadow*` (iOS) and `elevation` (Android). The `card.shadow` token does this — use it.
- **Run on Android at least weekly** once you start touching layouts, not once per release. Catches font/shadow/safe-area drift early.
- Keep any native/platform code isolated behind adapters or `*.ios.tsx` / `*.android.tsx`. Don't sprinkle `Platform.OS === 'ios'` across feature code.

---

## Working With Claude Code

### Prompting
- **Be scope-specific.** "Fix the pill shadow" is too broad — "Update `HeroActionCard.tsx` to use `card.shadow` instead of inline values, don't touch other files" is right.
- **Name the file and line when you can.** Cold context costs time.
- **Don't ask for refactors to happen alongside a feature change** — ask for them separately.

### When to use subagents
- **`Explore`** — "how is the font system wired across the app?" — spawn it, don't burn main-context tokens.
- **Main session** — actual edits, reviews, and decisions. Keep it focused.

### Expected communication style
- Terse. A 1–2 sentence end-of-turn summary (what changed, what's next) is ideal.
- No emoji. No multi-paragraph recaps. No "I'll now..." narration.
- Report file paths with line numbers when pointing at changes: `src/theme/card.ts:14`.
- Flag tradeoffs before acting on them when the call isn't obvious.

### Conventions to enforce automatically
- Never inline `fontFamily: 'Nunito-*'` or any font string literal in a component — always `fonts.bold` / `fonts.semibold`.
- Never inline card shadow/border/radius — always `card.base` / `card.shadow`.
- Never hardcode a color hex outside `src/theme/colors.ts`.
- Prefer adding to existing token files over creating parallel ones.
- Default to **no comments** — well-named code explains itself. Only comment when the *why* is non-obvious.
- Don't leave `// removed X` or dead code. Delete it.

### What not to do
- Don't add Redux / MobX / React Query until there's a real problem.
- Don't add a new font family — we already have five loaded, pick one via `FONT_FAMILY`.
- Don't add a utility file named generically. Name it after its subject.
- Don't wrap a component just to rename its props.
- Don't stage large refactors unprompted. Small, reviewable, reversible.

---

## Definition Of Done (Claude-specific addendum to AGENTS.md)

On top of `AGENTS.md` §"Definition Of Done":
- All inline `fontFamily` / shadow / color literals that were touched are swept to tokens.
- TypeScript has no new errors (`npx tsc --noEmit` passes).
- A 1–2 sentence summary is given, with specific file paths.
