import React, { memo, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TvPosterCard } from './TvPosterCard';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { TV_CARD, TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * 10-Foot Horizontal Content Swimlane Rail.
 * Aligns the focused card at a fixed left keyline (`viewPosition: 0`) so card #1
 * never scrolls under the sidebar and vertical/horizontal D-pad focus is predictable.
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
      {/* Header Row — left-aligned actions keep vertical D-pad axis predictable */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <View style={styles.titleLine}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

            <View style={styles.actionsGroup}>
              {onToggleSort ? (
                <TvFocusable
                  onPress={onToggleSort}
                  onFocus={notifyRailFocus}
                  scaleOnFocus={TV_FOCUS.scaleSmall}
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
                  onFocus={notifyRailFocus}
                  scaleOnFocus={TV_FOCUS.scaleSmall}
                  borderRadius={999}
                  style={styles.headerPill}
                  accessibilityLabel={`See all ${title}`}
                >
                  <Text style={styles.headerPillText}>Explore All</Text>
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
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  titleGroup: {
    flex: 1,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  titleLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
  },
  subtitle: {
    color: '#B5AFA4',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
  },
  actionsGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginLeft: 6,
  },
  headerPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerPillText: {
    color: '#F0DEC0',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 16,
  },
  cardSlot: {
    marginRight: TV_SPACE.cardGap,
  },
});
