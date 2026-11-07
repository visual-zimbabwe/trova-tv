import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvHeroBillboard } from './TvHeroBillboard';
import { TvContentRail } from './TvContentRail';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import {
  getAvailableWatchlistLanguages,
  getUserWatchlistCollections,
  isDefaultCollectionId,
} from '../lib/watchlistModel';
import { fetchHomeNowPlayingRail, fetchHomeTraktTrendingRail } from '../lib/homeFeed';
import {
  getAwardCeremonyRows,
  getTvAwardCeremonyRows,
} from '../lib/awardsCatalog';
import { getImdbTop100Movies, getImdbTop100Tv } from '../lib/imdbTop100Catalog';
import { sortRailItems, toggleRailSortMode } from '../lib/railSort';
import { loadRailSortPrefs, saveRailSortPrefs } from '../lib/storage';

/**
 * S02: 10-Foot Home / Movies / TV Shows Hub.
 * Combines a widescreen 16:9 Hero Billboard with horizontal D-pad swimlanes
 * for Trending Top 10, Now Playing, Watchlist Collections, IMDb Top 100, and Global Awards.
 */
export function TvHomeScreen({
  watchlist = [],
  collections = [],
  spotlight = [],
  savedKeys,
  mediaFilter = null, // null | 'movie' | 'tv'
  onMediaFilterChange,
  onSelectItem,
  onPlayNow,
  onToggleWatchlist,
  onNavigateTab,
}) {
  const [selectedLang, setSelectedLang] = useState(null);
  const [railSortPrefs, setRailSortPrefs] = useState({});
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);

  useEffect(() => {
    let mounted = true;
    loadRailSortPrefs()
      .then((prefs) => {
        if (mounted && prefs && typeof prefs === 'object') {
          setRailSortPrefs(prefs);
        }
      })
      .catch(() => {});

    fetchHomeTraktTrendingRail()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.items || [];
        setTrending(list);
      })
      .catch(() => {});

    fetchHomeNowPlayingRail()
      .then((res) => {
        if (!mounted) return;
        const list = Array.isArray(res) ? res : res?.items || [];
        setNowPlaying(list);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleRailSort = useCallback((railId) => {
    setRailSortPrefs((prev) => {
      const nextMode = toggleRailSortMode(prev[railId] || 'rating');
      const next = { ...prev, [railId]: nextMode };
      saveRailSortPrefs(next);
      return next;
    });
  }, []);

  const matchesFilter = useCallback(
    (item) => {
      if (!item) return false;
      if (mediaFilter && item.mediaType && item.mediaType !== mediaFilter) {
        return false;
      }
      if (selectedLang) {
        const code =
          item.originalLanguageCode ||
          (typeof item.originalLanguage === 'string' ? item.originalLanguage : '') ||
          item.language ||
          '';
        if (selectedLang === 'other') {
          if (['en', 'fr', 'es', 'de', 'ja', 'ko', 'it', 'da', 'zh', 'hi'].includes(code)) {
            return false;
          }
        } else if (code && code !== selectedLang) {
          return false;
        }
      }
      return true;
    },
    [mediaFilter, selectedLang],
  );

  const filteredWatchlist = useMemo(
    () => watchlist.filter(matchesFilter),
    [watchlist, matchesFilter],
  );

  const availableLanguages = useMemo(() => {
    const raw = getAvailableWatchlistLanguages(watchlist, collections);
    return raw.slice(0, 7);
  }, [watchlist, collections]);

  const filteredTrending = useMemo(
    () => trending.filter(matchesFilter).slice(0, 12),
    [trending, matchesFilter],
  );

  const filteredNowPlaying = useMemo(
    () =>
      mediaFilter === 'tv' ? [] : nowPlaying.filter(matchesFilter).slice(0, 16),
    [nowPlaying, mediaFilter, matchesFilter],
  );

  const imdbTopMovies = useMemo(
    () => (mediaFilter === 'tv' ? [] : getImdbTop100Movies().slice(0, 20)),
    [mediaFilter],
  );

  const imdbTopTv = useMemo(
    () => (mediaFilter === 'movie' ? [] : getImdbTop100Tv().slice(0, 20)),
    [mediaFilter],
  );

  const awardRails = useMemo(() => {
    const filmRows = mediaFilter === 'tv' ? [] : getAwardCeremonyRows().slice(0, 5);
    const tvRows = mediaFilter === 'movie' ? [] : getTvAwardCeremonyRows().slice(0, 5);
    return [...filmRows, ...tvRows];
  }, [mediaFilter]);

  const userCollections = useMemo(
    () => getUserWatchlistCollections(collections),
    [collections],
  );

  const watchlistRails = useMemo(() => {
    const rails = [];
    const defaultMovies = filteredWatchlist.filter(
      (item) =>
        item.mediaType === 'movie' &&
        (!item.collectionIds?.length || item.collectionIds.some(isDefaultCollectionId)),
    );
    const defaultTv = filteredWatchlist.filter(
      (item) =>
        item.mediaType === 'tv' &&
        (!item.collectionIds?.length || item.collectionIds.some(isDefaultCollectionId)),
    );

    if (mediaFilter !== 'tv' && defaultMovies.length > 0) {
      const mode = railSortPrefs['wl-movies'] || 'rating';
      rails.push({
        id: 'wl-movies',
        eyebrow: 'MY WATCHLIST',
        title: 'Saved Films',
        subtitle: `${defaultMovies.length} titles`,
        items: sortRailItems(defaultMovies, mode).slice(0, 28),
        sortMode: mode,
      });
    }

    if (mediaFilter !== 'movie' && defaultTv.length > 0) {
      const mode = railSortPrefs['wl-tv'] || 'rating';
      rails.push({
        id: 'wl-tv',
        eyebrow: 'MY WATCHLIST',
        title: 'Saved Series',
        subtitle: `${defaultTv.length} series`,
        items: sortRailItems(defaultTv, mode).slice(0, 28),
        sortMode: mode,
      });
    }

    userCollections.forEach((col) => {
      const colItems = filteredWatchlist.filter(
        (item) => Array.isArray(item.collectionIds) && item.collectionIds.includes(col.id),
      );
      if (colItems.length > 0) {
        const railId = `col-${col.id}`;
        const mode = railSortPrefs[railId] || 'rating';
        rails.push({
          id: railId,
          eyebrow: 'COLLECTION',
          title: col.name,
          subtitle: `${colItems.length} titles`,
          items: sortRailItems(colItems, mode).slice(0, 28),
          sortMode: mode,
        });
      }
    });

    return rails;
  }, [filteredWatchlist, mediaFilter, railSortPrefs, userCollections]);

  const heroItems = useMemo(() => {
    const combined = [
      ...(filteredTrending || []),
      ...(filteredNowPlaying || []),
      ...(spotlight ? spotlight.filter(matchesFilter) : []),
      ...(filteredWatchlist || []),
    ];
    const seen = new Set();
    const out = [];
    for (const item of combined) {
      if (!item?.tmdbId) continue;
      const k = `${item.mediaType || 'movie'}:${item.tmdbId}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(item);
      if (out.length >= 10) break;
    }
    return out;
  }, [spotlight, matchesFilter, filteredTrending, filteredNowPlaying, filteredWatchlist]);

  const headerEyebrow =
    mediaFilter === 'movie'
      ? 'CINEMA PROGRAMME'
      : mediaFilter === 'tv'
        ? 'TELEVISION SERIES'
        : 'FEATURED SPOTLIGHT';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Widescreen 16:9 Hero Billboard */}
      <TvHeroBillboard
        items={heroItems}
        savedKeys={savedKeys}
        eyebrow={headerEyebrow}
        onSelectItem={onSelectItem}
        onPlayNow={onPlayNow}
        onToggleWatchlist={onToggleWatchlist}
      />

      {/* Seamless Borderless Facet Filter Bar */}
      <View style={styles.filterBar}>
        <TvFocusable
          onPress={() => onMediaFilterChange?.(null)}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={[styles.filterPill, !mediaFilter && styles.filterPillActive]}
        >
          <Text style={[styles.filterPillText, !mediaFilter && styles.filterPillTextActive]}>
            All Programme
          </Text>
        </TvFocusable>

        <TvFocusable
          onPress={() => onMediaFilterChange?.('movie')}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={[styles.filterPill, mediaFilter === 'movie' && styles.filterPillActive]}
        >
          <Text
            style={[
              styles.filterPillText,
              mediaFilter === 'movie' && styles.filterPillTextActive,
            ]}
          >
            Films
          </Text>
        </TvFocusable>

        <TvFocusable
          onPress={() => onMediaFilterChange?.('tv')}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={[styles.filterPill, mediaFilter === 'tv' && styles.filterPillActive]}
        >
          <Text
            style={[styles.filterPillText, mediaFilter === 'tv' && styles.filterPillTextActive]}
          >
            TV Series
          </Text>
        </TvFocusable>

        {/* Language Quick Filters */}
        {availableLanguages.map((lang) => {
          const active = selectedLang === lang.code;
          return (
            <TvFocusable
              key={lang.code}
              onPress={() => setSelectedLang((prev) => (prev === lang.code ? null : lang.code))}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {lang.label}
              </Text>
            </TvFocusable>
          );
        })}

        <TvFocusable
          onPress={() => onNavigateTab?.('discover')}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={styles.filterPill}
        >
          <Text style={[styles.filterPillText, { color: GOLD_ACCENT }]}>Discover Filters</Text>
        </TvFocusable>
      </View>

      {/* Top 10 Trending Swimlane (Ranked 10-Foot Rail) */}
      {filteredTrending.length > 0 ? (
        <TvContentRail
          eyebrow="LIVE COMMUNITY PULSE"
          title="Top 10 Trending Now"
          subtitle="Ranked by live watchers"
          data={filteredTrending.slice(0, 10)}
          showRank={true}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {/* Watchlist & User Collections Swimlanes */}
      {watchlistRails.map((rail) => (
        <TvContentRail
          key={rail.id}
          eyebrow={rail.eyebrow}
          title={rail.title}
          subtitle={rail.subtitle}
          data={rail.items}
          savedKeys={savedKeys}
          sortMode={rail.sortMode}
          onToggleSort={() => handleToggleRailSort(rail.id)}
          onSeeAll={() => onNavigateTab?.('watchlist')}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ))}

      {/* Now Playing in Theaters */}
      {filteredNowPlaying.length > 0 ? (
        <TvContentRail
          eyebrow="IN THEATERS"
          title="Now Playing in Cinemas"
          subtitle="Current theatrical releases"
          data={filteredNowPlaying}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {/* IMDb Top 100 Ranked Swimlanes */}
      {imdbTopMovies.length > 0 ? (
        <TvContentRail
          eyebrow="ALL-TIME CANON"
          title="IMDb Top 100 Films"
          subtitle="Highest rated cinema classics"
          data={imdbTopMovies}
          showRank={true}
          savedKeys={savedKeys}
          onSeeAll={() => onNavigateTab?.('collections')}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {imdbTopTv.length > 0 ? (
        <TvContentRail
          eyebrow="PRESTIGE TELEVISION"
          title="IMDb Top 100 TV Series"
          subtitle="Highest rated television of all time"
          data={imdbTopTv}
          showRank={true}
          savedKeys={savedKeys}
          onSeeAll={() => onNavigateTab?.('collections')}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {/* Global Film & TV Award Ceremonies Preview */}
      {awardRails.map((row, idx) => {
        const rowId = row.category?.id || row.id || `award-${idx}`;
        const rowTitle = row.category?.label || row.category?.fullName || row.title || 'Honors';
        const rowEyebrow = row.category?.awardName || row.eyebrow || 'GLOBAL HONORS';
        return (
          <TvContentRail
            key={rowId}
            eyebrow={rowEyebrow}
            title={rowTitle}
            subtitle={`${row.items?.length || 0} winners`}
            data={(row.items || []).slice(0, 20)}
            savedKeys={savedKeys}
            onSeeAll={() => onNavigateTab?.('awards')}
            onSelectItem={onSelectItem}
            onToggleWatchlist={onToggleWatchlist}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: '#040301',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  filterBar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    paddingHorizontal: 28,
  },
  filterPill: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  filterPillActive: {
    backgroundColor: GOLD_ACCENT,
  },
  filterPillText: {
    color: '#D8D3C8',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
});
