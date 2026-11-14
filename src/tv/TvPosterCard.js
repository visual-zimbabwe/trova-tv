import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TvFocusable } from './TvFocusable';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { resolveRatingValue } from '../lib/ratings';
import { TV_CARD, TV_FOCUS, TV_TYPE } from './tvTheme';

function formatCardRating(item) {
  const val = resolveRatingValue(item);
  if (val && val > 0) return val.toFixed(1);
  if (item?.rating && item.rating !== 'N/A') {
    const num = parseFloat(String(item.rating).split('/')[0]);
    if (!Number.isNaN(num) && num > 0) return num.toFixed(1);
  }
  return null;
}

/**
 * 10-Foot TV Poster / Backdrop / Ranked Card.
 * Spacious artwork card that lifts with a warm-white focus ring and halo glow,
 * high-contrast 10-foot typography (>= 13-15dp), and non-overlapping rank numerals.
 */
export const TvPosterCard = memo(function TvPosterCard({
  item,
  rank,
  variant = 'poster', // 'poster' | 'grid' | 'backdrop' | 'compact'
  saved = false,
  onPress,
  onLongPress,
  onFocus,
  hasTVPreferredFocus = false,
}) {
  if (!item) return null;

  const isBackdrop = variant === 'backdrop';
  const isCompact = variant === 'compact';
  const isGrid = variant === 'grid';

  const cardWidth = isBackdrop
    ? TV_CARD.backdropW
    : isCompact
      ? TV_CARD.compactW
      : isGrid
        ? TV_CARD.gridW
        : TV_CARD.posterW;
  const cardHeight = isBackdrop
    ? TV_CARD.backdropH
    : isCompact
      ? TV_CARD.compactH
      : isGrid
        ? TV_CARD.gridH
        : TV_CARD.posterH;

  const imageUri = isBackdrop
    ? item.backdropUrl || item.posterUrl || item.Poster
    : item.posterUrl || item.Poster || item.backdropUrl;

  const ratingLabel = formatCardRating(item);
  const yearLabel = item.year || item.releaseYear || '';
  const honorSub = item.ceremonyShortName || item.awardCategory || item.sublabel || null;

  const metaParts = [
    yearLabel && yearLabel !== 'N/A' ? yearLabel : null,
    ratingLabel,
    saved ? 'Saved' : null,
  ].filter(Boolean);

  const innerW = cardWidth - TV_FOCUS.ringWidth * 2;
  const innerH = cardHeight - TV_FOCUS.ringWidth * 2;

  return (
    <View style={[styles.wrap, rank != null ? styles.rankedWrap : null]}>
      {rank != null ? (
        <View style={styles.rankBadgeWrap} pointerEvents="none">
          <Text style={styles.rankNumeral}>{rank}</Text>
        </View>
      ) : null}

      <View style={{ width: cardWidth }}>
        <TvFocusable
          onPress={() => onPress?.(item)}
          onLongPress={onLongPress ? () => onLongPress(item) : undefined}
          onFocus={onFocus}
          hasTVPreferredFocus={hasTVPreferredFocus}
          scaleOnFocus={TV_FOCUS.scale}
          focusBackgroundColor="#0C0A07"
          borderRadius={12}
          style={[styles.cardFrame, { width: cardWidth, height: cardHeight }]}
          accessibilityLabel={`${item.title || item.name}${yearLabel ? `, ${yearLabel}` : ''}${
            ratingLabel ? `, rated ${ratingLabel}` : ''
          }`}
        >
          {({ focused }) => (
            <View style={[styles.artworkContainer, { width: innerW, height: innerH }]}>
              <MediaArtwork
                uri={imageUri}
                title={item.title || item.name}
                variant={isBackdrop ? 'backdrop' : 'poster'}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={
                  focused
                    ? ['transparent', 'rgba(4,3,1,0.34)', 'rgba(4,3,1,0.96)']
                    : ['transparent', 'rgba(4,3,1,0.22)', 'rgba(4,3,1,0.92)']
                }
                locations={[0, 0.48, 1]}
                style={StyleSheet.absoluteFill}
              />

              {/* Bottom Overlay Caption */}
              <View style={styles.bottomCaption}>
                {honorSub ? (
                  <Text numberOfLines={1} style={styles.honorEyebrow}>
                    {honorSub}
                  </Text>
                ) : null}
                <Text
                  numberOfLines={1}
                  style={[styles.titleText, focused && styles.titleTextFocused]}
                >
                  {item.title || item.name}
                </Text>
                {metaParts.length > 0 ? (
                  <Text
                    numberOfLines={1}
                    style={[styles.metaText, focused && styles.metaTextFocused]}
                  >
                    {metaParts.join(' · ')}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        </TvFocusable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  rankedWrap: {
    paddingLeft: 44,
  },
  rankBadgeWrap: {
    bottom: 8,
    left: 0,
    position: 'absolute',
    width: 42,
    alignItems: 'center',
    zIndex: 2,
  },
  rankNumeral: {
    color: 'rgba(212, 168, 83, 0.82)',
    fontFamily: fonts.display,
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 60,
    textShadowColor: '#040301',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  cardFrame: {
    backgroundColor: '#0C0A07',
    overflow: 'hidden',
  },
  artworkContainer: {
    borderRadius: 9,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bottomCaption: {
    paddingHorizontal: 11,
    paddingBottom: 10,
    paddingTop: 22,
  },
  honorEyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  titleText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.cardTitle,
    fontWeight: '700',
  },
  titleTextFocused: {
    color: '#FFFFFF',
  },
  metaText: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    marginTop: 2,
  },
  metaTextFocused: {
    color: '#F5EEE1',
  },
});
