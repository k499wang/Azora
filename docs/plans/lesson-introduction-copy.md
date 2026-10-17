# Lesson introduction copy

The shared lesson introduction separates learning from doing:

- **What you’ll learn:** a dedicated, authored preview in `src/features/lessons/domain/lessonIntroductions.ts`, keyed by the exact lesson ID, including goal variants and historical lessons. The catalogue attaches it as `Lesson.introduction`. There is no teaching-paragraph fallback.
- **One small thing to try:** the existing `step`, which also appears on the plan. Keep the action consistent across both surfaces.

Presentation follows Azora's shared cream canvas, matching white learning and action cards, semantic typography, and primary button. Both cards share the same icon tile, larger title typography, body typography, padding, and radius. Use the lightbulb illustration in the blue hero circle. Keep duration and coins secondary to learning and the practical action.

Write for someone tired, distracted, or unfamiliar with the subject. Use familiar words and short sentences. Explain unfamiliar terms immediately. Be respectful; never call the action easy or imply the reader should already know it.

A dedicated introduction should usually be one short sentence, with a maximum of 32 words: what the person will learn and how it helps. Name an everyday example when useful. Avoid guarantees about feelings, symptoms, or speed of improvement. Do not promise a skill the lesson does not actually teach.

Example: “Learn how sorting, tidying, and cleaning differ, so you can choose the right first job for your table.”

Preview copy is additive metadata. It does not change a lesson's saved activity identity, completion rules, or curriculum sequence. When adapting a lesson to another goal, author matching preview copy rather than inheriting a summary about a different situation.
