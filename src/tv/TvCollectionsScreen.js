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
        <Text style={styles.title}>Collections</Text>

        <View style={styles.tabsRow}>
          {[
            { key: 'franchises', label: `Film Franchises (${rows.length})`, pref: true },
            { key: 'imdb-movies', label: 'IMDb Top 100 Films' },
            { key: 'imdb-tv', label: 'IMDb Top 100 Series' },
          ].map((item) => {
            const active = tab === item.key;
            return (
              <TvFocusable
                key={item.key}
                appearance="text"
                hasTVPreferredFocus={Boolean(item.pref)}
                onFocus={handleTopFocus}
                onPress={() => setTab(item.key)}
                scaleOnFocus={TV_FOCUS.scaleSmall}
                borderRadius={6}
                style={styles.tabPill}
              >
                {({ focused }) => (
                  <View style={styles.tabInner}>
                    <Text
                      style={[
                        styles.tabText,
                        active && styles.tabTextActive,
                        focused && styles.textFocused,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {active ? <View style={styles.activeUnderline} /> : null}
                  </View>
                )}
              </TvFocusable>
            );
          })}
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
                  appearance="text"
                  onFocus={handleTopFocus}
                  onPress={() => setSearchFilter(kw === 'ALL' ? '' : kw)}
                  scaleOnFocus={TV_FOCUS.scaleSmall}
                  borderRadius={6}
                  style={styles.filterChip}
                >
                  {({ focused }) => (
                    <View style={styles.tabInner}>
                      <Text
                        style={[
                          styles.filterChipText,
                          active && styles.tabTextActive,
                          focused && styles.textFocused,
                        ]}
                      >
                        {kw === 'ALL' ? 'All Franchises' : kw}
                      </Text>
                      {active ? <View style={styles.activeUnderline} /> : null}
                    </View>
                  )}
                </TvFocusable>
              );
            })}
          </View>

          {filteredFranchiseRows.map((row, idx) => (
            <TvContentRail
              key={row.id || row.title || idx}
              title={row.title || row.name}
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
    paddingTop: 14,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  tabPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tabInner: {
    alignItems: 'center',
  },
  tabText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  tabTextActive: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  textFocused: {
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
  quickFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  filterChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterChipText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV_SPACE.cardGap,
    paddingHorizontal: TV_SPACE.overscanX,
  },
});
