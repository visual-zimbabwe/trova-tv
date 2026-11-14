import React, { memo, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TvPosterCard } from './TvPosterCard';
import { TvFocusable } from './TvFocusable';
import { fonts } from '../theme/tokens';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { TV_CARD, TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * 10-Foot Horizontal Content Swimlane Rail.
 * Aligns the focused card at a fixed left keyline (`viewPosition: 0`) so card #1
 * never scrolls off-stage and vertical/horizontal D-pad focus is predictable.
 */
export const TvContentRail = memo(function TvContentRail({
  title,
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
  const railYRef = useRef(0);
  const handleSeeAll = onSeeAll || onExplore;

  const notifyRailFocus = useCallback(() => {
    onRailFocus?.(railYRef.current);
  }, [onRailFocus]);

  const handleCardFocus = useCallback(
    (index) => {
      notifyRailFocus();
      if (flatListRef.current && index >= 0 && index < data.length) {
        try {
          flatListRef.current.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0,
            viewOffset: TV_SPACE.overscanX,
          });
        } catch {
          // Ignore layout race before measurement
        }
      }
    },
    [data.length, notifyRailFocus],
  );

  if (!Array.isArray(data) || data.length === 0) return null;

  const baseCardW = variant === 'backdrop' ? TV_CARD.backdropW : TV_CARD.posterW;
  const rankExtra = showRank ? 44 : 0;
  const cardSpan = baseCardW + rankExtra + TV_SPACE.cardGap;

  return (
    <View
      style={styles.railContainer}
      onLayout={(e) => {
        railYRef.current = e.nativeEvent.layout.y;
      }}
    >
      {/* Header Row — essential short row label + borderless text actions */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <View style={styles.titleLine}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>

            <View style={styles.actionsGroup}>
              {onToggleSort ? (
                <TvFocusable
                  appearance="text"
                  onPress={onToggleSort}
                  onFocus={notifyRailFocus}
                  scaleOnFocus={TV_FOCUS.scaleSmall}
                  borderRadius={6}
                  style={styles.headerAction}
                  accessibilityLabel={`Sort ${title} by ${sortMode === 'year' ? 'rating' : 'year'}`}
                >
                  {({ focused }) => (
                    <Text
                      style={[
                        styles.headerActionText,
                        focused && styles.headerActionTextFocused,
                      ]}
                    >
                      {sortMode === 'year' ? 'Chronological' : 'Top Rated'}
                    </Text>
                  )}
                </TvFocusable>
              ) : null}

              {handleSeeAll ? (
                <TvFocusable
                  appearance="text"
                  onPress={handleSeeAll}
                  onFocus={notifyRailFocus}
                  scaleOnFocus={TV_FOCUS.scaleSmall}
                  borderRadius={6}
                  style={styles.headerAction}
                  accessibilityLabel={`See all ${title}`}
                >
                  {({ focused }) => (
                    <Text
                      style={[
                        styles.headerActionText,
                        focused && styles.headerActionTextFocused,
                      ]}
                    >
                      See All
                    </Text>
                  )}
                </TvFocusable>
              ) : null}
            </View>
          </View>
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
    marginBottom: TV_SPACE.railGap,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 4,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  titleGroup: {
    flex: 1,
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
  },
  actionsGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginLeft: 6,
  },
  headerAction: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerActionText: {
    color: '#B5AFA4',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  headerActionTextFocused: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 12,
  },
  cardSlot: {
    marginRight: TV_SPACE.cardGap,
  },
});
