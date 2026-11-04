# Routine detail content: Me+ reference study

## Evidence and limits

The public [Me+ Google Play listing](https://play.google.com/store/apps/details?id=daily.planner.routine.habits)
describes routine templates, customizable daily routines, and supporting self-care information.
The [Me+ App Store listing](https://apps.apple.com/us/app/me-lifestyle-routine/id1596403446)
also presents the product as a routine planner with educational content.

These sources support using guided content alongside an actionable routine.
They do not expose every current template detail screen. The sections below are
Azora's design decisions, not a claim about Me+'s exact page structure. No
competitor copy, artwork, characters, or branding is reused.

## Azora's longer detail page

Each of the 30 routine templates receives original, routine-specific guidance:

1. The existing poster, title, estimated duration, and short description.
2. Two overview paragraphs explaining the purpose and a practical way to approach the routine.
3. A short preparation list under **Before you begin**.
4. The existing selectable tasks, each with instructions explaining what to do and when to stop.
5. A **Start smaller** suggestion for a lower-effort version.

Length comes from useful instructions rather than extra empty space. Task
guidance stays visible while selecting tasks. The existing bottom action tray
remains available while scrolling.

## Content ownership and checks

`src/data/routineGuides.ts` owns the static editorial content. Guidance refers
to the existing routine and task IDs; it does not change task names, durations,
schedules, recurrence, or saved goal drafts. The PDF resource keeps its existing
detail page.

Content checks cover every template and its task IDs so renamed or added tasks
cannot silently lose their guidance. Typechecking and the existing test suite
remain the implementation checks. Device review should include a short routine,
the seven-step Whole-Home Hour, a support routine, large text, selection changes,
and scrolling to the final section above the action tray.
