import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvHeroBillboard } from './TvHeroBillboard';
import { TvContentRail } from './TvContentRail';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';
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
  const scrollRef = useRef(null);
  const [selectedLang, setSelectedLang] = useState(null);
  const [railSortPrefs, setRailSortPrefs] = useState({});
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);

  const handleTopFocus = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleRailFocus = useCallback((railY) => {
    if (typeof railY === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, railY - 120), animated: true });
    }
  }, []);

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
        title: 'Saved Films',
        items: sortRailItems(defaultMovies, mode).slice(0, 28),
        sortMode: mode,
      });
    }

    if (mediaFilter !== 'movie' && defaultTv.length > 0) {
      const mode = railSortPrefs['wl-tv'] || 'rating';
      rails.push({
        id: 'wl-tv',
        title: 'Saved Series',
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
          title: col.name,
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

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Widescreen 16:9 Hero Billboard */}
      <TvHeroBillboard
        items={heroItems}
        savedKeys={savedKeys}
        onSelectItem={onSelectItem}
        onPlayNow={onPlayNow}
        onToggleWatchlist={onToggleWatchlist}
        onHeroFocus={handleTopFocus}
      />

      {/* Clean Text Filter Bar */}
      <View style={styles.filterBar}>
        {[
          { key: 'all', value: null, label: 'All Programme' },
          { key: 'movie', value: 'movie', label: 'Films' },
          { key: 'tv', value: 'tv', label: 'TV Series' },
        ].map((facet) => {
          const active = (mediaFilter || null) === facet.value;
          return (
            <TvFocusable
              key={facet.key}
              appearance="text"
              onFocus={handleTopFocus}
              onPress={() => onMediaFilterChange?.(facet.value)}
              scaleOnFocus={TV_FOCUS.scaleSmall}
              borderRadius={6}
              style={styles.filterItem}
            >
              {({ focused }) => (
                <View style={styles.filterItemInner}>
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                      focused && styles.filterTextFocused,
                    ]}
                  >
                    {facet.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}

        {/* Language Quick Filters */}
        {availableLanguages.map((lang) => {
          const active = selectedLang === lang.code;
          return (
            <TvFocusable
              key={lang.code}
              appearance="text"
              onFocus={handleTopFocus}
              onPress={() => setSelectedLang((prev) => (prev === lang.code ? null : lang.code))}
              scaleOnFocus={TV_FOCUS.scaleSmall}
              borderRadius={6}
              style={styles.filterItem}
            >
              {({ focused }) => (
                <View style={styles.filterItemInner}>
                  <Text
                    style={[
                      styles.filterText,
                      active && styles.filterTextActive,
                      focused && styles.filterTextFocused,
                    ]}
                  >
                    {lang.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}

        <TvFocusable
          appearance="text"
          onFocus={handleTopFocus}
          onPress={() => onNavigateTab?.('discover')}
          scaleOnFocus={TV_FOCUS.scaleSmall}
          borderRadius={6}
          style={styles.filterItem}
        >
          {({ focused }) => (
            <Text
              style={[
                styles.filterText,
                { color: GOLD_ACCENT },
                focused && styles.filterTextFocused,
              ]}
            >
              Discover Filters
            </Text>
          )}
        </TvFocusable>
      </View>

      {/* Top 10 Trending Swimlane (Ranked 10-Foot Rail) */}
      {filteredTrending.length > 0 ? (
        <TvContentRail
          title="Top 10 Trending Now"
          data={filteredTrending.slice(0, 10)}
          showRank={true}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
          onRailFocus={handleRailFocus}
        />
      ) : null}

      {/* Watchlist & User Collections Swimlanes */}
      {watchlistRails.map((rail) => (
        <TvContentRail
          key={rail.id}
          title={rail.title}
          data={rail.items}
          savedKeys={savedKeys}
          sortMode={rail.sortMode}
          onToggleSort={() => handleToggleRailSort(rail.id)}
          onSeeAll={() => onNavigateTab?.('watchlist')}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
          onRailFocus={handleRailFocus}
        />
      ))}

      {/* Now Playing in Cinemas */}
      {filteredNowPlaying.length > 0 ? (
        <TvContentRail
          title="Now Playing in Cinemas"
          data={filteredNowPlaying}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
          onRailFocus={handleRailFocus}
        />
      ) : null}

      {/* IMDb Top 100 Ranked Swimlanes */}
      {imdbTopMovies.length > 0 ? (
        <TvContentRail
          title="IMDb Top 100 Films"
          data={imdbTopMovies}
          showRank={true}
          savedKeys={savedKeys}
          onSeeAll={() => onNavigateTab?.('collections')}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
          onRailFocus={handleRailFocus}
        />
      ) : null}

      {imdbTopTv.length > 0 ? (
        <TvContentRail
          title="IMDb Top 100 TV Series"
          data={imdbTopTv}
          showRank={true}
          savedKeys={savedKeys}
          onSeeAll={() => onNavigateTab?.('collections')}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
          onRailFocus={handleRailFocus}
        />
      ) : null}

      {/* Global Film & TV Award Ceremonies Preview */}
      {awardRails.map((row, idx) => {
        const rowId = row.category?.id || row.id || `award-${idx}`;
        const rowTitle = row.category?.label || row.category?.fullName || row.title || 'Honors';
        return (
          <TvContentRail
            key={rowId}
            title={rowTitle}
            data={(row.items || []).slice(0, 20)}
            savedKeys={savedKeys}
            onSeeAll={() => onNavigateTab?.('awards')}
            onSelectItem={onSelectItem}
            onToggleWatchlist={onToggleWatchlist}
            onRailFocus={handleRailFocus}
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
    paddingBottom: 64,
  },
  filterBar: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 22,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  filterItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterItemInner: {
    alignItems: 'center',
  },
  filterText: {
    color: '#ABA59B',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  filterTextActive: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  filterTextFocused: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  activeUnderline: {
    backgroundColor: GOLD_ACCENT,
    borderRadius: 1,
    height: 2,
    marginTop: 4,
    width: '100%',
  },
});
