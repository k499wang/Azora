import assert from 'node:assert/strict';
import test from 'node:test';
import { stickerIllustrationSvg } from './stickerIllustrationSvg.ts';

test('sticker edges preserve open lines and expand their existing weight', () => {
  const body = '<path d="M4 4L30 30" fill="none" stroke="#8AB890" stroke-width="2"/>';
  const svg = stickerIllustrationSvg(body);
  assert.ok(svg.includes('<path d="M4 4L30 30" fill="none" stroke="#FFFFFF" stroke-width="5.2"/>'));
  assert.ok(svg.endsWith(`${body}</g></svg>`));
});

test('sticker edges follow filled objects and leave the original colours intact', () => {
  const body = '<circle cx="20" cy="20" r="16" fill="#F4D07B"/>';
  const svg = stickerIllustrationSvg(body, 0.48);
  assert.ok(svg.includes('<circle cx="20" cy="20" r="16" fill="#FFFFFF"/>'));
  assert.ok(svg.endsWith(`${body}</g></svg>`));
  assert.ok(svg.includes('opacity="0.48"'));
  assert.ok(svg.includes('viewBox="-2 -2 44 44"'));
});
