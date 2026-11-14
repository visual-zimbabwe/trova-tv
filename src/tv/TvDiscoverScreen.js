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
import { TV_SPACE, TV_TYPE } from './tvTheme';

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
        <Text style={styles.title}>Discover</Text>
        <TvFocusable
          appearance="text"
          onPress={() => {
            resetFilters?.();
            search?.();
          }}
          scaleOnFocus={1.04}
          borderRadius={6}
          style={styles.resetBtn}
        >
          {({ focused }) => (
            <Text style={[styles.resetBtnText, focused && styles.textFocused]}>Reset All</Text>
          )}
        </TvFocusable>
      </View>

      {/* Row 1: Media Type + Sort + Rating */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {[
          { key: 'movie', label: 'Films', pref: true },
          { key: 'tv', label: 'TV Series' },
        ].map((m) => {
          const active = currentMediaType === m.key;
          return (
            <TvFocusable
              key={m.key}
              appearance="text"
              hasTVPreferredFocus={Boolean(m.pref)}
              onPress={() => applyAndSearch({ mediaType: m.key })}
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.pill}
            >
              {({ focused }) => (
                <View style={styles.pillInner}>
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {m.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}

        {SORT_PRESETS.map((s) => {
          const active = currentSort === s.key;
          return (
            <TvFocusable
              key={s.key}
              appearance="text"
              onPress={() => applyAndSearch({ sortBy: s.key })}
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.pill}
            >
              {({ focused }) => (
                <View style={styles.pillInner}>
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {s.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}

        {RATING_PRESETS.map((r) => {
          const active = currentMinRating === r.min;
          return (
            <TvFocusable
              key={r.label}
              appearance="text"
              onPress={() => applyAndSearch({ minRating: r.min })}
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.pill}
            >
              {({ focused }) => (
                <View style={styles.pillInner}>
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {r.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
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
              appearance="text"
              onPress={() =>
                applyAndSearch({
                  languageCodes: l.code ? [l.code] : [],
                })
              }
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.pill}
            >
              {({ focused }) => (
                <View style={styles.pillInner}>
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {l.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}

        {DECADE_PRESETS.map((d) => {
          const active = currentFromYear === d.from;
          return (
            <TvFocusable
              key={d.label}
              appearance="text"
              onPress={() => applyAndSearch({ fromYear: d.from, toYear: d.to })}
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.pill}
            >
              {({ focused }) => (
                <View style={styles.pillInner}>
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {d.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
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
                appearance="text"
                onPress={() => {
                  toggleGenre?.(g.id);
                  const currentList = filters.genreIds || [];
                  const nextGenres = currentList.includes(g.id)
                    ? currentList.filter((id) => id !== g.id)
                    : [...currentList, g.id];
                  search?.({ ...filters, genreIds: nextGenres });
                }}
                scaleOnFocus={1.04}
                borderRadius={6}
                style={styles.pill}
              >
                {({ focused }) => (
                  <View style={styles.pillInner}>
                    <Text
                      style={[
                        styles.pillText,
                        included && styles.pillTextActive,
                        excluded && { color: '#FF6961' },
                        focused && styles.textFocused,
                      ]}
                    >
                      {excluded ? `Excl. ${g.name}` : g.name}
                    </Text>
                    {included ? <View style={styles.activeUnderline} /> : null}
                  </View>
                )}
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
            appearance="text"
            onPress={loadMore}
            scaleOnFocus={1.04}
            borderRadius={8}
            style={styles.loadMoreBtn}
          >
            {({ focused }) =>
              loadingMore ? (
                <ActivityIndicator size="small" color={GOLD_ACCENT} />
              ) : (
                <Text style={[styles.loadMoreText, focused && styles.textFocused]}>Load More</Text>
              )
            }
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
    paddingBottom: 64,
    paddingTop: 14,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  resetBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  resetBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  textFocused: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  filterRow: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillInner: {
    alignItems: 'center',
  },
  pillText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  pillTextActive: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  activeUnderline: {
    backgroundColor: GOLD_ACCENT,
    borderRadius: 1,
    height: 2,
    marginTop: 4,
    width: '100%',
  },
  centerBox: {
    alignItems: 'center',
    padding: 48,
  },
  statusText: {
    color: '#C7C1B7',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.body,
    marginTop: 12,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV_SPACE.cardGap,
    marginTop: 12,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  loadMoreWrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  loadMoreBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  loadMoreText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.button,
    fontWeight: '800',
  },
});
