/**
 * What a lesson is made of.
 *
 * Split from the catalogue so the six content files can be typed without
 * importing the thing that composes them.
 */

/**
 * A run of **bold** inside a lesson's prose.
 *
 * Two or three words a paragraph, chosen so that reading only the bold gives
 * you the lesson. That is the skim path — it is what makes a lesson survive
 * being opened by somebody who was never going to read all of it — and it is
 * why the emphasis is authored rather than left to the screen.
 */
export type LessonProse = string;

export interface LessonListItem {
  term: string;
  text: string;
}

/**
 * The pieces a lesson is built from.
 *
 * Four kinds, deliberately. It is enough for the shapes these lessons actually
 * take and small enough that none of them can be authored into something the
 * screen cannot make look considered. A lesson written as one block of prose is
 * a wall, and a wall gets closed.
 */
export type LessonBlock =
  | { kind: 'text'; text: LessonProse }
  /** The one number, alone. A lesson with no honest number does not get one. */
  | { kind: 'fact'; value: string; caption: string }
  /** For the lessons whose content genuinely is a set. */
  | { kind: 'list'; items: readonly LessonListItem[] }
  /** Always last. The only block with an imperative in it. */
  | { kind: 'do'; text: LessonProse };

/**
 * A lesson before the catalogue has given it an id it can be looked up by.
 *
 * Content files declare their lessons `as const satisfies readonly
 * LessonDefinition[]`, which is what lets `LessonId` be derived from the
 * content rather than maintained beside it. Seventy-one ids in a hand-written
 * union is seventy-one chances for one of them to drift.
 */
export interface LessonDefinition {
  id: string;
  /** The claim itself, never the topic. It is the lesson; the blocks are why. */
  title: string;
  blocks: readonly LessonBlock[];
  /**
   * Where the claim comes from. Internal only, never rendered.
   *
   * It exists so a sentence written today can be checked by somebody who did
   * not write it. General wellness advice is where confident-sounding folklore
   * gets in, and a claim with nothing behind it is the one to cut.
   */
  source: string;
}
