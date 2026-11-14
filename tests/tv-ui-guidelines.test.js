import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  TV_ACTIVE,
  TV_CARD,
  TV_FOCUS,
  TV_SELECTED,
  TV_SPACE,
  TV_TYPE,
} from '../src/tv/tvTheme.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('tvTheme defines restrained 10-foot focus, typography (>=13dp), spacing, and card tokens', () => {
  assert.match(TV_FOCUS.ringColor, /rgba\(255,\s*244,\s*220/);
  assert.ok(TV_FOCUS.ringWidth >= 2);
  assert.match(TV_FOCUS.glow, /rgba\(255,\s*244,\s*220/);
  assert.ok(TV_FOCUS.scale >= 1.05 && TV_FOCUS.scale <= 1.08);
  assert.ok(TV_FOCUS.scaleSmall >= 1.03 && TV_FOCUS.scaleSmall <= 1.06);
  assert.match(TV_FOCUS.surface, /rgba\(255,\s*244,\s*220/);

  assert.equal(TV_ACTIVE.text, '#D4A853');
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
  assert.match(src, /\.\.\.innerStyle/);
  assert.match(src, /innerStyle,/);
  assert.doesNotMatch(
    src.slice(pressableIdx),
    /\bstyle,\b/,
    'Pressable must receive innerStyle (without flex) so row-flex buttons do not collapse vertically',
  );
});

test('TvSearchScreen renders Space, Delete, Clear row and fits 6-column keyboard grid inside left pane', () => {
  const src = read('src/tv/TvSearchScreen.js');
  assert.match(src, /accessibilityLabel="Space"/);
  assert.match(src, /accessibilityLabel="Backspace"/);
  assert.match(src, /accessibilityLabel="Clear search"/);
  assert.match(src, /specialKeysRow:\s*\{[^}]*height:\s*\d+/s);

  const paneWidth = Number(src.match(/leftKeyboardPane:\s*\{[^}]*width:\s*(\d+)/s)?.[1]);
  const keyWidth = Number(src.match(/keyCell:\s*\{[^}]*width:\s*(\d+)/s)?.[1]);
  const keyGap = Number(src.match(/keyGrid:\s*\{[^}]*gap:\s*(\d+)/s)?.[1]);
  const innerWidth = paneWidth - 2 * TV_SPACE.overscanX;
  assert.ok(
    6 * keyWidth + 5 * keyGap <= innerWidth,
    `6-column keyboard (${6 * keyWidth + 5 * keyGap}dp) must fit inside leftKeyboardPane inner width (${innerWidth}dp)`,
  );
});

test('TvSidebar and TvTopNav expose text-only navigation and distinguish active tab from focus', () => {
  const src = read('src/tv/TvSidebar.js');
  assert.match(src, /railFootprint/);
  assert.match(src, /position:\s*'absolute'/);
  assert.match(src, /backdropScrim/);
  assert.match(src, /activeBar/);

  const topNav = read('src/tv/TvTopNav.js');
  assert.match(topNav, /TV_NAV_ITEMS/);
  assert.match(topNav, /activeUnderline/);
});

test('TvContentRail aligns focused cards to fixed left keyline (viewPosition: 0) and reports railY', () => {
  const src = read('src/tv/TvContentRail.js');
  assert.match(src, /viewPosition:\s*0/);
  assert.match(src, /onRailFocus\?\.\(railYRef\.current\)/);
});

test('No TV screen or component imports icon fonts or renders eyebrow headers', () => {
  const tvDir = path.join(root, 'src/tv');
  const files = fs.readdirSync(tvDir).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const src = fs.readFileSync(path.join(tvDir, file), 'utf8');
    assert.ok(
      !src.includes('@expo/vector-icons') && !src.includes('Ionicons'),
      `${file} must use clean text labels only (no Ionicons)`,
    );
    assert.ok(
      !/eyebrow=/.test(src),
      `${file} must not pass redundant eyebrow headers to rails or hero`,
    );
  }
});

test('TvPosterCard keeps poster artwork unobstructed and shows metadata only on focus', () => {
  const src = read('src/tv/TvPosterCard.js');
  assert.ok(!src.includes('LinearGradient'), 'TvPosterCard must not overlay gradient over poster');
  assert.ok(!src.includes('bottomCaption'), 'TvPosterCard must not overlay caption text on poster');
  assert.match(src, /isFocused\s*&&\s*metaParts\.length\s*>\s*0/);
});

test('TvHeroBillboard auto-rotates without manual Prev/Next controls or eyebrow header', () => {
  const src = read('src/tv/TvHeroBillboard.js');
  assert.ok(!src.includes('>Prev<') && !src.includes('>Next<'), 'No Prev/Next buttons on spotlight');
  assert.ok(!src.includes('FEATURED SPOTLIGHT'), 'No FEATURED SPOTLIGHT eyebrow on spotlight');
  assert.match(src, /setInterval/);
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
