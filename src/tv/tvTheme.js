const GOLD_ACCENT = '#D4A853';

/**
 * 10-Foot Living-Room Design System Tokens (960x540 dp @ 2.0x = 1920x1080 px).
 * - Focus is always warm white (#FFF4DC) with lift, ring, and soft halo glow.
 * - Selected / Active is always warm gold (#D4A853).
 * - Minimum readable typography is 13-14 dp (26-28 px on 1080p TV).
 */
export const TV_FOCUS = {
  ringColor: '#FFF4DC',
  ringWidth: 3,
  gapColor: '#040301',
  glow: '0px 0px 18px 4px rgba(255, 244, 220, 0.45)',
  scale: 1.08,
  scaleSmall: 1.05,
  surface: 'rgba(255, 244, 220, 0.16)',
};

export const TV_SELECTED = {
  fill: GOLD_ACCENT,
  text: '#140F06',
};

export const TV_TYPE = {
  hero: 34,
  h1: 26,
  railTitle: 20,
  cardTitle: 15,
  body: 16,
  meta: 14,
  button: 16,
  eyebrow: 13,
  badge: 13,
  MIN: 13,
};

export const TV_SPACE = {
  railCollapsedWidth: 68,
  railExpandedWidth: 240,
  stageLeft: 96,
  overscanX: 32,
  overscanY: 24,
  cardGap: 20,
  railGap: 32,
  targetMin: 48,
  chipMin: 42,
};

export const TV_CARD = {
  posterW: 164,
  posterH: 246,
  gridW: 160,
  gridH: 240,
  compactW: 144,
  compactH: 216,
  backdropW: 272,
  backdropH: 153,
};
