import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
        <Text style={styles.paneTitle}>Search</Text>

        {/* Query Display Box */}
        <View style={styles.queryBox}>
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            onSubmitEditing={() => onSubmitSearch?.(query)}
            placeholder="Title, actor or director..."
            placeholderTextColor="#68635A"
            style={styles.queryInput}
          />
          {isBusy ? <ActivityIndicator size="small" color={GOLD_ACCENT} /> : null}
        </View>

        {/* Action Row: Space, Del, Clear */}
        <View style={styles.specialKeysRow}>
          <TvFocusable
            appearance="text"
            hasTVPreferredFocus={true}
            onPress={() => appendChar(' ')}
            scaleOnFocus={1.04}
            borderRadius={6}
            style={[styles.specialKey, { flex: 1.4 }]}
            accessibilityLabel="Space"
          >
            {({ focused }) => (
              <Text style={[styles.specialKeyText, focused && styles.keyTextFocused]}>Space</Text>
            )}
          </TvFocusable>

          <TvFocusable
            appearance="text"
            onPress={handleBackspace}
            scaleOnFocus={1.04}
            borderRadius={6}
            style={[styles.specialKey, { flex: 1 }]}
            accessibilityLabel="Backspace"
          >
            {({ focused }) => (
              <Text style={[styles.specialKeyText, focused && styles.keyTextFocused]}>Delete</Text>
            )}
          </TvFocusable>

          <TvFocusable
            appearance="text"
            onPress={handleClear}
            scaleOnFocus={1.04}
            borderRadius={6}
            style={[styles.specialKey, { flex: 1 }]}
            accessibilityLabel="Clear search"
          >
            {({ focused }) => (
              <Text
                style={[
                  styles.specialKeyText,
                  { color: GOLD_ACCENT },
                  focused && styles.keyTextFocused,
                ]}
              >
                Clear
              </Text>
            )}
          </TvFocusable>
        </View>

        {/* Alphanumeric Key Grid */}
        <View style={styles.keyGrid}>
          {KEYBOARD_KEYS.map((letter) => (
            <TvFocusable
              key={letter}
              appearance="text"
              onPress={() => appendChar(letter)}
              scaleOnFocus={1.05}
              borderRadius={6}
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
        <View style={styles.quickChipsWrap}>
          {QUICK_SEARCHES.map((term) => (
            <TvFocusable
              key={term}
              appearance="text"
              onPress={() => onQueryChange?.(term)}
              scaleOnFocus={1.04}
              borderRadius={6}
              style={styles.quickChip}
            >
              {({ focused }) => (
                <Text style={[styles.quickChipText, focused && styles.keyTextFocused]}>{term}</Text>
              )}
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
                      appearance="text"
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
                title="Jump Back In"
                data={recentViewed}
                savedKeys={savedKeys}
                onSeeAll={onClearRecent}
                onSelectItem={onSelectItem}
                onToggleWatchlist={onToggleWatchlist}
              />
            ) : null}

            {trending.length > 0 ? (
              <TvContentRail
                title="Trending Now"
                data={trending.slice(0, 12)}
                showRank={true}
                savedKeys={savedKeys}
                onSelectItem={onSelectItem}
                onToggleWatchlist={onToggleWatchlist}
              />
            ) : null}

            {nowPlaying.length > 0 ? (
              <TvContentRail
                title="Now Playing in Cinemas"
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
    backgroundColor: '#040301',
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 14,
    width: 320,
  },
  paneTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
    marginBottom: 10,
  },
  queryBox: {
    alignItems: 'center',
    borderBottomColor: 'rgba(245, 238, 225, 0.22)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 44,
    marginBottom: 12,
    paddingHorizontal: 4,
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
    height: 38,
    justifyContent: 'center',
  },
  specialKeyText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  keyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  keyCell: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 39,
  },
  keyText: {
    color: '#D8D2C7',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  keyTextFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  quickChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quickChipText: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  rightResultsPane: {
    flex: 1,
  },
  rightScrollContent: {
    paddingBottom: 64,
  },
  resultsSection: {
    paddingHorizontal: TV_SPACE.overscanX,
    paddingTop: 14,
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
    color: '#D8D2C7',
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
    padding: 8,
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
    color: '#B5AFA4',
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
