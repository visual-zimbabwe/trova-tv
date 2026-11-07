import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TvFocusable } from './TvFocusable';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { resolveRatingValue } from '../lib/ratings';

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
 * Borderless edge-to-edge artwork that blends seamlessly onto the dark canvas,
 * elevating smoothly on D-pad focus without cluttered badges or icon boxes.
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

  const cardWidth = isBackdrop ? 236 : isCompact ? 124 : isGrid ? 142 : 138;
  const cardHeight = isBackdrop ? 133 : isCompact ? 186 : isGrid ? 213 : 207;

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
          scaleOnFocus={1.06}
          borderRadius={10}
          style={[styles.cardFrame, { width: cardWidth, height: cardHeight }]}
          accessibilityLabel={`${item.title || item.name}${yearLabel ? `, ${yearLabel}` : ''}${
            ratingLabel ? `, rated ${ratingLabel}` : ''
          }`}
        >
          {({ focused }) => (
            <View style={[styles.artworkContainer, { width: cardWidth - 4, height: cardHeight - 4 }]}>
              <MediaArtwork
                uri={imageUri}
                title={item.title || item.name}
                variant={isBackdrop ? 'backdrop' : 'poster'}
                style={StyleSheet.absoluteFill}
              />

              <LinearGradient
                colors={['transparent', 'rgba(4,3,1,0.18)', 'rgba(4,3,1,0.92)']}
                locations={[0, 0.52, 1]}
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
                  <Text numberOfLines={1} style={styles.metaText}>
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
    paddingLeft: 30,
  },
  rankBadgeWrap: {
    bottom: 6,
    left: 2,
    position: 'absolute',
    zIndex: 2,
  },
  rankNumeral: {
    color: 'rgba(212, 168, 83, 0.62)',
    fontFamily: fonts.display,
    fontSize: 62,
    fontWeight: '800',
    lineHeight: 66,
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
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bottomCaption: {
    paddingHorizontal: 9,
    paddingBottom: 8,
    paddingTop: 18,
  },
  honorEyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  titleText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '700',
  },
  titleTextFocused: {
    color: GOLD_ACCENT,
  },
  metaText: {
    color: '#A39E94',
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: 1,
  },
});
