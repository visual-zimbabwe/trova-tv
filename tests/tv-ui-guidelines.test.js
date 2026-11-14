import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  TV_CARD,
  TV_FOCUS,
  TV_SELECTED,
  TV_SPACE,
  TV_TYPE,
} from '../src/tv/tvTheme.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('tvTheme defines 10-foot focus, typography (>=13dp), spacing, and card tokens', () => {
  assert.equal(TV_FOCUS.ringColor, '#FFF4DC');
  assert.ok(TV_FOCUS.ringWidth >= 3);
  assert.match(TV_FOCUS.glow, /rgba\(255,\s*244,\s*220/);
  assert.ok(TV_FOCUS.scale >= 1.08);
  assert.ok(TV_FOCUS.scaleSmall >= 1.05);

  assert.equal(TV_SELECTED.fill, '#D4A853');

  assert.ok(TV_TYPE.MIN >= 13);
  for (const [k, val] of Object.entries(TV_TYPE)) {
    assert.ok(val >= 13, `TV_TYPE.${k} (${val}) must be >= 13dp`);
  }

  assert.ok(TV_SPACE.targetMin >= 48);
  assert.ok(TV_SPACE.chipMin >= 40);
  assert.ok(TV_SPACE.cardGap >= 20);
  assert.ok(TV_CARD.posterW >= 160);
  assert.ok(TV_CARD.posterH >= 240);
});

test('TvFocusable wraps Pressable in an outer scaling Animated.View with warm-white ring and glow', () => {
  const src = read('src/tv/TvFocusable.js');
  assert.match(src, /focusBorderColor\s*=\s*TV_FOCUS\.ringColor/);
  assert.match(src, /boxShadow:\s*TV_FOCUS\.glow/);
  const animViewIdx = src.indexOf('<Animated.View');
  const pressableIdx = src.indexOf('<Pressable');
  assert.ok(
    animViewIdx > -1 && pressableIdx > animViewIdx,
    'Animated.View must wrap Pressable on the outside so card frames and borders lift together',
  );
});

test('TvSidebar overlays when expanded without shifting stage and distinguishes active tab from focus', () => {
  const src = read('src/tv/TvSidebar.js');
  assert.match(src, /railFootprint/);
  assert.match(src, /position:\s*'absolute'/);
  assert.match(src, /backdropScrim/);
  assert.match(src, /activeBar/);
});

test('TvContentRail aligns focused cards to fixed left keyline (viewPosition: 0) and reports railY', () => {
  const src = read('src/tv/TvContentRail.js');
  assert.match(src, /viewPosition:\s*0/);
  assert.match(src, /onRailFocus\?\.\(railYRef\.current\)/);
});

test('No TV screen or component declares a fontSize below 13dp (26px at 1080p)', () => {
  const tvDir = path.join(root, 'src/tv');
  const files = fs.readdirSync(tvDir).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const src = fs.readFileSync(path.join(tvDir, file), 'utf8');
    const numericMatches = [...src.matchAll(/fontSize:\s*([0-9]+(?:\.[0-9]+)?)/g)];
    for (const m of numericMatches) {
      const size = parseFloat(m[1]);
      assert.ok(
        size >= 13,
        `${file} contains fontSize: ${size} which is below the 13dp (26px) 10-foot minimum`,
      );
    }
  }
});
