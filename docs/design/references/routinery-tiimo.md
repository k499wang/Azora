# Routinery + Tiimo screen references

Marketing frames from the App Store and each product site (2026-10-22). UI inside the phones is real render; motion is not visible in any of them — get screen recordings before copying transitions. Sizes are % of phone-screen width; hexes are eyeballed.

## Routinery (`routinery/`)

Yellow accent `#F8DC00`, charcoal `#3A3A44`, geometric sans, 3D emoji icons.

| Screen | Files | Key details |
|---|---|---|
| Routine player | `r04.jpg`, `w1_timer.png`, `w2_timer_custom.jpg`, `w3_redesign.jpg` | Chevron-down (minimise) left, × right. Bold title ~8%, grey "6:30AM → 6:40AM". Ring ~55% wide, stroke ~8% of diameter, round cap + knob, empties toward 12 o'clock. Emoji ~18%, huge tabular "1:00", "− 15m +" stepper pill inside. Row: pause · ~80px charcoal check · skip. "NEXT" chip + next step name. Bottom card "All ends 6:30AM" + "Edit Order". `w2` = ring / partial ring / pie styles. |
| Routine start | `r01.jpg` | Centred title, grey time range, emoji step list, total "1h 50m", big charcoal play circle (~24%) at bottom. |
| Routine detail | `r02.jpg` | `#F7F7F7` rows, radius ~16: index, emoji, name, "5 min", outlined checkbox. Swipe left Duplicate/Delete, right Skip. Long-press drag lifts (tilt ~3°, scale ~5%, soft shadow). |
| Planner list | `r05.jpg` | Week strip, collapsible "Morning · 1" sections, white routine card (name, "46m · Daily", play circle ~12%), expands to steps; done = filled check + grey strikethrough. |
| Schedule editor | `r06.jpg` | Grouped grey cards: Date, Start time, Repeat, Notification toggle, Push/Alarm segmented control. |
| Step stats | `r03.jpg` | Emoji in grey circle; month calendar, solid yellow = done, pale = partial. |
| Rewards | `w4_reward01.png`, `w5_reward03.png` | Reward/badge art. |
| Widgets / Watch / Discover / MCP | `r07`–`r10.jpg` | — |

## Tiimo (`tiimo/`)

Display serif titles, grotesk body, lavender canvas `#E9E6FB → #F4F2FD`, purple accent `#9B87F5`, white cards.

| Screen | Files | Key details |
|---|---|---|
| Day view | `t01.jpg`, `t03.jpg`, `w3_visual_plan_routine.png` | Serif "Tuesday" ~9%, week strip. Uppercase tinted section pills "MORNING (3) ⌄" (peach `#FDEDE6`, pink `#FBEAF3`, lavender `#EEEBFB`). Cards: white, radius ~14, 1px `#EEE` border; 36px pastel emoji circle, title + "8.00 → 8.30", 24px checkbox. Routine card shows steps + mini progress "1/3". Confetti burst from checkbox on complete. |
| Focus countdown | `t06.jpg`, `w5_focus_hero.png`, `w4_duration_complete.png` | Serif title ~10%, time range. Ring ~47%: pale outer disc, cream inner disc (~70%) with emoji ~22%, purple band ~14% of diameter, round caps, empties toward 12. Light serif "04:50" ~13%, "+5" text button, black pause pill, subtask list below. |
| Live Activity | `t04.jpg` | Frosted card radius ~24: mini ring + emoji, "Focus time" / "14.56", black round pause. |
| To-dos | `w1_subtasks.png` | Priority pills "HIGH (3)" pink, "MEDIUM (3)" peach; same cards. |
| AI planner | `t02.jpg`, `t05.jpg` | Dark chat, purple-grey bubbles, generated activity cards with glow. |
| Watch | `w2_focus.png` | Ring + "13 mins left". |
| iPad week | `t07.jpg` | Time labels left, tinted blocks with "3/3". |

## Not captured

Routinery completion screen and step editor; Tiimo add-activity flow, activity detail sheet, phone timeline, Dynamic Island; all motion.

## Azora mapping

Player = Routinery layout + Tiimo ring (Skia, `RingStatCard` pattern), icon from `RoutineTaskIcon`, check on a lip, `fonts.heavy` countdown, colours from `src/theme/colors.ts`. Needs `durationMinutes` on `SelfCareGoal` / `RoutineTemplateTask` (migration). Time-of-day section pills and the checkbox confetti fit the existing Routine list.
