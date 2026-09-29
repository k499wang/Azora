import type { LessonBlock } from './lessonBlock';

const DEFAULT_MAX_WORDS = 45;

type Word = { text: string; bold: boolean; leading: string; suffix: string };

function wordsWithEmphasis(text: string): Word[] {
  const words: Word[] = [];
  let pendingSpace = '';
  for (const run of text.split(/(\*\*[^*]+\*\*)/g)) {
    const bold = run.startsWith('**') && run.endsWith('**');
    const plain = bold ? run.slice(2, -2) : run;
    let end = 0;
    for (const match of plain.matchAll(/\S+/g)) {
      const leading = pendingSpace + plain.slice(end, match.index);
      if (words.length && !leading && /^[.,;:!?…)'”"\]]+$/.test(match[0])) {
        words[words.length - 1].suffix += match[0];
      } else {
        words.push({ text: match[0], bold, leading, suffix: '' });
      }
      pendingSpace = '';
      end = match.index + match[0].length;
    }
    pendingSpace += plain.slice(end);
  }
  return words;
}

function renderWords(words: readonly Word[]): string {
  let result = '';
  let bold = false;
  words.forEach((word, index) => {
    if (bold && !word.bold) result += '**';
    if (index > 0) result += word.leading;
    if (!bold && word.bold) result += '**';
    bold = word.bold;
    result += word.text;
    if (word.suffix) {
      if (bold) result += '**';
      bold = false;
      result += word.suffix;
    }
  });
  return result + (bold ? '**' : '');
}

function isSentenceEnd(word: string): boolean {
  return /[.!?][”"')\]]*$/.test(word);
}

function sentenceGroups(words: readonly Word[], maxWords: number): Word[][] {
  const sentences: Word[][] = [];
  let sentence: Word[] = [];
  for (const word of words) {
    sentence.push(word);
    if (isSentenceEnd(word.text + word.suffix)) {
      sentences.push(sentence);
      sentence = [];
    }
  }
  if (sentence.length) sentences.push(sentence);

  // Only a sentence longer than one slide is divided at word boundaries.
  return sentences.flatMap((part) => {
    const pageCount = Math.ceil(part.length / maxWords);
    const chunkSize = Math.ceil(part.length / pageCount);
    const chunks: Word[][] = [];
    for (let index = 0; index < part.length; index += chunkSize) {
      chunks.push(part.slice(index, index + chunkSize));
    }
    return chunks;
  });
}

/** Divide prose into balanced slides, keeping complete sentences together. */
export function splitLessonProse(text: string, maxWords = DEFAULT_MAX_WORDS): string[] {
  if (!Number.isInteger(maxWords) || maxWords < 1) throw new RangeError('maxWords must be positive');
  const words = wordsWithEmphasis(text);
  if (words.length <= maxWords) return [text];
  const groups = sentenceGroups(words, maxWords);
  const pageCount = Math.ceil(words.length / maxWords);
  const idealSize = words.length / pageCount;
  const best = Array.from({ length: groups.length + 1 }, () => ({ cost: Infinity, pages: [] as Word[][] }));
  best[0] = { cost: 0, pages: [] };
  for (let end = 1; end <= groups.length; end += 1) {
    let size = 0;
    for (let start = end - 1; start >= 0; start -= 1) {
      size += groups[start].length;
      if (size > maxWords) break;
      const previous = best[start];
      if (!Number.isFinite(previous.cost)) continue;
      const cost = previous.cost + 10_000 + (size - idealSize) ** 2;
      if (cost < best[end].cost) {
        best[end] = { cost, pages: [...previous.pages, groups.slice(start, end).flat()] };
      }
    }
  }
  return best[groups.length].pages.map(renderWords);
}

/** Keep interactive blocks, lists, and the closing action together on their own slides. */
export function lessonPages(blocks: readonly LessonBlock[], maxWords = DEFAULT_MAX_WORDS): LessonBlock[] {
  const pages: LessonBlock[] = [];
  let prose: string[] = [];
  const flush = () => {
    if (!prose.length) return;
    pages.push(...splitLessonProse(prose.join(' '), maxWords).map((text): LessonBlock => ({ kind: 'text', text })));
    prose = [];
  };
  for (const block of blocks) {
    if (block.kind === 'text') prose.push(block.text);
    else {
      flush();
      pages.push(block);
    }
  }
  flush();
  return pages;
}
