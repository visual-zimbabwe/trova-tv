import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TvFocusable } from './TvFocusable';
import { TvContentRail } from './TvContentRail';
import { TvPosterCard } from './TvPosterCard';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * S09: 10-Foot Actor / Director Filmography Studio.
 */
export function TvFilmographyScreen({
  person,
  results = [],
  rails = [],
  loading = false,
  savedKeys,
  onBack,
  onSelectItem,
  onToggleWatchlist,
}) {
  const name = person?.name || person?.title || 'Filmmaker';
  const portrait = person?.profileUrl || person?.Poster || person?.profile_path;
  const department = person?.knownForDepartment || person?.job || 'Cinema & Television';
  const biography = person?.biography || '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TvFocusable
          hasTVPreferredFocus={true}
          onPress={onBack}
          scaleOnFocus={1.05}
          borderRadius={999}
          style={styles.backBtn}
        >
          <View style={styles.btnInner}>
            <Ionicons name="arrow-back" size={15} color={GOLD_ACCENT} />
            <Text style={styles.backBtnText}>Back</Text>
          </View>
        </TvFocusable>
        <Text style={styles.eyebrow}>FILMOGRAPHY DOSSIER</Text>
      </View>

      {/* Person Hero Card */}
      <View style={styles.heroCard}>
        <MediaArtwork uri={portrait} title={name} variant="person" style={styles.avatar} />
        <View style={styles.heroInfo}>
          <Text style={styles.deptTag}>{department.toUpperCase()}</Text>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.creditsCount}>{results.length} credited works</Text>
          {biography ? (
            <Text numberOfLines={3} style={styles.bioText}>
              {biography}
            </Text>
          ) : null}
        </View>
      </View>

      {loading && results.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={GOLD_ACCENT} />
          <Text style={styles.loadingText}>Resolving complete filmography...</Text>
        </View>
      ) : (
        <>
          {rails.map((rail, idx) => (
            <TvContentRail
              key={rail.id || rail.title || idx}
              eyebrow={rail.eyebrow || 'CAREER CREDITS'}
              title={rail.title}
              subtitle={`${rail.items?.length || 0} titles`}
              data={rail.items || []}
              savedKeys={savedKeys}
              onSelectItem={onSelectItem}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}

          {results.length > 0 ? (
            <View style={styles.allSection}>
              <Text style={styles.eyebrow}>COMPLETE CATALOGUE</Text>
              <Text style={styles.sectionTitle}>All Credits ({results.length})</Text>
              <View style={styles.gridWrap}>
                {results.slice(0, 60).map((item, idx) => {
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
                      variant="grid"
                      saved={saved}
                      onPress={onSelectItem}
                      onLongPress={onToggleWatchlist}
                    />
                  );
                })}
              </View>
            </View>
          ) : null}
        </>
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
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#191610',
    borderColor: 'rgba(212, 168, 83, 0.4)',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  btnInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  backBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 22,
    marginBottom: 24,
    marginHorizontal: TV_SPACE.overscanX,
    padding: 18,
  },
  avatar: {
    borderRadius: 12,
    height: 144,
    width: 110,
  },
  heroInfo: {
    flex: 1,
  },
  deptTag: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  nameText: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  creditsCount: {
    color: '#E6CD9C',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    marginTop: 3,
  },
  bioText: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    lineHeight: 20,
    marginTop: 8,
  },
  loadingWrap: {
    alignItems: 'center',
    padding: 48,
  },
  loadingText: {
    color: '#C7C1B7',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.body,
    marginTop: 12,
  },
  allSection: {
    paddingHorizontal: TV_SPACE.overscanX,
  },
  sectionTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
    marginBottom: 14,
    marginTop: 4,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV_SPACE.cardGap,
  },
});
