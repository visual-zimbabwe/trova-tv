import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvContentRail } from './TvContentRail';
import { TvPosterCard } from './TvPosterCard';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { fetchStaticCollectionRows, getStaticCollectionRows } from '../lib/collectionMovieRows';
import { getImdbTop100Movies, getImdbTop100Tv } from '../lib/imdbTop100Catalog';
import { watchlistEntryKey } from '../lib/watchlistModel';

/**
 * S07: 10-Foot Franchises (470+ Movie Collections) & IMDb Top 100 Canon Browser.
 */
export function TvCollectionsScreen({
  savedKeys,
  onSelectItem,
  onToggleWatchlist,
}) {
  const [tab, setTab] = useState('franchises'); // 'franchises' | 'imdb-movies' | 'imdb-tv'
  const [searchFilter, setSearchFilter] = useState('');
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
            onPress={() => setTab('franchises')}
            scaleOnFocus={1.05}
            borderRadius={999}
            style={[styles.tabPill, tab === 'franchises' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === 'franchises' && styles.tabTextActive]}>
              Film Franchises ({rows.length})
            </Text>
          </TvFocusable>

          <TvFocusable
            onPress={() => setTab('imdb-movies')}
            scaleOnFocus={1.05}
            borderRadius={999}
            style={[styles.tabPill, tab === 'imdb-movies' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, tab === 'imdb-movies' && styles.tabTextActive]}>
              IMDb Top 100 Films
            </Text>
          </TvFocusable>

          <TvFocusable
            onPress={() => setTab('imdb-tv')}
            scaleOnFocus={1.05}
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
                  onPress={() => setSearchFilter(kw === 'ALL' ? '' : kw)}
                  scaleOnFocus={1.05}
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
    paddingBottom: 56,
    paddingTop: 16,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    backgroundColor: '#191610',
    borderColor: 'rgba(212, 168, 83, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabPillActive: {
    backgroundColor: GOLD_ACCENT,
    borderColor: GOLD_ACCENT,
  },
  tabText: {
    color: '#E1DDD7',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  quickFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 28,
  },
  filterChip: {
    backgroundColor: '#14110C',
    borderColor: '#312D27',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterChipText: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '600',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 28,
  },
});
