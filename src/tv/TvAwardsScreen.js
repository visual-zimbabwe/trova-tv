import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TvContentRail } from './TvContentRail';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import {
  getAwardCeremonyRows,
  getTvAwardCeremonyRows,
} from '../lib/awardsCatalog';

/**
 * S08: 10-Foot Global Film (47 Ceremonies) & Television (40 Ceremonies) Awards Showcase.
 */
export function TvAwardsScreen({
  savedKeys,
  onSelectItem,
  onToggleWatchlist,
}) {
  const [category, setCategory] = useState('all'); // 'all' | 'film' | 'tv'
  const [selectedCeremonyId, setSelectedCeremonyId] = useState(null);

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
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <View>
          <Text style={styles.eyebrow}>87 GLOBAL FILM & TELEVISION HONORS</Text>
          <Text style={styles.title}>Academy, Festival & Critics Laureates</Text>
        </View>

        <View style={styles.tabsRow}>
          <TvFocusable
            hasTVPreferredFocus={true}
            onPress={() => {
              setCategory('all');
              setSelectedCeremonyId(null);
            }}
            scaleOnFocus={1.05}
            borderRadius={999}
            style={[styles.tabPill, category === 'all' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, category === 'all' && styles.tabTextActive]}>
              All Laureates (87)
            </Text>
          </TvFocusable>

          <TvFocusable
            onPress={() => {
              setCategory('film');
              setSelectedCeremonyId(null);
            }}
            scaleOnFocus={1.05}
            borderRadius={999}
            style={[styles.tabPill, category === 'film' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, category === 'film' && styles.tabTextActive]}>
              Film Ceremonies ({filmRows.length})
            </Text>
          </TvFocusable>

          <TvFocusable
            onPress={() => {
              setCategory('tv');
              setSelectedCeremonyId(null);
            }}
            scaleOnFocus={1.05}
            borderRadius={999}
            style={[styles.tabPill, category === 'tv' && styles.tabPillActive]}
          >
            <Text style={[styles.tabText, category === 'tv' && styles.tabTextActive]}>
              TV Honors ({tvRows.length})
            </Text>
          </TvFocusable>
        </View>
      </View>

      {/* Ceremony Selector Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.ceremonyStrip}
      >
        <TvFocusable
          onPress={() => setSelectedCeremonyId(null)}
          scaleOnFocus={1.05}
          borderRadius={999}
          style={[styles.ceremonyChip, !selectedCeremonyId && styles.tabPillActive]}
        >
          <Text style={[styles.ceremonyChipText, !selectedCeremonyId && styles.tabTextActive]}>
            All Ceremonies
          </Text>
        </TvFocusable>

        {ceremonyFilterList.map((row, idx) => {
          const rowId = row.category?.id || row.id || `cer-${idx}`;
          const rowLabel = row.category?.label || row.category?.fullName || row.title || 'Ceremony';
          const active = selectedCeremonyId === rowId;
          return (
            <TvFocusable
              key={rowId}
              onPress={() => setSelectedCeremonyId((prev) => (prev === rowId ? null : rowId))}
              scaleOnFocus={1.05}
              borderRadius={999}
              style={[styles.ceremonyChip, active && styles.tabPillActive]}
            >
              <Text style={[styles.ceremonyChipText, active && styles.tabTextActive]}>
                {rowLabel}
              </Text>
            </TvFocusable>
          );
        })}
      </ScrollView>

      {/* Award Ceremony Swimlanes */}
      {activeRows.map((row, idx) => {
        const rowId = row.category?.id || row.id || `rail-${idx}`;
        const rowTitle = row.category?.label || row.category?.fullName || row.title || 'Honors';
        const rowEyebrow = row.category?.awardName || row.eyebrow || 'PRESTIGE HONORS';
        return (
          <TvContentRail
            key={rowId}
            eyebrow={rowEyebrow}
            title={rowTitle}
            subtitle={`${row.items?.length || 0} laureates`}
            data={row.items || []}
            savedKeys={savedKeys}
            onSelectItem={onSelectItem}
            onToggleWatchlist={onToggleWatchlist}
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
  ceremonyStrip: {
    gap: 8,
    marginBottom: 18,
    paddingHorizontal: 28,
  },
  ceremonyChip: {
    backgroundColor: '#14110C',
    borderColor: '#312D27',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  ceremonyChipText: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 11.5,
    fontWeight: '600',
  },
});
