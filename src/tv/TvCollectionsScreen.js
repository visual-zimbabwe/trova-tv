import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvContentRail } from './TvContentRail';
import { TvPosterCard } from './TvPosterCard';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { fetchStaticCollectionRows, getStaticCollectionRows } from '../lib/collectionMovieRows';
import { getImdbTop100Movies, getImdbTop100Tv } from '../lib/imdbTop100Catalog';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * S07: 10-Foot Franchises (470+ Movie Collections) & IMDb Top 100 Canon Browser.
 */
export function TvCollectionsScreen({
  savedKeys,
  onSelectItem,
  onToggleWatchlist,
}) {
  const scrollRef = useRef(null);
  const [tab, setTab] = useState('franchises'); // 'franchises' | 'imdb-movies' | 'imdb-tv'
  const [searchFilter, setSearchFilter] = useState('');

  const handleTopFocus = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleRailFocus = useCallback((railY) => {
    if (typeof railY === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, railY - 120), animated: true });
    }
  }, []);
  const [rows, setRows] = useState(() => {
    try {
      return getStaticCollectionRows() || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (rows.length === 0) {
      fetchStaticCollectionRows()
        .then((res) => setRows(res || []))
        .catch(() => {});
    }
  }, [rows.length]);

  const filteredFranchiseRows = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    const list = q
      ? rows.filter((r) => (r.title || r.name || '').toLowerCase().includes(q))
      : rows;
    return list.slice(0, 32);
  }, [rows, searchFilter]);

  const imdbMovies = useMemo(() => getImdbTop100Movies(), []);
  const imdbTv = useMemo(() => getImdbTop100Tv(), []);

  const LETTER_FILTERS = ['ALL', 'STAR', 'MARVEL', 'DC', 'HARRY', 'JAMES', 'FAST', 'ALIEN', 'LORD'];

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <View>
          <Text style={styles.eyebrow}>CURATED ARCHIVES & CANON</Text>
          <Text style={styles.title}>Franchises & IMDb Top 100</Text>
        </View>

        <View style={styles.tabsRow}>
          <TvFocusable
            hasTVPreferredFocus={true}
            onFocus={handleTopFocus}
            onPress={() => setTab('franchises')}
            scaleOnFocus={TV_FOCUS.scaleSmall}
            borderRadius={999}
            style={[styles.tabPill, tab === 'franchises' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === 'franchises' && styles.tabTextActive]}>
              Film Franchises ({rows.length})
            </Text>
          </TvFocusable>

          <TvFocusable
            onFocus={handleTopFocus}
            onPress={() => setTab('imdb-movies')}
            scaleOnFocus={TV_FOCUS.scaleSmall}
            borderRadius={999}
            style={[styles.tabPill, tab === 'imdb-movies' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === 'imdb-movies' && styles.tabTextActive]}>
              IMDb Top 100 Films
            </Text>
          </TvFocusable>

          <TvFocusable
            onFocus={handleTopFocus}
            onPress={() => setTab('imdb-tv')}
            scaleOnFocus={TV_FOCUS.scaleSmall}
            borderRadius={999}
            style={[styles.tabPill, tab === 'imdb-tv' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === 'imdb-tv' && styles.tabTextActive]}>
              IMDb Top 100 Series
            </Text>
          </TvFocusable>
        </View>
      </View>

      {tab === 'franchises' ? (
        <>
          <View style={styles.quickFilterRow}>
            {LETTER_FILTERS.map((kw) => {
              const active =
                (kw === 'ALL' && !searchFilter) ||
                searchFilter.toUpperCase() === kw;
              return (
                <TvFocusable
                  key={kw}
                  onFocus={handleTopFocus}
                  onPress={() => setSearchFilter(kw === 'ALL' ? '' : kw)}
                  scaleOnFocus={TV_FOCUS.scaleSmall}
                  borderRadius={999}
                  style={[styles.filterChip, active && styles.tabPillActive]}
                >
                  <Text style={[styles.filterChipText, active && styles.tabTextActive]}>
                    {kw === 'ALL' ? 'All Franchises' : kw}
                  </Text>
                </TvFocusable>
              );
            })}
          </View>

          {filteredFranchiseRows.map((row, idx) => (
            <TvContentRail
              key={row.id || row.title || idx}
              eyebrow="FILM SAGA"
              title={row.title || row.name}
              subtitle={`${row.items?.length || row.movies?.length || 0} films`}
              data={row.items || row.movies || []}
              savedKeys={savedKeys}
              onSelectItem={onSelectItem}
              onToggleWatchlist={onToggleWatchlist}
              onRailFocus={handleRailFocus}
            />
          ))}
        </>
      ) : (
        <View style={styles.gridWrap}>
          {(tab === 'imdb-tv' ? imdbTv : imdbMovies).map((item, idx) => {
            const key = watchlistEntryKey(item);
            const saved = Boolean(
              savedKeys &&
                key &&
                (typeof savedKeys.has === 'function'
                  ? savedKeys.has(key)
                  : Array.isArray(savedKeys) && savedKeys.includes(key))
            );
            return (
              <TvPosterCard
                key={`${key || item.tmdbId || idx}-${idx}`}
                item={item}
                rank={item.rank || idx + 1}
                saved={saved}
                onPress={onSelectItem}
                onLongPress={onToggleWatchlist}
              />
            );
          })}
        </View>
      )}
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
    paddingTop: 20,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tabPill: {
    alignItems: 'center',
    backgroundColor: '#191610',
    borderColor: 'rgba(212, 168, 83, 0.35)',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: GOLD_ACCENT,
    borderColor: GOLD_ACCENT,
  },
  tabText: {
    color: '#E6E1D7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#140F06',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  quickFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 22,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  filterChip: {
    alignItems: 'center',
    backgroundColor: '#14110C',
    borderColor: '#312D27',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipText: {
    color: '#E6CD9C',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV_SPACE.cardGap,
    paddingHorizontal: TV_SPACE.overscanX,
  },
});
