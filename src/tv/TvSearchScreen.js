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
    paddingVertical: 16,
    width: 288,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  paneTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  queryBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    borderRadius: 10,
    flexDirection: 'row',
    height: 40,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  queryInput: {
    color: '#F5EEE1',
    flex: 1,
    fontFamily: fonts.heading,
    fontSize: 14,
    paddingVertical: 0,
  },
  specialKeysRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  specialKey: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    height: 32,
    justifyContent: 'center',
  },
  specialKeyText: {
    color: '#F5EEE1',
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '700',
  },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 14,
  },
  keyCell: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.04)',
    height: 33,
    justifyContent: 'center',
    width: 37,
  },
  keyText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '700',
  },
  keyTextFocused: {
    color: '#1A1204',
    fontWeight: '800',
  },
  quickHeader: {
    color: '#8E887E',
    fontFamily: fonts.label,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  quickChip: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickChipText: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 10.5,
    fontWeight: '600',
  },
  rightResultsPane: {
    flex: 1,
  },
  rightScrollContent: {
    paddingBottom: 48,
  },
  resultsSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  resultsHeading: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  peopleSection: {
    marginBottom: 18,
  },
  subHeader: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  peopleRow: {
    gap: 10,
  },
  personCard: {
    backgroundColor: 'rgba(245, 238, 225, 0.04)',
    padding: 8,
    width: 190,
  },
  personCardInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  personAvatar: {
    borderRadius: 999,
    height: 44,
    width: 44,
  },
  personName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '700',
  },
  personDept: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10.5,
    marginTop: 2,
  },
  posterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.03)',
    borderRadius: 14,
    marginTop: 24,
    padding: 32,
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
    fontSize: 12.5,
    marginTop: 4,
    textAlign: 'center',
  },
});
