import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TvFocusable } from './TvFocusable';
import { TvPosterCard } from './TvPosterCard';
import { TvContentRail } from './TvContentRail';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { partitionSearchResults } from '../lib/searchRanker';
import { fetchHomeNowPlayingRail, fetchHomeTraktTrendingRail } from '../lib/homeFeed';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { TV_SPACE, TV_TYPE } from './tvTheme';

const KEYBOARD_KEYS = [
  'A', 'B', 'C', 'D', 'E', 'F',
  'G', 'H', 'I', 'J', 'K', 'L',
  'M', 'N', 'O', 'P', 'Q', 'R',
  'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', '1', '2', '3', '4',
  '5', '6', '7', '8', '9', '0',
];

const QUICK_SEARCHES = [
  'Dune',
  'Severance',
  'Oppenheimer',
  'Succession',
  'The Bear',
  'Andor',
  'Parasite',
  'Blade Runner',
];

/**
 * S05: 10-Foot Split-Screen Search Studio.
 * Clean, seamless keyboard and results pane without harsh borders or icon clutter.
 */
export function TvSearchScreen({
  query = '',
  typeResults = [],
  results = [],
  typeLoading = false,
  loading = false,
  recentViewed = [],
  savedKeys,
  onQueryChange,
  onSubmitSearch,
  onSelectItem,
  onSelectPerson,
  onToggleWatchlist,
  onClearRecent,
}) {
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);

  useEffect(() => {
    let active = true;
    fetchHomeTraktTrendingRail()
      .then((res) => {
        if (!active) return;
        setTrending(Array.isArray(res) ? res : res?.items || []);
      })
      .catch(() => {});
    fetchHomeNowPlayingRail()
      .then((res) => {
        if (!active) return;
        setNowPlaying(Array.isArray(res) ? res : res?.items || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const appendChar = (ch) => {
    const next = `${query || ''}${ch.toLowerCase()}`;
    onQueryChange?.(next);
  };

  const handleBackspace = () => {
    if (!query) return;
    onQueryChange?.(query.slice(0, -1));
  };

  const handleClear = () => {
    onQueryChange?.('');
  };

  const activeList =
    typeResults && typeResults.length > 0
      ? typeResults
      : results && results.length > 0
        ? results
        : [];

  const { people, titles } = partitionSearchResults(activeList);
  const hasQuery = Boolean((query || '').trim().length >= 2);
  const isBusy = typeLoading || loading;

  return (
    <View style={styles.splitRoot}>
      {/* Left Pane: D-Pad On-Screen Keyboard */}
      <View style={styles.leftKeyboardPane}>
        <Text style={styles.eyebrow}>SEARCH</Text>
        <Text style={styles.paneTitle}>Title, Actor or Director</Text>

        {/* Query Display Box */}
        <View style={styles.queryBox}>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            onSubmitEditing={() => onSubmitSearch?.(query)}
            placeholder="Type or speak..."
            placeholderTextColor="#68635A"
            style={styles.queryInput}
          />
          {isBusy ? <ActivityIndicator size="small" color={GOLD_ACCENT} /> : null}
        </View>

        {/* Action Row: Space, Del, Clear */}
        <View style={styles.specialKeysRow}>
          <TvFocusable
            hasTVPreferredFocus={true}
            onPress={() => appendChar(' ')}
            scaleOnFocus={1.04}
            borderRadius={8}
            style={[styles.specialKey, { flex: 1.4 }]}
            accessibilityLabel="Space"
          >
            <Text style={styles.specialKeyText}>SPACE</Text>
          </TvFocusable>

          <TvFocusable
            onPress={handleBackspace}
            scaleOnFocus={1.04}
            borderRadius={8}
            style={[styles.specialKey, { flex: 1 }]}
            accessibilityLabel="Backspace"
          >
            <Text style={styles.specialKeyText}>DEL</Text>
          </TvFocusable>

          <TvFocusable
            onPress={handleClear}
            scaleOnFocus={1.04}
            borderRadius={8}
            style={[styles.specialKey, { flex: 1 }]}
            accessibilityLabel="Clear search"
          >
            <Text style={[styles.specialKeyText, { color: GOLD_ACCENT }]}>CLEAR</Text>
          </TvFocusable>
        </View>

        {/* Alphanumeric Key Grid */}
        <View style={styles.keyGrid}>
          {KEYBOARD_KEYS.map((letter) => (
            <TvFocusable
              key={letter}
              onPress={() => appendChar(letter)}
              scaleOnFocus={1.08}
              borderRadius={7}
              focusBackgroundColor={GOLD_ACCENT}
              style={styles.keyCell}
              accessibilityLabel={`Key ${letter}`}
            >
              {({ focused }) => (
                <Text style={[styles.keyText, focused && styles.keyTextFocused]}>{letter}</Text>
              )}
            </TvFocusable>
          ))}
        </View>

        {/* Quick Search Suggestions */}
        <Text style={styles.quickHeader}>SUGGESTIONS</Text>
        <View style={styles.quickChipsWrap}>
          {QUICK_SEARCHES.map((term) => (
            <TvFocusable
              key={term}
              onPress={() => onQueryChange?.(term)}
              scaleOnFocus={1.04}
              borderRadius={999}
              style={styles.quickChip}
            >
              <Text style={styles.quickChipText}>{term}</Text>
            </TvFocusable>
          ))}
        </View>
      </View>

      {/* Right Pane: Live Poster Grid & Discovery Rails */}
      <ScrollView
        style={styles.rightResultsPane}
        contentContainerStyle={styles.rightScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hasQuery ? (
          <View style={styles.resultsSection}>
            <Text style={styles.eyebrow}>MATCHES</Text>
            <Text style={styles.resultsHeading}>
              Results for “{query.trim()}” ({titles.length + people.length})
            </Text>

            {/* People Matches */}
            {people.length > 0 ? (
              <View style={styles.peopleSection}>
                <Text style={styles.subHeader}>Cast & Filmmakers</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.peopleRow}
                >
                  {people.map((person, idx) => (
                    <TvFocusable
                      key={`p-${person.personId || person.tmdbId || idx}`}
                      onPress={() => onSelectPerson?.(person)}
                      scaleOnFocus={1.04}
                      borderRadius={10}
                      style={styles.personCard}
                    >
                      <View style={styles.personCardInner}>
                        <MediaArtwork
                          uri={person.profileUrl || person.Poster}
                          title={person.title || person.name}
                          variant="person"
                          style={styles.personAvatar}
                        />
                        <View style={{ flex: 1 }}>
                          <Text numberOfLines={1} style={styles.personName}>
                            {person.title || person.name}
                          </Text>
                          <Text numberOfLines={1} style={styles.personDept}>
                            {person.knownForDepartment || 'Filmmaker'}
                          </Text>
                        </View>
                      </View>
                    </TvFocusable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Title Poster Grid */}
            {titles.length > 0 ? (
              <View style={styles.posterGrid}>
                {titles.map((item, idx) => {
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
            ) : !isBusy && people.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>No matches found for “{query.trim()}”</Text>
                <Text style={styles.emptySub}>
                  Try a shorter title or select a suggestion on the left.
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <View style={{ paddingTop: 14 }}>
            {recentViewed && recentViewed.length > 0 ? (
              <TvContentRail
                eyebrow="RECENTLY VIEWED"
                title="Jump Back In"
                subtitle={`${recentViewed.length} titles`}
                data={recentViewed}
                savedKeys={savedKeys}
                onSeeAll={onClearRecent}
                onSelectItem={onSelectItem}
                onToggleWatchlist={onToggleWatchlist}
              />
            ) : null}

            {trending.length > 0 ? (
              <TvContentRail
                eyebrow="COMMUNITY PULSE"
                title="Trending on Trakt"
                data={trending.slice(0, 12)}
                showRank={true}
                savedKeys={savedKeys}
                onSelectItem={onSelectItem}
                onToggleWatchlist={onToggleWatchlist}
              />
            ) : null}

            {nowPlaying.length > 0 ? (
              <TvContentRail
                eyebrow="IN THEATERS"
                title="Now Playing in Theaters"
                data={nowPlaying.slice(0, 15)}
                savedKeys={savedKeys}
                onSelectItem={onSelectItem}
                onToggleWatchlist={onToggleWatchlist}
              />
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  splitRoot: {
    backgroundColor: '#040301',
    flex: 1,
    flexDirection: 'row',
  },
  leftKeyboardPane: {
    backgroundColor: '#070503',
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: 304,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  paneTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  queryBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.10)',
    borderRadius: 10,
    flexDirection: 'row',
    height: 44,
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  queryInput: {
    color: '#F5EEE1',
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.body,
    paddingVertical: 0,
  },
  specialKeysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  specialKey: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    height: 38,
    justifyContent: 'center',
  },
  specialKeyText: {
    color: '#F5EEE1',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
  },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  keyCell: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    height: 36,
    justifyContent: 'center',
    width: 39,
  },
  keyText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  keyTextFocused: {
    color: '#140F06',
    fontWeight: '800',
  },
  quickHeader: {
    color: '#B5AFA4',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickChipText: {
    color: '#E6CD9C',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
  },
  rightResultsPane: {
    flex: 1,
  },
  rightScrollContent: {
    paddingBottom: 64,
  },
  resultsSection: {
    paddingHorizontal: TV_SPACE.overscanX,
    paddingTop: 18,
  },
  resultsHeading: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
    marginBottom: 16,
  },
  peopleSection: {
    marginBottom: 20,
  },
  subHeader: {
    color: '#E6CD9C',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
    marginBottom: 10,
  },
  peopleRow: {
    gap: 14,
    paddingVertical: 6,
  },
  personCard: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    padding: 10,
    width: 210,
  },
  personCardInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  personAvatar: {
    borderRadius: 999,
    height: 48,
    width: 48,
  },
  personName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.cardTitle,
    fontWeight: '700',
  },
  personDept: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    marginTop: 2,
  },
  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TV_SPACE.cardGap,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.03)',
    borderRadius: 14,
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
});
