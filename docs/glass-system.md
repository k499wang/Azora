# Glass System

The app's frosted/Liquid-Glass surfaces are one layered, progressively-enhanced API.
Import everything from the barrel:

```ts
import { GlassSurface, GlassCard, GlassIconButton, GlassGroup, useGlassMode } from '../common/glass';
```

## The 4 layers

| Layer | File | Responsibility |
|---|---|---|
| Resolver | `src/lib/glassSupport.ts` | Pure `resolveGlassMode()` → `'liquid' \| 'blur' \| 'solid'`. Unit-tested. |
| Hook | `src/hooks/useGlassMode.ts` | Reactive mode: native capability + Reduce Transparency (live) + dev env overrides + runtime `setForcedGlassMode()`. |
| Primitive | `src/components/common/GlassSurface.tsx` | Renders the surface for the current mode. All customization lives here. |
| Presets | `GlassCard`, `GlassIconButton`, `GlassGroup` | Opinionated wrappers for common shapes. |

## Fallback matrix

| Environment | Mode | Renders |
|---|---|---|
| iOS 26+ (Liquid Glass + API available) | `liquid` | Native `GlassView` (real refraction). Honors `variant`, `colorScheme`, `tintColor`, `interactive`. |
| iOS < 26 | `blur` | `expo-blur` BlurView + tint fill. Honors `blurIntensity`, `blurTint`, `blurColor`, `colorScheme`. |
| Android | `blur` | `expo-blur` BlurView with `experimentalBlurMethod="dimezisBlurView"` + tint fill. |
| Reduce Transparency on | `solid` | Forced centrally in the resolver; native liquid is left to the OS. |
| `EXPO_PUBLIC_FORCE_GLASS_MODE=liquid\|blur\|solid` (dev) | forced | Override for inspecting any path on one device. Restart Metro with `npx expo start -c`. |

## Two materials: chrome vs obscure

The system distinguishes two jobs that look similar but are opposites:

- **Chrome** (`GlassSurface` & presets) — a *see-through* floating layer above content. May use Liquid Glass. For tab bars, FABs, cards, buttons.
- **Obscure** (`LockedScrim`) — a frost that *hides* content to gate it (paywall/lock). **Never** uses Liquid Glass: liquid stays see-through, so it would not hide what it is meant to gate. Resolves to blur on iOS < 26 and Android, or an opaque scrim when Reduce Transparency is enabled.

Never gate content with a plain `GlassSurface` — use `LockedScrim`.

## When to use which

- **`GlassCard`** — elevated content card with padding + top-edge highlight. Default choice for a glass panel.
- **`GlassIconButton`** — small round glass control (header actions).
- **`GlassSurface`** — the chrome primitive. Use directly for a custom shape or a full-bleed chrome fill (`bare`).
- **`GlassGroup`** — wrap *adjacent* glass controls so they merge/morph on iOS 26. Use for a row of buttons; no effect (plain View) elsewhere.
- **`LockedScrim`** — the obscuring overlay for locked/Pro content. Pass `intensity` for blur strength, `style` for bleed/positioning.

## `GlassSurface` props

- `variant` — `'regular'` (most UI) or `'clear'` (over imagery/vibrant media; lighter tint, lower blur).
- `colorScheme` — `'light' | 'dark'`. Honored in **every** mode, not just liquid.
- `bare` — emit only the raw surface (no shadow wrapper / radius / framed tint). For masked or full-bleed (`absoluteFill`) callers that own their layout.
- `interactive` — Liquid-Glass press deformation (iOS 26 only; pair with a `Pressable` for fallback affordance).
- `tintColor` — liquid tint. `blurTint` / `blurIntensity` / `blurColor` — blur-mode knobs. `solidColor` — scrim override.
- `forceFallback` — downgrade `liquid` → `blur` for this surface even where Liquid Glass is available. For obscuring surfaces (`LockedScrim` sets this) or where liquid reads poorly over the backdrop.
- `radius` (framed only, default 24), `style`, `pointerEvents`.

## Rules

- Glass is the **control/chrome layer**, not content. Reserve it for floating/elevated surfaces; keep dense content on `card.base`.
- Never re-derive the mode with raw `isLiquidGlassAvailable()` — always go through `useGlassMode()` so env overrides and Reduce Transparency stay consistent.
- Never stack glass on glass; group adjacent glass with `GlassGroup`.
- Glass colors live in `colors.glass.*`. Add tokens there, never inline rgba in components.
