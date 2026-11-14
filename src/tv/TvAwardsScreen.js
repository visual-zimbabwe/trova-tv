import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvContentRail } from './TvContentRail';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import {
  getAwardCeremonyRows,
  getTvAwardCeremonyRows,
} from '../lib/awardsCatalog';
import { TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * S08: 10-Foot Global Film (47 Ceremonies) & Television (40 Ceremonies) Awards Showcase.
 */
export function TvAwardsScreen({
  savedKeys,
  onSelectItem,
  onToggleWatchlist,
}) {
  const scrollRef = useRef(null);
  const [category, setCategory] = useState('all'); // 'all' | 'film' | 'tv'
  const [selectedCeremonyId, setSelectedCeremonyId] = useState(null);

  const handleTopFocus = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleRailFocus = useCallback((railY) => {
    if (typeof railY === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, railY - 120), animated: true });
    }
  }, []);

  const filmRows = useMemo(() => getAwardCeremonyRows() || [], []);
  const tvRows = useMemo(() => getTvAwardCeremonyRows() || [], []);

  const activeRows = useMemo(() => {
    const base =
      category === 'film'
        ? filmRows
        : category === 'tv'
          ? tvRows
          : [...filmRows.slice(0, 12), ...tvRows.slice(0, 12)];

    if (selectedCeremonyId) {
      return [...filmRows, ...tvRows].filter(
        (r) => (r.category?.id || r.id) === selectedCeremonyId,
      );
    }
    return base;
  }, [category, filmRows, tvRows, selectedCeremonyId]);

  const ceremonyFilterList = useMemo(() => {
    return category === 'tv' ? tvRows : category === 'film' ? filmRows : [...filmRows.slice(0, 10), ...tvRows.slice(0, 10)];
  }, [category, filmRows, tvRows]);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Honors</Text>

        <View style={styles.tabsRow}>
          {[
            { key: 'all', label: 'All Laureates (87)', pref: true },
            { key: 'film', label: `Film (${filmRows.length})` },
            { key: 'tv', label: `TV (${tvRows.length})` },
          ].map((tabItem) => {
            const active = category === tabItem.key;
            return (
              <TvFocusable
                key={tabItem.key}
                appearance="text"
                hasTVPreferredFocus={Boolean(tabItem.pref)}
                onFocus={handleTopFocus}
                onPress={() => {
                  setCategory(tabItem.key);
                  setSelectedCeremonyId(null);
                }}
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
                      {tabItem.label}
                    </Text>
                    {active ? <View style={styles.activeUnderline} /> : null}
                  </View>
                )}
              </TvFocusable>
            );
          })}
        </View>
      </View>

      {/* Ceremony Selector Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ceremonyStrip}
      >
        <TvFocusable
          appearance="text"
          onFocus={handleTopFocus}
          onPress={() => setSelectedCeremonyId(null)}
          scaleOnFocus={TV_FOCUS.scaleSmall}
          borderRadius={6}
          style={styles.ceremonyChip}
        >
          {({ focused }) => (
            <View style={styles.tabInner}>
              <Text
                style={[
                  styles.ceremonyChipText,
                  !selectedCeremonyId && styles.tabTextActive,
                  focused && styles.textFocused,
                ]}
              >
                All Ceremonies
              </Text>
              {!selectedCeremonyId ? <View style={styles.activeUnderline} /> : null}
            </View>
          )}
        </TvFocusable>

        {ceremonyFilterList.map((row, idx) => {
          const rowId = row.category?.id || row.id || `cer-${idx}`;
          const rowLabel = row.category?.label || row.category?.fullName || row.title || 'Ceremony';
          const active = selectedCeremonyId === rowId;
          return (
            <TvFocusable
              key={rowId}
              appearance="text"
              onFocus={handleTopFocus}
              onPress={() => setSelectedCeremonyId((prev) => (prev === rowId ? null : rowId))}
              scaleOnFocus={TV_FOCUS.scaleSmall}
              borderRadius={6}
              style={styles.ceremonyChip}
            >
              {({ focused }) => (
                <View style={styles.tabInner}>
                  <Text
                    style={[
                      styles.ceremonyChipText,
                      active && styles.tabTextActive,
                      focused && styles.textFocused,
                    ]}
                  >
                    {rowLabel}
                  </Text>
                  {active ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}
      </ScrollView>

      {/* Award Ceremony Swimlanes */}
      {activeRows.map((row, idx) => {
        const rowId = row.category?.id || row.id || `rail-${idx}`;
        const rowTitle = row.category?.label || row.category?.fullName || row.title || 'Honors';
        return (
          <TvContentRail
            key={rowId}
            title={rowTitle}
            data={row.items || []}
            savedKeys={savedKeys}
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
    marginBottom: 10,
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
  ceremonyStrip: {
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 4,
  },
  ceremonyChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ceremonyChipText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
});
