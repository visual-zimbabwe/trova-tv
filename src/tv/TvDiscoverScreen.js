import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvPosterCard } from './TvPosterCard';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { watchlistEntryKey } from '../lib/watchlistModel';

const SORT_PRESETS = [
  { key: 'popularity.desc', label: 'Most Popular' },
  { key: 'vote_average.desc', label: 'Highest Rated' },
  { key: 'primary_release_date.desc', label: 'Newest First' },
  { key: 'revenue.desc', label: 'Box Office' },
];

const RATING_PRESETS = [
  { label: 'Any Rating', min: '' },
  { label: '7.0+', min: '7' },
  { label: '7.5+', min: '7.5' },
  { label: '8.0+', min: '8' },
];

const LANGUAGE_PRESETS = [
  { code: '', label: 'All Languages' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'es', label: 'Spanish' },
  { code: 'da', label: 'Danish' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
];

const DECADE_PRESETS = [
  { label: 'All Years', from: '', to: '' },
  { label: '2020s', from: '2020', to: '2026' },
  { label: '2010s', from: '2010', to: '2019' },
  { label: '2000s', from: '2000', to: '2009' },
  { label: '1990s', from: '1990', to: '1999' },
  { label: 'Classic <1990', from: '1920', to: '1989' },
];

/**
 * S06: 10-Foot Multi-Facet Discover Studio.
 * Seamless, borderless filter pills mapped to accurate DiscoverViewModel keys
 * (mediaType, sortBy, minRating, languageCodes, fromYear, toYear, genreIds).
 */
export function TvDiscoverScreen({
  discoverVm,
  savedKeys,
  onSelectItem,
  onToggleWatchlist,
}) {
  const filters = discoverVm?.filters || {};
  const updateFilter = discoverVm?.updateFilter;
  const resetFilters = discoverVm?.resetFilters;
  const genres = discoverVm?.genres || [];
  const toggleGenre = discoverVm?.toggleGenre;
  const results = discoverVm?.results || [];
  const trendingResults = discoverVm?.trendingResults || [];
  const loading = discoverVm?.loading || discoverVm?.trendingLoading;
  const loadingMore = discoverVm?.loadingMore;
  const hasMore = discoverVm?.hasMore;
  const loadMore = discoverVm?.loadMore;
  const search = discoverVm?.search;
  const loadTrending = discoverVm?.loadTrending;
  const loadGenres = discoverVm?.loadGenres;

  const currentMediaType = filters.mediaType || 'movie';

  useEffect(() => {
    loadGenres?.(currentMediaType);
    if (results.length === 0) {
      search?.();
      loadTrending?.(currentMediaType);
    }
  }, [loadGenres, loadTrending, results.length, search, currentMediaType]);

  if (!discoverVm) return null;

  const currentSort = filters.sortBy || 'popularity.desc';
  const currentMinRating = String(filters.minRating || '');
  const currentLang = (filters.languageCodes && filters.languageCodes[0]) || '';
  const currentFromYear = String(filters.fromYear || '');

  const displayItems = results.length > 0 ? results : trendingResults;

  const applyAndSearch = (patch) => {
    const next = { ...filters, ...patch };
    Object.entries(patch).forEach(([k, v]) => updateFilter?.(k, v));
    if (patch.mediaType && patch.mediaType !== filters.mediaType) {
      loadGenres?.(patch.mediaType);
    }
    search?.(next);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerBlock}>
        <View>
          <Text style={styles.eyebrow}>DISCOVER STUDIO</Text>
          <Text style={styles.title}>Browse by Taste & Criteria</Text>
        </View>
        <TvFocusable
          onPress={() => {
            resetFilters?.();
            search?.();
          }}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={styles.resetBtn}
        >
          <Text style={styles.resetBtnText}>Reset All</Text>
        </TvFocusable>
      </View>

      {/* Row 1: Media Type + Sort + Rating */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <TvFocusable
          hasTVPreferredFocus={true}
          onPress={() => applyAndSearch({ mediaType: 'movie' })}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={[styles.pill, currentMediaType === 'movie' && styles.pillActive]}
        >
          <Text style={[styles.pillText, currentMediaType === 'movie' && styles.pillTextActive]}>
            Films
          </Text>
        </TvFocusable>

        <TvFocusable
          onPress={() => applyAndSearch({ mediaType: 'tv' })}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={[styles.pill, currentMediaType === 'tv' && styles.pillActive]}
        >
          <Text style={[styles.pillText, currentMediaType === 'tv' && styles.pillTextActive]}>
            TV Series
          </Text>
        </TvFocusable>

        {SORT_PRESETS.map((s) => {
          const active = currentSort === s.key;
          return (
            <TvFocusable
              key={s.key}
              onPress={() => applyAndSearch({ sortBy: s.key })}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{s.label}</Text>
            </TvFocusable>
          );
        })}

        {RATING_PRESETS.map((r) => {
          const active = currentMinRating === r.min;
          return (
            <TvFocusable
              key={r.label}
              onPress={() => applyAndSearch({ minRating: r.min })}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{r.label}</Text>
            </TvFocusable>
          );
        })}
      </ScrollView>

      {/* Row 2: Languages + Decades */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {LANGUAGE_PRESETS.map((l) => {
          const active = currentLang === l.code;
          return (
            <TvFocusable
              key={l.label}
              onPress={() =>
                applyAndSearch({
                  languageCodes: l.code ? [l.code] : [],
                })
              }
              scaleOnFocus={1.04}
              borderRadius={999}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{l.label}</Text>
            </TvFocusable>
          );
        })}

        {DECADE_PRESETS.map((d) => {
          const active = currentFromYear === d.from;
          return (
            <TvFocusable
              key={d.label}
              onPress={() => applyAndSearch({ fromYear: d.from, toYear: d.to })}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{d.label}</Text>
            </TvFocusable>
          );
        })}
      </ScrollView>

      {/* Row 3: Genres */}
      {genres.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {genres.map((g) => {
            const included = (filters.genreIds || []).includes(g.id);
            const excluded = (filters.excludeGenreIds || []).includes(g.id);
            return (
              <TvFocusable
                key={g.id}
                onPress={() => {
                  toggleGenre?.(g.id);
                  const currentList = filters.genreIds || [];
                  const nextGenres = currentList.includes(g.id)
                    ? currentList.filter((id) => id !== g.id)
                    : [...currentList, g.id];
                  search?.({ ...filters, genreIds: nextGenres });
                }}
                scaleOnFocus={1.04}
                borderRadius={999}
                style={[
                  styles.pill,
                  included && styles.pillActive,
                  excluded && styles.pillExcluded,
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    included && styles.pillTextActive,
                    excluded && { color: '#FF6961' },
                  ]}
                >
                  {excluded ? `Excl. ${g.name}` : g.name}
                </Text>
              </TvFocusable>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Poster Grid */}
      {loading && displayItems.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={GOLD_ACCENT} />
          <Text style={styles.statusText}>Discovering matching titles...</Text>
        </View>
      ) : displayItems.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.statusText}>No titles match this combination of filters.</Text>
        </View>
      ) : (
        <View style={styles.gridWrap}>
          {displayItems.map((item, idx) => {
            const key = watchlistEntryKey(item);
            const saved = Boolean(
              savedKeys &&
                key &&
                (typeof savedKeys.has === 'function'
                  ? savedKeys.has(key)
                  : Array.isArray(savedKeys) && savedKeys.includes(key)),
            );
            return (
              <TvPosterCard
                key={`${key || item.tmdbId || idx}-${idx}`}
                item={item}
                variant="grid"
                saved={saved}
                onPress={onSelectItem}
                onLongPress={onToggleWatchlist}
              />
            );
          })}
        </View>
      )}

      {/* Load More Pagination Button */}
      {hasMore && displayItems.length > 0 ? (
        <View style={styles.loadMoreWrap}>
          <TvFocusable
            onPress={loadMore}
            scaleOnFocus={1.04}
            borderRadius={999}
            style={styles.loadMoreBtn}
          >
            {loadingMore ? (
              <ActivityIndicator size="small" color="#1A1204" />
            ) : (
              <Text style={styles.loadMoreText}>Load More</Text>
            )}
          </TvFocusable>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040301',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 56,
    paddingTop: 16,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '800',
  },
  resetBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  resetBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '700',
  },
  filterRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 28,
  },
  pill: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: GOLD_ACCENT,
  },
  pillExcluded: {
    backgroundColor: 'rgba(255, 105, 97, 0.16)',
  },
  pillText: {
    color: '#D8D3C8',
    fontFamily: fonts.label,
    fontSize: 11.5,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  centerBox: {
    alignItems: 'center',
    padding: 48,
  },
  statusText: {
    color: '#A39E94',
    fontFamily: fonts.heading,
    fontSize: 15,
    marginTop: 12,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    paddingHorizontal: 28,
  },
  loadMoreWrap: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadMoreBtn: {
    backgroundColor: GOLD_ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  loadMoreText: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '800',
  },
});
