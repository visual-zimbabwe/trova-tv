import React, { memo, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TvPosterCard } from './TvPosterCard';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { watchlistEntryKey } from '../lib/watchlistModel';

/**
 * 10-Foot Horizontal Content Swimlane Rail.
 * Automatically centers the focused card in the horizontal list when navigated via D-pad.
 */
export const TvContentRail = memo(function TvContentRail({
  title,
  eyebrow,
  subtitle,
  data = [],
  variant = 'poster',
  showRank = false,
  savedKeys,
  sortMode,
  onToggleSort,
  onSeeAll,
  onExplore,
  onSelectItem,
  onToggleWatchlist,
  onRailFocus,
}) {
  const flatListRef = useRef(null);
  const handleSeeAll = onSeeAll || onExplore;

  const handleCardFocus = useCallback(
    (index) => {
      onRailFocus?.();
      if (flatListRef.current && index >= 0 && index < data.length) {
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.25,
          });
        } catch {
          // Ignore layout race before measurement
        }
      }
    },
    [data.length, onRailFocus],
  );

  if (!Array.isArray(data) || data.length === 0) return null;

  const cardSpan = variant === 'backdrop' ? 248 : showRank ? 178 : 150;

  return (
    <View style={styles.railContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <View style={styles.titleLine}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.actionsGroup}>
          {onToggleSort ? (
            <TvFocusable
              onPress={onToggleSort}
              onFocus={onRailFocus}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={styles.headerPill}
              accessibilityLabel={`Sort ${title} by ${sortMode === 'year' ? 'rating' : 'year'}`}
            >
              <Text style={styles.headerPillText}>
                {sortMode === 'year' ? 'Chronological' : 'Top Rated'}
              </Text>
            </TvFocusable>
          ) : null}

          {handleSeeAll ? (
            <TvFocusable
              onPress={handleSeeAll}
              onFocus={onRailFocus}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={styles.headerPill}
              accessibilityLabel={`See all ${title}`}
            >
              <Text style={styles.headerPillText}>Explore All</Text>
            </TvFocusable>
          ) : null}
        </View>
      </View>

      {/* Horizontal Card Swimlane */}
      <FlatList
        ref={flatListRef}
        horizontal
        data={data}
        keyExtractor={(item, idx) =>
          `${watchlistEntryKey(item) || item.tmdbId || item.id || idx}-${idx}`
        }
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        initialNumToRender={7}
        maxToRenderPerBatch={8}
        windowSize={5}
        getItemLayout={(_, index) => ({
          length: cardSpan,
          offset: cardSpan * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => {
          const key = watchlistEntryKey(item);
          const isSaved = Boolean(
            savedKeys &&
              key &&
              (typeof savedKeys.has === 'function'
                ? savedKeys.has(key)
                : Array.isArray(savedKeys) && savedKeys.includes(key)),
          );
          return (
            <View style={styles.cardSlot}>
              <TvPosterCard
                item={item}
                variant={variant}
                rank={showRank ? index + 1 : undefined}
                saved={isSaved}
                onPress={onSelectItem}
                onLongPress={onToggleWatchlist}
                onFocus={() => handleCardFocus(index)}
              />
            </View>
          );
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  railContainer: {
    marginBottom: 22,
  },
  headerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 28,
  },
  titleGroup: {
    flex: 1,
    paddingRight: 16,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  titleLine: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8E887E',
    fontFamily: fonts.body,
    fontSize: 12,
  },
  actionsGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  headerPill: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerPillText: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 28,
    paddingVertical: 6,
  },
  cardSlot: {
    marginRight: 12,
  },
});
