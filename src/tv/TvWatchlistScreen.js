import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvPosterCard } from './TvPosterCard';
import { TvContentRail } from './TvContentRail';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { getUserWatchlistCollections, watchlistEntryKey } from '../lib/watchlistModel';
import { sortRailItems } from '../lib/railSort';
import { TV_SPACE, TV_TYPE } from './tvTheme';

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
  const scrollRef = useRef(null);
  const [selectedFilter, setSelectedFilter] = useState('shelves');
  const [sortMode, setSortMode] = useState('rating');
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const handleRailFocus = useCallback((railY) => {
    if (typeof railY === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, railY - 120), animated: true });
    }
  }, []);

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
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.title}>
          Watchlist ({selectedFilter === 'shelves' ? watchlist.length : filteredItems.length})
        </Text>

        <TvFocusable
          appearance="text"
          onPress={() => setSortMode((prev) => (prev === 'rating' ? 'year' : 'rating'))}
          scaleOnFocus={1.04}
          borderRadius={6}
          style={styles.sortPill}
        >
          {({ focused }) => (
            <Text style={[styles.sortText, focused && styles.textFocused]}>
              {sortMode === 'rating' ? 'Highest Rated' : 'Release Year'}
            </Text>
          )}
        </TvFocusable>
      </View>

      {/* Filter Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterStrip}
      >
        {[
          { key: 'shelves', label: `Collections (${collectionShelves.length})` },
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
              appearance="text"
              hasTVPreferredFocus={idx === 0}
              onPress={() => handleSelectTab(tab.key)}
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.filterPill}
            >
              {({ focused }) => (
                <View style={styles.filterInner}>
                  <Text
                    style={[
                      styles.filterPillText,
                      active && styles.filterPillTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
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
              title={shelf.col.name}
              data={shelf.items.slice(0, 32)}
              savedKeys={savedKeys}
              onSelectItem={onSelectItem}
              onToggleWatchlist={onToggleWatchlist}
              onExplore={() => handleSelectTab(shelf.col.id)}
              onRailFocus={handleRailFocus}
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
                appearance="text"
                onPress={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
                scaleOnFocus={1.04}
                borderRadius={8}
                style={styles.loadMoreBtn}
              >
                {({ focused }) => (
                  <Text style={[styles.loadMoreText, focused && styles.textFocused]}>
                    Show More ({visibleLimit} of {filteredItems.length})
                  </Text>
                )}
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
  sortPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  textFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterStrip: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 4,
  },
  filterPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterInner: {
    alignItems: 'center',
  },
  filterPillText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  filterPillTextActive: {
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
  emptyBox: {
    alignItems: 'center',
    marginHorizontal: TV_SPACE.overscanX,
    marginTop: 24,
    padding: 36,
  },
  emptyTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    marginTop: 6,
    textAlign: 'center',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV_SPACE.cardGap,
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
    fontWeight: '700',
  },
});
