import type { LessonBlock } from './lessonBlock';

/** Reading plus interaction time; practical actions can take longer. */
export function lessonEstimatedMinutes(blocks: readonly LessonBlock[]): number {
  const prose = blocks.flatMap((block) => {
    switch (block.kind) {
      case 'text': case 'do': return [block.text];
      case 'fact': return [block.value, block.caption];
      case 'list': return block.items.flatMap((item) => [item.term, item.text]);
      case 'choice': return [block.prompt, ...block.options.flatMap((option) => [option.label, option.feedback])];
      case 'reveal': return [block.prompt, ...block.items.flatMap((item) => [item.label, item.detail])];
      case 'sequence': return [block.prompt, ...block.steps, block.feedback];
    }
  }).join(' ');
  return Math.max(2, Math.ceil(prose.trim().split(/\s+/).length / 180 + 1));
}
