import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { TvSidebar } from './TvSidebar';
import { TvHomeScreen } from './TvHomeScreen';
import { TvDetailScreen } from './TvDetailScreen';
import { TvSearchScreen } from './TvSearchScreen';
import { TvDiscoverScreen } from './TvDiscoverScreen';
import { TvCollectionsScreen } from './TvCollectionsScreen';
import { TvAwardsScreen } from './TvAwardsScreen';
import { TvFilmographyScreen } from './TvFilmographyScreen';
import { TvWatchlistScreen } from './TvWatchlistScreen';
import { TvDownloadsScreen } from './TvDownloadsScreen';
import { TvSettingsScreen } from './TvSettingsScreen';
import { useDownloads } from '../lib/downloadManager';
import { searchMovieTorrents } from '../lib/torrentSearchEngine';
import { launchStream } from '../lib/streamLauncher';
import { trovaToast as toastiva } from '../lib/trovaToast';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';

/**
 * Pure state reducer helper exported for unit testing (`tests/tvNavigation.test.js`).
 */
export function resolveTvTabFilter(tabKey) {
  if (tabKey === 'movies') return 'movie';
  if (tabKey === 'tv') return 'tv';
  return null;
}

/**
 * S01: 10-Foot App Shell.
 * Orchestrates the Left Navigation Rail (`TvSidebar`), the active 16:9 content stage,
 * stacked Detail / Filmography overlays, and Sony TV remote Back button navigation.
 */
export function TvAppShell({
  watchlistCtl,
  detailCtl,
  peopleCtl,
  searchCtl,
  discoverVm,
  homeSpotlightItems,
  offlineBanner,
}) {
  const [activeTab, setActiveTab] = useState('home');
  const [overlayStack, setOverlayStack] = useState([]); // [{ type: 'detail', pushId } | { type: 'person', person }]

  const { downloads = [] } = useDownloads();
  const activeDownloadCount = useMemo(
    () =>
      downloads.filter((d) => d.state === 'downloading' || d.state === 'resolving').length,
    [downloads],
  );

  const savedKeysSet = useMemo(() => {
    const raw = watchlistCtl?.savedWatchlistKeys;
    if (!raw) return new Set();
    if (raw instanceof Set) return raw;
    if (Array.isArray(raw)) return new Set(raw);
    return new Set();
  }, [watchlistCtl?.savedWatchlistKeys]);

  const topOverlay = overlayStack.length > 0 ? overlayStack[overlayStack.length - 1] : null;

  const handleOpenItem = useCallback(
    async (item) => {
      if (!item) return;
      const title = item.title || item.Title || item.name || '';
      const navProxy = {
        push: (_route, params) => {
          const detailId = params?.detailId;
          if (detailId) {
            setOverlayStack((prev) => [...prev, { type: 'detail', pushId: detailId, seedItem: item }]);
          }
        },
      };
      await detailCtl.openResolvedDetail(title, item, navProxy);
    },
    [detailCtl],
  );

  const handlePlayNowFromHero = useCallback(
    async (item) => {
      if (!item) return;
      // Open the detail screen and, if it's a movie, opportunistically resolve and launch the top stream
      handleOpenItem(item);
      if (item.mediaType !== 'tv') {
        const title = item.title || item.Title;
        const year = item.year || item.Year;
        const imdbId = item.imdbId || item.imdbID;
        if (title) {
          toastiva.info(`Resolving best 1080p/4K swarm for ${title}...`);
          const found = await searchMovieTorrents({ title, year, imdbId }).catch(() => []);
          if (found && found.length > 0) {
            const best = found[0];
            await launchStream({
              magnetUrl: best.magnetUrl,
              title: best.name,
              mediaTitle: title,
              year,
              tmdbId: item.tmdbId,
              fileIdx: best.fileIdx,
              imdbId,
            });
          }
        }
      }
    },
    [handleOpenItem],
  );

  const handleOpenPerson = useCallback(
    async (person) => {
      if (!person) return;
      const personId = person.personId || person.id || person.tmdbId;
      const personName = person.name || person.title || '';
      const role = person.role || person.knownForDepartment || 'actor';
      const navProxy = {
        push: () => {
          setOverlayStack((prev) => [...prev, { type: 'person', person }]);
        },
      };
      await peopleCtl.handlePersonPress(personId, personName, role, navProxy);
    },
    [peopleCtl],
  );

  const handlePopOverlay = useCallback(() => {
    setOverlayStack((prev) => {
      if (prev.length === 0) return prev;
      const popped = prev[prev.length - 1];
      if (popped?.type === 'detail' && popped.pushId) {
        detailCtl.releaseDetail?.(popped.pushId);
      }
      return prev.slice(0, -1);
    });
  }, [detailCtl]);

  const handleSelectSidebarTab = useCallback((tabKey) => {
    setOverlayStack([]);
    setActiveTab(tabKey);
  }, []);

  // Hardware Back button handler on Android TV remote
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlayStack.length > 0) {
        handlePopOverlay();
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [overlayStack.length, activeTab, handlePopOverlay]);

  const renderStage = () => {
    if (topOverlay?.type === 'detail') {
      const entry = detailCtl.details?.[topOverlay.pushId] || {
        status: 'loading',
        result: null,
      };
      return (
        <TvDetailScreen
          detailEntry={entry}
          savedKeys={savedKeysSet}
          onBack={handlePopOverlay}
          onSelectItem={handleOpenItem}
          onSelectPerson={handleOpenPerson}
          onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
          onRetry={() => detailCtl.retryDetail?.(topOverlay.pushId)}
        />
      );
    }

    if (topOverlay?.type === 'person') {
      return (
        <TvFilmographyScreen
          person={peopleCtl.filmographyPerson || topOverlay.person}
          results={peopleCtl.filmographyResults}
          rails={peopleCtl.filmographyRails}
          loading={peopleCtl.filmographyLoading}
          savedKeys={savedKeysSet}
          onBack={handlePopOverlay}
          onSelectItem={handleOpenItem}
          onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
        />
      );
    }

    switch (activeTab) {
      case 'search':
        return (
          <TvSearchScreen
            query={searchCtl.query}
            typeResults={searchCtl.typeResults}
            results={searchCtl.results}
            typeLoading={searchCtl.typeLoading}
            loading={searchCtl.loading}
            recentViewed={detailCtl.recentViewed}
            savedKeys={savedKeysSet}
            onQueryChange={searchCtl.handleQueryChange}
            onSubmitSearch={searchCtl.handleSearch}
            onSelectItem={handleOpenItem}
            onSelectPerson={handleOpenPerson}
            onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
            onClearRecent={detailCtl.clearRecentViewed}
          />
        );

      case 'discover':
        return (
          <TvDiscoverScreen
            discoverVm={discoverVm}
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
          />
        );

      case 'collections':
        return (
          <TvCollectionsScreen
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
          />
        );

      case 'awards':
        return (
          <TvAwardsScreen
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
          />
        );

      case 'watchlist':
        return (
          <TvWatchlistScreen
            watchlist={watchlistCtl.watchlist}
            collections={watchlistCtl.watchlistCollections}
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
          />
        );

      case 'downloads':
        return <TvDownloadsScreen onNavigateTab={handleSelectSidebarTab} />;

      case 'settings':
        return (
          <TvSettingsScreen
            watchlistCount={watchlistCtl.watchlist?.length || 0}
            collectionsCount={watchlistCtl.watchlistCollections?.length || 0}
            onClearRecent={detailCtl.clearRecentViewed}
          />
        );

      case 'movies':
      case 'tv':
      case 'home':
      default:
        return (
          <TvHomeScreen
            watchlist={watchlistCtl.watchlist}
            collections={watchlistCtl.watchlistCollections}
            spotlight={homeSpotlightItems}
            savedKeys={savedKeysSet}
            mediaFilter={resolveTvTabFilter(activeTab)}
            onMediaFilterChange={(nextFilter) => {
              if (nextFilter === 'movie') setActiveTab('movies');
              else if (nextFilter === 'tv') setActiveTab('tv');
              else setActiveTab('home');
            }}
            onSelectItem={handleOpenItem}
            onPlayNow={handlePlayNowFromHero}
            onToggleWatchlist={watchlistCtl.handleToggleWatchlist}
            onNavigateTab={handleSelectSidebarTab}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      <TvSidebar
        activeTab={activeTab}
        onSelectTab={handleSelectSidebarTab}
        watchlistCount={watchlistCtl.watchlist?.length || 0}
        activeDownloadCount={activeDownloadCount}
      />

      <View style={styles.stageWrap}>
        {offlineBanner ? (
          <View style={styles.offlineStrip}>
            <Text style={styles.offlineText}>{offlineBanner}</Text>
          </View>
        ) : null}
        {renderStage()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#040301',
    flex: 1,
    flexDirection: 'row',
  },
  stageWrap: {
    backgroundColor: '#040301',
    flex: 1,
  },
  offlineStrip: {
    backgroundColor: 'rgba(212, 168, 83, 0.18)',
    borderBottomColor: GOLD_ACCENT,
    borderBottomWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 5,
  },
  offlineText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 11.5,
    fontWeight: '700',
  },
});
