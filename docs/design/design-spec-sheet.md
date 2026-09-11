# Azora — Design Spec Sheet

One-page quantitative reference for designers. Every number here is a real token
in the codebase. **If a value isn't on this page, it doesn't exist yet** — ask
before inventing one.

Units are iOS points (pt). 1pt = 1x. Design at **375 × 812** (iPhone), verify at
**375 × 667** (iPhone SE — the tight case).

Narrative rules and rationale: `design.md` at the repo root. This sheet is only
the numbers.

---

## 1. Type

**Family: Outfit.** Only family in the app. Don't introduce another.

Faces in use: Light (300), Regular (400), Medium (500), **SemiBold (600)**, ExtraBold (800).

> **SemiBold is the heaviest weight in the app.** There is no Bold. ExtraBold is
> reserved for paywall headlines only.

| Style | Size / Line | Weight | Use |
|---|---|---|---|
| Display 1 | 48 / 56 | SemiBold | Hero numbers |
| Display 2 | 40 / 48 | SemiBold | Hero numbers |
| Display 3 | 32 / 40 | SemiBold | Screen hero |
| Title 1 | 28 / 36 | SemiBold | Screen title |
| Title 2 | 24 / 32 | SemiBold | Section title |
| Title 3 | 22 / 30 | SemiBold | Card title |
| Heading 1 | 18 / 26 | Medium | Sub-headers |
| Heading 2 | 16 / 24 | Medium | Sub-headers |
| Body L | 18 / 28 | Light | Long copy |
| Body M | 16 / 24 | Light | Default body |
| Body S | 14 / 22 | Light | Secondary copy |
| Body XS | 12 / 18 | Light | Fine print |
| Label L | 16 / 20 | Regular | Form/row labels |
| Label M | 14 / 18 | Regular | Row labels |
| Label S | 12 / 16 | Regular | Small labels |
| Label Detail | 13 / 16 | Medium | Card meta rows (category, duration) |
| Button L | 16 / 20 | Medium | Primary CTA |
| Button M | 14 / 18 | Medium | Secondary |
| Button S | 12 / 16 | Medium | Tertiary |
| Caption 1 | 12 / 16 | Light | Captions |
| Caption 2 | 11 / 14 | Regular | Captions |
| Overline | 11 / 14 | Medium | +1.4 tracking, UPPERCASE |

**Stats** (all tabular numerals — digits must not shift while counting):

| Style | Size / Line | Tracking |
|---|---|---|
| Stat value | 21 / 26 | −0.3 |
| Stat value M | 30 / 36 | −0.3 |
| Stat value L | 34 / 42 | −0.5 |
| Stat unit | 14 / 18 | — |
| Stat unit M | 16 / 20 | — |
| Stat unit L | 18 / 22 | — |

Font scaling is **disabled** app-wide. Copy must fit at these sizes — no dynamic
type reflow to fall back on.

---

## 2. Color

### Canvas & surfaces
| Token | Hex | Use |
|---|---|---|
| `background.primary` | `#F4F5F7` | Cool neutral app canvas (glass screens) |
| `background.canvas` | `#F7F8FB` | Near-white canvas under color blocks |
| `background.card` | `#FFFFFF` | **All cards. Pure white, never tinted.** |
| `background.cardSoft` | `#FAFBFD` | Outlined rows sitting directly on canvas |
| `background.accentSoft` | `#EAF2FF` | Soft blue fill |
| `background.paper` | `#FBF7EF` | Warm cream letter/note surfaces |
| `background.headerTint` | `#78B4FF` | Blue block behind the top bar |

### Text
| Token | Hex |
|---|---|
| `text.primary` | `#3A434F` |
| `text.secondary` | `#5B6675` |
| `text.tertiary` | `#94A3B8` |
| `text.inverse` | `#FFFFFF` |
| `text.brand` | `#2F7AEF` |

### Borders
`subtle #E2E8F0` · `default #CBD5E1` · `strong #94A3B8` · `brand #78B4FF`

### Primary blue
`100 #EAF2FF` · `200 #C8DBFF` · `300 #A0C4FF` · `400 #78B4FF` · `500 #4A90F5` ·
`600 #2F7AEF` · `700 #1E63D6` · `800 #154AAB` · `900 #0D3380`

### Neutral
`0 #FFFFFF` · `50 #F8FAFC` · `100 #F1F5F9` · `200 #E2E8F0` · `300 #CBD5E1` ·
`400 #94A3B8` · `500 #64748B` · `600 #475569` · `700 #334155` · `800 #1E293B` · `900 #0F172A`

### Playful families — the color-blocked home surfaces
Each family has four roles. `base` is the saturated fill (all bases clear 3:1
against white text). `mid` = base lifted ~35% toward soft, for in-block
gradients. `soft` is the receded/completed tint. `ink` is text on `soft`.

| Family | base | mid | soft | ink |
|---|---|---|---|---|
| teal | `#00A391` | `#3BBAAB` | `#A8E5DA` | `#0B6B5C` |
| coral | `#F04E30` | `#F4785F` | `#FAC7B6` | `#B23A1D` |
| violet | `#6C4BFF` | `#8F76FE` | `#CFC5FB` | `#4B34C4` |
| amber | `#D97706` | `#E49B3D` | `#F8DEA3` | `#925C00` |
| sky | `#2979FF` | `#5F9BFE` | `#C3DBFC` | `#1559A8` |
| blush | `#F0488F` | `#F377AC` | `#F8CFE3` | `#A12359` |

**On a `base` block**, use white-alpha layers — not another solid color:
fill `rgba(255,255,255,0.16)` · fill active `0.34` · divider `0.24` ·
muted text `0.78` · faint text `0.45`.

### Semantic
| | 100 | 300 | 500 | 700 |
|---|---|---|---|---|
| success | `#DCFCE7` | `#86EFAC` | `#22C55E` | `#15803D` |
| warning | `#FEF3C7` | `#FDE68A` | `#F59E0B` | `#B45309` |
| error | `#FEE2E2` | `#FCA5A5` | `#EF4444` | `#B91C1C` |
| yellow | `#FEF9C3` | `#FDE047` | `#EAB308` | — |
| orange | `#FFF4E6` | `#FFBD6B` | `#FF8C00` | `#CC6A00` |

### Glass (frosted surfaces over blur)
fill `rgba(248,250,252,0.62)` · clear `0.30` · strong `0.80` ·
edge `rgba(255,255,255,0.55)` · edge strong `0.78` ·
solid fallback scrim `rgba(244,245,247,0.94)` (used when Reduce Transparency is on) ·
nav tint `rgba(255,255,255,0.66)`.

### Photo scrim — one treatment for text over photography
`transparent rgba(12,16,33,0)` → `soft 0.35` → `medium 0.6` → `strong 0.82`.
Every photo card fades to this same blue-black.

### Mochi (the mascot)
body `#4FB3E8` · light `#7ACDF3` · foot `#2E93CC` · face `#12384B` ·
cheek `#F4785F` · sparkle `#FFC94D` · shadow `rgba(58,67,79,0.22)`.

---

## 3. Spacing

`xs 4` · `sm 8` · `md 16` · `mdPlus 20` · `lg 24` · `xl 32` · `2xl 40` ·
`3xl 48` · `4xl 56` · `5xl 64` · `6xl 80` · `7xl 96`

| Context | Value |
|---|---|
| Screen horizontal margin | **18** |
| Screen vertical padding | 32 |
| Card padding | 16 × 16 |
| Button padding | 24 h × 8 v (`ChunkyButton`: 24 × 16) |
| Input padding | 16 h × 8 v |
| Gap between sections | 40 |
| Gap under a section title | 24 |
| Gap between list items | 24 |
| Gap between stacked text lines | 8 |
| Tight gap | 4 |

Off-scale padding is a bug. If 18 or 20 isn't right, say so — don't ship a 15.

---

## 4. Radius

All radii pair with a **continuous (squircle) corner curve**, not a circular arc.

| Token | Value | Use |
|---|---|---|
| xs | 8 | Chips, skeleton blocks |
| small | 10 | Paper, small cells |
| medium | 12 | Inputs, utility controls |
| card | 16 | **Standard cards, grouped cells** |
| hero / large | 20 | Color-block heroes, glass panes |
| sheet | 24 | Sheets, modals |
| xl | 28 | Reward cards, mascot bubbles |
| full | 999 | Pills, avatars, circular controls |

---

## 5. Shadows

Shadows are **colorless and soft**. Never a colored glow, never neon, never a
border used as fake depth. Cards are borderless — depth comes from canvas
contrast plus shadow.

| Name | Y | Blur | Opacity | Use |
|---|---|---|---|---|
| `shadow` | 4 | 8 | 6% | Standard card |
| `blockShadow` | 4 | 20 | 6% | Color blocks (diffuse) |
| `shadowElevated` | 12 | 24 | 6% | Glass / premium surfaces |
| `paper` | 6 | 18 | 6% | Cream paper sheets |
| `trayShadow` | **−6** | 16 | 8% | Bottom dock — casts upward |
| `shadowModal` | 12 | 24 | 20% | Dialogs over a dim backdrop |
| `shadowReward` | 10 | 20 | 18% | Reward reveals |

Shadow color is `#0F172A` (neutral 900) at the opacity above.

---

## 6. Motion

| Duration | ms | For |
|---|---|---|
| fast | 180 | State flips — a chip selecting |
| base | 260 | **Default** enter/exit |
| slow | 420 | Content arriving on a screen |
| slower | 640 | A burst playing itself out |
| fill | 900 | A bar filling — meant to be watched |
| type | 500 | A line typing itself out |

**Easing** — enter `cubic-out` · exit `cubic-in` · settle `cubic-bezier(0.16, 1, 0.3, 1)` · burst `quad-out`.

**Springs** — pop `damping 11 / stiffness 160 / mass 0.8` (appearing) ·
bounce `8 / 190 / 0.7` (impact) · settle `18 / 180` (return to rest, no overshoot).

**Stagger** between items in a sequence: tight 60ms · base 90ms · loose 115ms.
**Travel** on a fade-in: rise 16pt · drop 22pt.

---

## 7. Interaction states

Three states, no fourth. Every interactive element uses one.

| State | Opacity | Scale | For |
|---|---|---|---|
| surface | 0.75 | — | Cards, tiles (no scale — depth stays put) |
| control | 0.80 | 0.96 | Icon buttons, avatars, pills |
| subtle | 0.88 | 0.98 | Banners, tertiary actions |
| disabled | 0.50 | — | Any disabled element |

The primary CTA (`ChunkyButton`) is a solid face on a darker lip; pressing drops
the face **4pt**. Shapes: pill (onboarding/paywall) or 16-radius card (in-app).

---

## 8. Icons

- Custom stroke set, **24 × 24 viewBox**, single `currentColor` stroke.
- Sizes in use: **16, 18, 20** (most common) · 14, 22, 24, 26, 28 · 42, 48 (feature).
- Default render size 24.
- One icon system. Don't add a second library — new glyphs get drawn in the same
  stroke style.
- Third-party brand marks keep official colors: Instagram `#FF0069`,
  Facebook `#0866FF`, Reddit `#FF4500`, App Store `#0D96F6`.

---

## 9. Layout constants

| | Value |
|---|---|
| Design width | 375 |
| Top bar height | 58 (+ 26 curve below it) |
| Screen side margin | 18 |
| Minimum tap target | **44 × 44** |
| Short-screen breakpoint | height ≤ 700 |
| Narrow-screen breakpoint | width ≤ 380 |
| Regular-width layout | width ≥ 600 |
| Dashboard card columns | width ≥ 800 |
| Focused content maximum | 480 |
| Grouped content maximum | 680 |
| Dashboard content maximum | 960 |
| Home primary block maximum | 800 |

Anything ≤ 700pt tall is the SE case: fixed-height heroes and generous vertical
padding clip there. Check it.

Responsive widths describe the content, not the hardware. Focused forms and
prose stay narrow enough to read; grouped lists get a wider single column;
dashboards let charts and peer metric cards use the iPad canvas. Below each cap
the container is `width: 100%`, so phone geometry remains unchanged. Derive
layout from the current window, because iPad Split View and Stage Manager can
hand the same device a compact or regular canvas.

At dashboard-column width, only short peer summaries may form rows. Charts,
timelines, settings groups, and chronological history stay full-row. Horizontal
technique shelves keep fixed card geometry and reveal more cards instead of
inflating them.

---

## 10. Hard rules

1. **No new colors.** If it's not in §2, it doesn't exist.
2. **No weight above SemiBold** except paywall headlines.
3. **No second font family.**
4. **Cards are pure white** `#FFFFFF`. Not a tinted near-white.
5. **No borders on cards.** Depth is shadow + canvas contrast.
6. **Shadows are never colored.**
7. **Tabular numerals** on every timer, streak, score, counter, and heart-rate value.
8. **Tap targets ≥ 44 × 44**, always.
9. **Contrast passes AA**; never communicate state with color alone — pair it
   with text, icon, or shape.
10. **No delight during a session.** Reward animation over a running timer or
    breath hold is a bug even when it's beautiful. Celebrate at the seams —
    starting, finishing, unlocking.
11. **Numbers never flatter.** A flat week shows as a flat week. No invented
    progress, no rounded-up wins.
