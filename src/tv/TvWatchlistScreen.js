import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvPosterCard } from './TvPosterCard';
import { TvContentRail } from './TvContentRail';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { getUserWatchlistCollections, watchlistEntryKey } from '../lib/watchlistModel';
import { sortRailItems } from '../lib/railSort';

const PAGE_SIZE = 60;

/**
 * S10a: 10-Foot Watchlist & Custom Collections Screen.
 * Clean borderless canvas with horizontal collection shelves and fast paginated grid.
 */
export function TvWatchlistScreen({
  watchlist = [],
  collections = [],
  savedKeys,
  onSelectItem,
  onToggleWatchlist,
}) {
  const [selectedFilter, setSelectedFilter] = useState('shelves');
  const [sortMode, setSortMode] = useState('rating');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const userCols = useMemo(() => getUserWatchlistCollections(collections), [collections]);

  const collectionShelves = useMemo(() => {
    return userCols
      .map((col) => {
        const items = watchlist.filter(
          (item) => Array.isArray(item.collectionIds) && item.collectionIds.includes(col.id),
        );
        return {
          col,
          count: items.length,
          items: sortRailItems(items, sortMode),
        };
      })
      .filter((shelf) => shelf.count > 0);
  }, [userCols, watchlist, sortMode]);

  const filteredItems = useMemo(() => {
    if (selectedFilter === 'shelves') return [];
    const base = watchlist.filter((item) => {
      if (selectedFilter === 'all') return true;
      if (selectedFilter === 'movie') return item.mediaType === 'movie';
      if (selectedFilter === 'tv') return item.mediaType === 'tv';
      return Array.isArray(item.collectionIds) && item.collectionIds.includes(selectedFilter);
    });
    return sortRailItems(base, sortMode);
  }, [watchlist, selectedFilter, sortMode]);

  const visibleGridItems = useMemo(
    () => filteredItems.slice(0, visibleLimit),
    [filteredItems, visibleLimit],
  );

  const moviesCount = useMemo(
    () => watchlist.filter((i) => i.mediaType === 'movie').length,
    [watchlist],
  );
  const tvCount = useMemo(
    () => watchlist.filter((i) => i.mediaType === 'tv').length,
    [watchlist],
  );

  const handleSelectTab = (key) => {
    setSelectedFilter(key);
    setVisibleLimit(PAGE_SIZE);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <View>
          <Text style={styles.eyebrow}>PERSONAL LIBRARY · MOBILE SYNCED</Text>
          <Text style={styles.title}>
            My Watchlist ({selectedFilter === 'shelves' ? watchlist.length : filteredItems.length})
          </Text>
        </View>

        <TvFocusable
          onPress={() => setSortMode((prev) => (prev === 'rating' ? 'year' : 'rating'))}
          scaleOnFocus={1.04}
          borderRadius={999}
          style={styles.sortPill}
        >
          <Text style={styles.sortText}>
            {sortMode === 'rating' ? 'Highest Rated' : 'Release Year'}
          </Text>
        </TvFocusable>
      </View>

      {/* Filter Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        {[
          { key: 'shelves', label: `Collection Shelves (${collectionShelves.length})` },
          { key: 'all', label: `All Saved (${watchlist.length})` },
          { key: 'movie', label: `Films (${moviesCount})` },
          { key: 'tv', label: `TV Series (${tvCount})` },
          ...userCols.map((c) => {
            const cnt = watchlist.filter(
              (item) => Array.isArray(item.collectionIds) && item.collectionIds.includes(c.id),
            ).length;
            return { key: c.id, label: `${c.name} (${cnt})` };
          }),
        ].map((tab, idx) => {
          const active = selectedFilter === tab.key;
          return (
            <TvFocusable
              key={tab.key}
              hasTVPreferredFocus={idx === 0}
              onPress={() => handleSelectTab(tab.key)}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {tab.label}
              </Text>
            </TvFocusable>
          );
        })}
      </ScrollView>

      {watchlist.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No saved titles in this view</Text>
          <Text style={styles.emptySub}>
            Open any Movie or TV Series and select “Add to Watchlist” to build your personal cinema shelf.
          </Text>
        </View>
      ) : selectedFilter === 'shelves' ? (
        <View>
          {collectionShelves.map((shelf) => (
            <TvContentRail
              key={shelf.col.id}
              eyebrow={shelf.col.source === 'custom' ? 'CUSTOM COLLECTION' : 'WATCHLIST SHELF'}
              title={shelf.col.name}
              subtitle={`${shelf.count} titles`}
              data={shelf.items.slice(0, 32)}
              savedKeys={savedKeys}
              onSelectItem={onSelectItem}
              onToggleWatchlist={onToggleWatchlist}
              onExplore={() => handleSelectTab(shelf.col.id)}
            />
          ))}
        </View>
      ) : (
        <View>
          <View style={styles.gridWrap}>
            {visibleGridItems.map((item, idx) => {
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

          {filteredItems.length > visibleLimit ? (
            <View style={styles.loadMoreWrap}>
              <TvFocusable
                onPress={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
                scaleOnFocus={1.04}
                borderRadius={999}
                style={styles.loadMoreBtn}
              >
                <Text style={styles.loadMoreText}>
                  Show More ({visibleLimit} of {filteredItems.length})
                </Text>
              </TvFocusable>
            </View>
          ) : null}
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
  sortPill: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  sortText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: 11.5,
    fontWeight: '700',
  },
  filterStrip: {
    gap: 8,
    marginBottom: 18,
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
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#1A1204',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.03)',
    borderRadius: 14,
    marginHorizontal: 28,
    marginTop: 24,
    padding: 36,
  },
  emptyTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: '#A39E94',
    fontFamily: fonts.body,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingHorizontal: 28,
  },
  loadMoreWrap: {
    alignItems: 'center',
    marginTop: 24,
  },
  loadMoreBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  loadMoreText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '700',
  },
});
