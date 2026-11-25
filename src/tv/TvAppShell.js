import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { TvTopNav } from './TvTopNav';
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
import {
  isDeadOrArchiveStream,
  searchMovieTorrents,
} from '../lib/torrentSearchEngine';
import { launchStream } from '../lib/streamLauncher';
import { trovaToast as toastiva } from '../lib/trovaToast';
import { useToastContext } from '../context/ToastContext';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { TV_SPACE, TV_TYPE } from './tvTheme';

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
 * Orchestrates the Top Horizontal Text Navigation (`TvTopNav`), the active 16:9 content stage,
 * stacked Detail / Filmography overlays, non-intrusive TV toast notifications, and Sony TV remote Back navigation.
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
  const activeTabRef = useRef(activeTab);
  const overlayStackRef = useRef(overlayStack);
  const releaseDetailRef = useRef(detailCtl?.releaseDetail);
  activeTabRef.current = activeTab;
  overlayStackRef.current = overlayStack;
  releaseDetailRef.current = detailCtl?.releaseDetail;

  let currentToast = null;
  try {
    const toastCtx = useToastContext();
    currentToast = toastCtx?.currentToast || null;
  } catch {
    currentToast = null;
  }

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

  const handleToggleWatchlist =
    watchlistCtl?.handleQuickToggleWatchlist || watchlistCtl?.handleToggleWatchlist;

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
        const originalTitle = item.originalTitle || title;
        const year = item.year || item.Year;
        const imdbId = item.imdbId || item.imdbID;
        if (title) {
          toastiva.info(`Resolving best 1080p/4K swarm for ${title}...`);
          const found = await searchMovieTorrents({
            title,
            originalTitle,
            year,
            imdbId,
          }).catch(() => []);
          if (found && found.length > 0) {
            const best = found.find((s) => !isDeadOrArchiveStream(s)) || found[0];
            await launchStream({
              magnetUrl: best.magnetUrl,
              title: best.name,
              mediaTitle: title,
              originalTitle,
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
    const current = overlayStackRef.current;
    if (!current || current.length === 0) return;
    const popped = current[current.length - 1];
    setOverlayStack((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));
    if (popped?.type === 'detail' && popped.pushId) {
      releaseDetailRef.current?.(popped.pushId);
    }
  }, []);

  const handleSelectSidebarTab = useCallback((tabKey) => {
    setOverlayStack([]);
    setActiveTab(tabKey);
  }, []);

  // Hardware Back button handler on Android TV remote
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (overlayStackRef.current.length > 0) {
        handlePopOverlay();
        return true;
      }
      if (activeTabRef.current !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [handlePopOverlay]);

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
          onToggleWatchlist={handleToggleWatchlist}
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
          onToggleWatchlist={handleToggleWatchlist}
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
            onToggleWatchlist={handleToggleWatchlist}
            onClearRecent={detailCtl.clearRecentViewed}
          />
        );

      case 'discover':
        return (
          <TvDiscoverScreen
            discoverVm={discoverVm}
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={handleToggleWatchlist}
          />
        );

      case 'collections':
        return (
          <TvCollectionsScreen
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={handleToggleWatchlist}
          />
        );

      case 'awards':
        return (
          <TvAwardsScreen
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={handleToggleWatchlist}
          />
        );

      case 'watchlist':
        return (
          <TvWatchlistScreen
            watchlist={watchlistCtl.watchlist}
            collections={watchlistCtl.watchlistCollections}
            savedKeys={savedKeysSet}
            onSelectItem={handleOpenItem}
            onToggleWatchlist={handleToggleWatchlist}
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
            onToggleWatchlist={handleToggleWatchlist}
            onNavigateTab={handleSelectSidebarTab}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      {!topOverlay ? (
        <TvTopNav
          activeTab={activeTab}
          onSelectTab={handleSelectSidebarTab}
          watchlistCount={watchlistCtl.watchlist?.length || 0}
          activeDownloadCount={activeDownloadCount}
        />
      ) : null}

      <View style={styles.stageWrap}>
        {offlineBanner ? (
          <View style={styles.offlineStrip}>
            <Text style={styles.offlineText}>{offlineBanner}</Text>
          </View>
        ) : null}
        {renderStage()}

        {currentToast?.visible && currentToast?.message ? (
          <View pointerEvents="none" style={styles.toastBanner}>
            <Text numberOfLines={2} style={styles.toastText}>
              {currentToast.message}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#040301',
    flex: 1,
    flexDirection: 'column',
  },
  stageWrap: {
    backgroundColor: '#040301',
    flex: 1,
  },
  offlineStrip: {
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 7,
  },
  offlineText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  toastBanner: {
    backgroundColor: 'rgba(12, 10, 7, 0.94)',
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    position: 'absolute',
    right: TV_SPACE.overscanX,
    top: 16,
    zIndex: 99,
  },
  toastText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
});
