import React, { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { MediaArtwork } from '../components/MediaArtwork';
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
 * Unobstructed poster artwork with zero overlaid text; subtle scale + soft glow on focus,
 * revealing concise metadata below the card only when focused.
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
  const [isFocused, setIsFocused] = useState(false);

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
          appearance="card"
          onPress={() => onPress?.(item)}
          onLongPress={onLongPress ? () => onLongPress(item) : undefined}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={() => setIsFocused(false)}
          hasTVPreferredFocus={hasTVPreferredFocus}
          scaleOnFocus={TV_FOCUS.scale}
          focusBackgroundColor="#0C0A07"
          borderRadius={10}
          style={[styles.cardFrame, { width: cardWidth, height: cardHeight }]}
          accessibilityLabel={`${item.title || item.name}${yearLabel ? `, ${yearLabel}` : ''}${
            ratingLabel ? `, rated ${ratingLabel}` : ''
          }`}
        >
          <View style={[styles.artworkContainer, { width: innerW, height: innerH }]}>
            <MediaArtwork
              uri={imageUri}
              title={item.title || item.name}
              variant={isBackdrop ? 'backdrop' : 'poster'}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </TvFocusable>

        <View style={styles.focusMetaSlot}>
          {isFocused && metaParts.length > 0 ? (
            <Text numberOfLines={1} style={styles.metaTextFocused}>
              {metaParts.join(' · ')}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rankedWrap: {
    paddingLeft: 44,
  },
  rankBadgeWrap: {
    bottom: 28,
    left: 0,
    position: 'absolute',
    width: 42,
    alignItems: 'center',
    zIndex: 2,
  },
  rankNumeral: {
    color: 'rgba(212, 168, 83, 0.68)',
    fontFamily: fonts.display,
    fontSize: 54,
    fontWeight: '800',
    lineHeight: 58,
    textShadowColor: '#040301',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  cardFrame: {
    backgroundColor: '#0C0A07',
    overflow: 'hidden',
  },
  artworkContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  focusMetaSlot: {
    height: 22,
    justifyContent: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  metaTextFocused: {
    color: '#D8D2C7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
});
