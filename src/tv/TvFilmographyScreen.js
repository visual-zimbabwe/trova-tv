import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
          appearance="text"
          hasTVPreferredFocus={true}
          onPress={onBack}
          scaleOnFocus={1.04}
          borderRadius={6}
          style={styles.backBtn}
        >
          {({ focused }) => (
            <Text style={[styles.backBtnText, focused && styles.textFocused]}>Back</Text>
          )}
        </TvFocusable>
      </View>

      {/* Person Hero */}
      <View style={styles.heroCard}>
        <MediaArtwork uri={portrait} title={name} variant="person" style={styles.avatar} />
        <View style={styles.heroInfo}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.creditsCount}>
            {department}  ·  {results.length} works
          </Text>
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
              title={rail.title}
              data={rail.items || []}
              savedKeys={savedKeys}
              onSelectItem={onSelectItem}
              onToggleWatchlist={onToggleWatchlist}
            />
          ))}

          {results.length > 0 ? (
            <View style={styles.allSection}>
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
    paddingTop: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  textFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 22,
    marginBottom: 24,
    marginHorizontal: TV_SPACE.overscanX,
  },
  avatar: {
    borderRadius: 12,
    height: 144,
    width: 110,
  },
  heroInfo: {
    flex: 1,
  },
  nameText: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  creditsCount: {
    color: '#D8D2C7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    marginTop: 4,
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
