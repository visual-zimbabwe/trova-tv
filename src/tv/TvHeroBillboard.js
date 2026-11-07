import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { TvFocusable } from './TvFocusable';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { resolveRatingValue } from '../lib/ratings';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { fetchHeroSpotlightDetail } from '../lib/tmdb';

function formatHeroRuntime(minutes, mediaType) {
  if (!minutes || minutes <= 0) return null;
  if (mediaType === 'tv') return `${minutes}m / ep`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hrs) return `${mins}m`;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * 10-Foot Widescreen 16:9 Hero Billboard.
 * Automatically enriches spotlight items with 4K textless widescreen backdrops,
 * official title treatment logos, theatrical poster artwork, and synopses.
 * Designed to blend seamlessly onto the #040301 canvas with zero hard borders or icon clutter.
 */
export function TvHeroBillboard({
  items = [],
  savedKeys,
  onSelectItem,
  onPlayNow,
  onToggleWatchlist,
  eyebrow = 'FEATURED SPOTLIGHT',
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [enrichedMap, setEnrichedMap] = useState({});

  useEffect(() => {
    if (!items || items.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [items]);

  // Enrich active and next spotlight items with 4K backdrop, titleLogo, synopsis, and genres
  useEffect(() => {
    if (!items || items.length === 0) return undefined;
    let cancelled = false;
    const indicesToFetch = [
      activeIndex % items.length,
      (activeIndex + 1) % items.length,
    ];

    indicesToFetch.forEach((idx) => {
      const candidate = items[idx];
      if (!candidate?.tmdbId) return;
      const mType = candidate.mediaType || 'movie';
      const cacheKey = `${mType}:${candidate.tmdbId}`;
      if (enrichedMap[cacheKey]) return;

      fetchHeroSpotlightDetail(mType, candidate.tmdbId)
        .then((detail) => {
          if (cancelled || !detail) return;
          setEnrichedMap((prev) => (prev[cacheKey] ? prev : { ...prev, [cacheKey]: detail }));
        })
        .catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [activeIndex, items, enrichedMap]);

  if (!items || items.length === 0) return null;

  const safeIndex = activeIndex % items.length;
  const rawItem = items[safeIndex];
  if (!rawItem) return null;

  const mType = rawItem.mediaType || 'movie';
  const cacheKey = `${mType}:${rawItem.tmdbId}`;
  const enriched = enrichedMap[cacheKey] || null;
  const item = enriched ? { ...rawItem, ...enriched } : rawItem;

  const backdropUri =
    item.heroBackdropUrl || item.backdropUrl || item.posterUrl || item.Poster;
  const posterUri = item.posterUrl || item.Poster || item.backdropUrl;
  const titleLogo = item.titleLogo?.url ? item.titleLogo : null;

  const ratingVal = resolveRatingValue(item);
  const ratingText =
    ratingVal > 0
      ? ratingVal.toFixed(1)
      : item.rating && item.rating !== 'N/A'
        ? String(item.rating).split('/')[0]
        : null;
  const yearText = item.year || item.releaseYear || '';
  const runtimeText = formatHeroRuntime(item.runtimeMinutes, mType);
  const typeText = mType === 'tv' ? 'TV Series' : 'Feature Film';

  const genresText = Array.isArray(item.genres)
    ? item.genres.slice(0, 3).join(', ')
    : typeof item.genres === 'string' && item.genres !== 'Unknown Genre' && item.genres !== 'N/A'
      ? item.genres
      : '';

  const synopsisText =
    (item.synopsis && item.synopsis !== 'No synopsis available.' ? item.synopsis : null) ||
    item.overview ||
    item.plot ||
    null;

  const metaParts = [
    typeText,
    yearText,
    runtimeText,
    ratingText ? `IMDb ${ratingText}` : null,
    genresText,
  ].filter(Boolean);

  const key = watchlistEntryKey(item);
  const isSaved = Boolean(
    savedKeys &&
      key &&
      (typeof savedKeys.has === 'function'
        ? savedKeys.has(key)
        : Array.isArray(savedKeys) && savedKeys.includes(key)),
  );

  return (
    <View style={styles.heroWrap}>
      {/* Widescreen 16:9 Cinema Still Stage */}
      {backdropUri ? (
        <ExpoImage
          source={{ uri: backdropUri }}
          style={styles.heroBackdrop}
          contentFit="cover"
          contentPosition="top center"
          transition={450}
        />
      ) : (
        <View style={[styles.heroBackdrop, { backgroundColor: '#0C0A07' }]} />
      )}

      {/* Multi-stop horizontal vignette so backdrop melts seamlessly into #040301 */}
      <LinearGradient
        colors={[
          '#040301',
          '#040301',
          'rgba(4,3,1,0.92)',
          'rgba(4,3,1,0.58)',
          'rgba(4,3,1,0.18)',
          'transparent',
        ]}
        locations={[0, 0.22, 0.42, 0.64, 0.84, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Top and bottom canvas melt */}
      <LinearGradient
        colors={['rgba(4,3,1,0.55)', 'transparent', 'rgba(4,3,1,0.88)', '#040301']}
        locations={[0, 0.28, 0.82, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Foreground Stage: Framed 2:3 Theatrical Key Art + Editorial Column */}
      <View style={styles.foregroundRow}>
        {posterUri ? (
          <View style={styles.posterCard}>
            <MediaArtwork
              uri={posterUri}
              title={item.title || item.name}
              variant="poster"
              style={styles.posterImage}
            />
          </View>
        ) : null}

        <View style={styles.editorialCol}>
          <Text style={styles.eyebrowText}>
            {eyebrow}
            {item.ceremonyName ? `  ·  ${item.ceremonyName}` : ''}
          </Text>

          {titleLogo ? (
            <ExpoImage
              source={{ uri: titleLogo.url }}
              style={[
                styles.logoImage,
                titleLogo.aspectRatio
                  ? { width: Math.min(340, Math.round(64 * titleLogo.aspectRatio)) }
                  : null,
              ]}
              contentFit="contain"
              contentPosition="left center"
              transition={250}
            />
          ) : (
            <Text numberOfLines={2} style={styles.heroTitle}>
              {item.title || item.name}
            </Text>
          )}

          <Text numberOfLines={1} style={styles.metaLine}>
            {metaParts.join('  ·  ')}
          </Text>

          {synopsisText ? (
            <Text numberOfLines={2} style={styles.synopsis}>
              {synopsisText}
            </Text>
          ) : null}

          {/* Seamless Borderless Action Row */}
          <View style={styles.ctaRow}>
            <TvFocusable
              hasTVPreferredFocus={true}
              onPress={() => (onPlayNow ? onPlayNow(item) : onSelectItem?.(item))}
              scaleOnFocus={1.04}
              borderRadius={999}
              focusBorderColor="#FEFBF6"
              style={styles.primaryBtn}
              accessibilityLabel={`Watch ${item.title || item.name} now`}
            >
              <Text style={styles.primaryBtnText}>Watch Now</Text>
            </TvFocusable>

            <TvFocusable
              onPress={() => onSelectItem?.(item)}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={styles.tonalBtn}
              accessibilityLabel={`More info for ${item.title || item.name}`}
            >
              <Text style={styles.tonalBtnText}>More Info</Text>
            </TvFocusable>

            {onToggleWatchlist ? (
              <TvFocusable
                onPress={() => onToggleWatchlist(item)}
                scaleOnFocus={1.04}
                borderRadius={999}
                style={styles.tonalBtn}
                accessibilityLabel={
                  isSaved
                    ? `Remove ${item.title || item.name} from Watchlist`
                    : `Add ${item.title || item.name} to Watchlist`
                }
              >
                <Text style={[styles.tonalBtnText, isSaved && { color: GOLD_ACCENT }]}>
                  {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
                </Text>
              </TvFocusable>
            ) : null}

            {items.length > 1 ? (
              <View style={styles.cycleGroup}>
                <TvFocusable
                  onPress={() =>
                    setActiveIndex((prev) => (prev - 1 + items.length) % items.length)
                  }
                  scaleOnFocus={1.06}
                  borderRadius={999}
                  style={styles.StepBtn}
                  accessibilityLabel="Previous spotlight title"
                >
                  <Text style={styles.stepBtnText}>Prev</Text>
                </TvFocusable>
                <Text style={styles.counterText}>
                  {safeIndex + 1} / {items.length}
                </Text>
                <TvFocusable
                  onPress={() => setActiveIndex((prev) => (prev + 1) % items.length)}
                  scaleOnFocus={1.06}
                  borderRadius={999}
                  style={styles.StepBtn}
                  accessibilityLabel="Next spotlight title"
                >
                  <Text style={styles.stepBtnText}>Next</Text>
                </TvFocusable>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    height: 312,
    justifyContent: 'flex-end',
    marginBottom: 10,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    left: '20%',
  },
  foregroundRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 22,
    paddingBottom: 16,
    paddingHorizontal: 28,
    zIndex: 5,
  },
  posterCard: {
    backgroundColor: '#0E0C09',
    borderRadius: 10,
    elevation: 10,
    height: 198,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    width: 132,
  },
  posterImage: {
    height: '100%',
    width: '100%',
  },
  editorialCol: {
    flex: 1,
    maxWidth: '68%',
  },
  eyebrowText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  logoImage: {
    height: 62,
    marginBottom: 8,
    width: 260,
  },
  heroTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 39,
    marginBottom: 6,
  },
  metaLine: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 12.5,
    fontWeight: '600',
    marginBottom: 8,
  },
  synopsis: {
    color: '#C2BDB5',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  ctaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  primaryBtn: {
    backgroundColor: GOLD_ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  primaryBtnText: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '800',
  },
  tonalBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  tonalBtnText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '600',
  },
  cycleGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginLeft: 6,
  },
  StepBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  stepBtnText: {
    color: '#C2BDB5',
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '600',
  },
  counterText: {
    color: '#8E887E',
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 2,
  },
});
