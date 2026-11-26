import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as ExpoImage } from 'expo-image';
import { TvFocusable } from './TvFocusable';
import { TvContentRail } from './TvContentRail';
import { MediaArtwork } from '../components/MediaArtwork';
import { TrailerModal } from '../components/TrailerModal';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { TV_SPACE, TV_TYPE } from './tvTheme';
import {
  fetchSeasonEpisodes,
  fetchTitleCollection,
  fetchTitleRails,
} from '../lib/tmdb';
import {
  isDeadOrArchiveStream,
  searchEpisodeTorrents,
  searchMovieTorrents,
  searchSeasonPackTorrents,
} from '../lib/torrentSearchEngine';
import { launchStream } from '../lib/streamLauncher';
import { useDownloads } from '../lib/downloadManager';
import { watchlistEntryKey } from '../lib/watchlistModel';
import { trovaToast as toastiva } from '../lib/trovaToast';
import { pickBestTrailer } from '../lib/trailerPicker';
import { formatNextEpisodeLabel } from '../lib/tvmaze';
import { serviceLabelsForRow } from '../lib/providerAvailability';

function formatRuntime(minutes, mediaType) {
  if (!minutes || minutes <= 0) return null;
  if (mediaType === 'tv') return `${minutes}m / ep`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hrs) return `${mins}m`;
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/**
 * S03 & S04: 10-Foot Title Detail, Multi-Critic Scorecard, Season/Episode Browser,
 * Where-to-Watch Country Atlas, and Peer Swarm Stream Hub.
 * Polished to blend seamlessly onto the dark canvas without icon overload or hard borders.
 */
export function TvDetailScreen({
  detailEntry,
  savedKeys,
  onBack,
  onSelectItem,
  onSelectPerson,
  onToggleWatchlist,
  onRetry,
}) {
  const result = detailEntry?.result;
  const loading = Boolean(detailEntry?.loading || detailEntry?.status === 'loading');
  const error = Boolean(detailEntry?.error || detailEntry?.status === 'error');

  const [streams, setStreams] = useState([]);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [showAllStreams, setShowAllStreams] = useState(false);
  const [showDeadStreams, setShowDeadStreams] = useState(false);
  const [launchingKey, setLaunchingKey] = useState(null);
  const [trailerOpen, setTrailerOpen] = useState(false);

  // TV Series Seasons & Episodes state
  const seasons = useMemo(() => {
    const raw = result?.seasons || [];
    return raw.filter((s) => s.seasonNumber > 0 || raw.length === 1);
  }, [result?.seasons]);

  const [selectedSeasonNum, setSelectedSeasonNum] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [seasonPacks, setSeasonPacks] = useState([]);
  const [showSeasonPacksDrawer, setShowSeasonPacksDrawer] = useState(false);
  const [showDeadSeasonPacks, setShowDeadSeasonPacks] = useState(false);
  const [episodeSwarms, setEpisodeSwarms] = useState({});
  const [showDeadEpisodeSwarms, setShowDeadEpisodeSwarms] = useState({});
  const [loadingEpisodeNum, setLoadingEpisodeNum] = useState(null);
  const [expandedEpisodeNum, setExpandedEpisodeNum] = useState(null);

  // Franchise & Recommendations rails
  const [franchiseItems, setFranchiseItems] = useState([]);
  const [franchiseName, setFranchiseName] = useState(null);
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [similarItems, setSimilarItems] = useState([]);

  const {
    startDownload,
    pauseDownload,
    resumeDownload,
    deleteDownload,
    playDownloaded,
    getForMedia,
    formatBytes,
    formatSpeed,
  } = useDownloads();

  const mediaType = result?.mediaType || (result?.Type === 'series' ? 'tv' : 'movie');
  const tmdbId = result?.tmdbId;
  const imdbId = result?.imdbID || result?.imdbId;
  const title = result?.Title || result?.title || 'Untitled';
  const originalTitle = result?.originalTitle || title;
  const year = result?.Year || result?.year || '';
  const backdropUri =
    result?.heroBackdropUrl || result?.backdropUrl || result?.Poster || result?.posterUrl;
  const posterUri = result?.Poster || result?.posterUrl || result?.backdropUrl;

  const existingDownload = getForMedia({ imdbId, tmdbId });

  useEffect(() => {
    if (seasons.length > 0) {
      setSelectedSeasonNum(seasons[0].seasonNumber);
    }
  }, [seasons]);

  // Fetch Movie peer swarms when viewing a movie
  useEffect(() => {
    let cancelled = false;
    if (mediaType === 'movie' && title && title !== 'Untitled') {
      setStreamsLoading(true);
      setShowDeadStreams(false);
      searchMovieTorrents({ title, originalTitle, year, imdbId })
        .then((res) => {
          if (!cancelled) {
            const list = res || [];
            setStreams(list);
            setStreamsLoading(false);
            const best = list.find((s) => !isDeadOrArchiveStream(s)) || list[0];
            if (best?.magnetUrl && best.seeders > 0) {
              fetch(
                `http://127.0.0.1:8899/preload?magnet=${encodeURIComponent(best.magnetUrl)}`,
              ).catch(() => {});
            }
          }
        })
        .catch(() => {
          if (!cancelled) setStreamsLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [mediaType, title, originalTitle, year, imdbId]);

  // Fetch TV Season episodes + Season Pack torrents when viewing a series
  useEffect(() => {
    let cancelled = false;
    if (mediaType === 'tv' && tmdbId && selectedSeasonNum != null) {
      setEpisodesLoading(true);
      setShowSeasonPacksDrawer(false);
      setShowDeadSeasonPacks(false);
      setShowDeadEpisodeSwarms({});
      fetchSeasonEpisodes(tmdbId, selectedSeasonNum)
        .then((eps) => {
          if (!cancelled) {
            setEpisodes(eps || []);
            setEpisodesLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) setEpisodesLoading(false);
        });

      searchSeasonPackTorrents({
        seriesTitle: title,
        originalTitle,
        seasonNumber: selectedSeasonNum,
        imdbId,
      })
        .then((packs) => {
          if (!cancelled) setSeasonPacks(packs || []);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [mediaType, tmdbId, selectedSeasonNum, title, originalTitle, imdbId]);

  // Fetch recommendations, similar titles, and franchise collection
  useEffect(() => {
    let cancelled = false;
    if (!tmdbId || !mediaType || !result) return undefined;

    fetchTitleRails(result)
      .then((rails) => {
        if (cancelled) return;
        setRecommendedItems(rails?.similar || rails?.recommendations || []);
        setSimilarItems(rails?.fromPeople || []);
      })
      .catch(() => {});

    if (mediaType === 'movie' && (result?.collectionSeed?.id || result?.belongsToCollection?.id)) {
      fetchTitleCollection(result)
        .then((col) => {
          if (cancelled || !col) return;
          const collectionObj = col.collection || col;
          setFranchiseName(
            collectionObj?.name ||
              result?.collectionSeed?.name ||
              result?.belongsToCollection?.name ||
              'Film Collection',
          );
          setFranchiseItems(collectionObj?.parts || []);
        })
        .catch(() => {});
    } else {
      setFranchiseItems([]);
      setFranchiseName(null);
    }

    return () => {
      cancelled = true;
    };
  }, [tmdbId, mediaType, result]);

  const handleLaunchMovieStream = useCallback(
    async (streamItem, key = 'best') => {
      if (!streamItem?.magnetUrl || launchingKey) return;
      setLaunchingKey(key);
      try {
        await launchStream({
          magnetUrl: streamItem.magnetUrl,
          title: streamItem.name,
          mediaTitle: title,
          originalTitle,
          year,
          tmdbId,
          fileIdx: streamItem.fileIdx,
          imdbId,
        });
      } finally {
        setLaunchingKey(null);
      }
    },
    [launchingKey, title, originalTitle, year, tmdbId, imdbId],
  );

  const handlePlayEpisode = useCallback(
    async (ep) => {
      const epNum = ep.episodeNumber;
      const existing = episodeSwarms[epNum];
      if (existing && existing.length > 0) {
        const best = existing.find((s) => !isDeadOrArchiveStream(s)) || existing[0];
        await launchStream({
          magnetUrl: best.magnetUrl,
          title: best.name,
          mediaTitle: `${title} S${String(selectedSeasonNum).padStart(2, '0')}E${String(epNum).padStart(2, '0')}`,
          originalTitle,
          year,
          tmdbId,
          fileIdx: best.fileIdx,
          imdbId,
          season: selectedSeasonNum,
          episode: epNum,
        });
        return;
      }

      setLoadingEpisodeNum(epNum);
      try {
        const found = await searchEpisodeTorrents({
          seriesTitle: title,
          originalTitle,
          seasonNumber: selectedSeasonNum,
          episodeNumber: epNum,
          imdbId,
        });
        setEpisodeSwarms((prev) => ({ ...prev, [epNum]: found || [] }));
        if (found && found.length > 0) {
          const best = found.find((s) => !isDeadOrArchiveStream(s)) || found[0];
          await launchStream({
            magnetUrl: best.magnetUrl,
            title: best.name,
            mediaTitle: `${title} S${String(selectedSeasonNum).padStart(2, '0')}E${String(epNum).padStart(2, '0')}`,
            originalTitle,
            year,
            tmdbId,
            fileIdx: best.fileIdx,
            imdbId,
            season: selectedSeasonNum,
            episode: epNum,
          });
        } else {
          toastiva.info('No peer swarms found for this episode yet.');
        }
      } finally {
        setLoadingEpisodeNum(null);
      }
    },
    [episodeSwarms, title, selectedSeasonNum, originalTitle, year, tmdbId, imdbId],
  );

  const handleBrowseEpisodeSources = useCallback(
    async (ep) => {
      const epNum = ep.episodeNumber;
      if (expandedEpisodeNum === epNum) {
        setExpandedEpisodeNum(null);
        return;
      }
      setExpandedEpisodeNum(epNum);
      if (!episodeSwarms[epNum]) {
        setLoadingEpisodeNum(epNum);
        try {
          const found = await searchEpisodeTorrents({
            seriesTitle: title,
            originalTitle,
            seasonNumber: selectedSeasonNum,
            episodeNumber: epNum,
            imdbId,
          });
          setEpisodeSwarms((prev) => ({ ...prev, [epNum]: found || [] }));
        } finally {
          setLoadingEpisodeNum(null);
        }
      }
    },
    [expandedEpisodeNum, episodeSwarms, title, originalTitle, selectedSeasonNum, imdbId],
  );

  if (loading && !result) {
    return (
      <View style={styles.centerStage}>
        <ActivityIndicator size="large" color={GOLD_ACCENT} />
        <Text style={styles.loadingText}>Loading 10-foot cinema dossier...</Text>
        <TvFocusable
          hasTVPreferredFocus={true}
          onPress={onBack}
          borderRadius={999}
          style={[styles.secondaryBtn, { marginTop: 14 }]}
          accessibilityLabel="Back"
        >
          <Text style={styles.secondaryBtnText}>Back</Text>
        </TvFocusable>
      </View>
    );
  }

  if (error && !result) {
    return (
      <View style={styles.centerStage}>
        <Text style={styles.loadingText}>Unable to load title details.</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          {onRetry ? (
            <TvFocusable
              hasTVPreferredFocus={true}
              onPress={onRetry}
              borderRadius={999}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Retry</Text>
            </TvFocusable>
          ) : null}
          <TvFocusable onPress={onBack} borderRadius={999} style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </TvFocusable>
        </View>
      </View>
    );
  }

  if (!result) return null;

  const healthyStreams = streams.filter((s) => !isDeadOrArchiveStream(s));
  const hiddenDeadStreamsCount = streams.length - healthyStreams.length;
  const visibleStreams =
    showDeadStreams || !healthyStreams.length ? streams : healthyStreams;
  const topStream = healthyStreams[0] || streams[0] || null;

  const healthySeasonPacks = seasonPacks.filter((p) => !isDeadOrArchiveStream(p));
  const hiddenDeadPacksCount = seasonPacks.length - healthySeasonPacks.length;
  const visibleSeasonPacks =
    showDeadSeasonPacks || !healthySeasonPacks.length ? seasonPacks : healthySeasonPacks;
  const topSeasonPack = healthySeasonPacks[0] || seasonPacks[0] || null;
  const trailerCandidates =
    Array.isArray(result.trailerCandidates) && result.trailerCandidates.length > 0
      ? result.trailerCandidates
      : (() => {
          const picked = pickBestTrailer(result.trailers || result.videos || []);
          return picked ? [picked] : [];
        })();
  const bestTrailerUrl =
    result.trailer && result.trailer !== 'N/A'
      ? result.trailer
      : trailerCandidates[0]?.url || null;
  const bestTrailer = bestTrailerUrl
    ? { url: bestTrailerUrl, type: result.trailerType || trailerCandidates[0]?.type || 'Trailer' }
    : null;
  const wlKey = watchlistEntryKey({ tmdbId, mediaType, title, year });
  const isSaved = Boolean(
    savedKeys &&
      wlKey &&
      (typeof savedKeys.has === 'function'
        ? savedKeys.has(wlKey)
        : Array.isArray(savedKeys) && savedKeys.includes(wlKey)),
  );

  const omdb = result.omdbRatings || {};
  const rawImdb = omdb.imdbRating || result.imdbRating;
  const imdbScore = rawImdb && rawImdb !== 'N/A' ? String(rawImdb).split('/')[0] : null;
  const rawRt = omdb.rottenTomatoes || result.rottenTomatoes;
  const rtScore = rawRt && rawRt !== 'N/A' ? rawRt : null;
  const rawMeta = omdb.metacritic || result.metacritic;
  const metaScore = rawMeta && rawMeta !== 'N/A' ? rawMeta : null;
  const rawTmdb = result.rating || result.tmdbRating;
  const tmdbScore =
    rawTmdb && rawTmdb !== 'N/A'
      ? String(rawTmdb).split('/')[0]
      : result.ratingValue > 0
        ? result.ratingValue.toFixed(1)
        : null;

  const runtimeLabel = formatRuntime(result.runtimeMinutes, mediaType);
  const nextEpLabel = formatNextEpisodeLabel(result.nextEpisode);
  const genresLabel = Array.isArray(result.genres)
    ? result.genres.join(' · ')
    : result.genres && result.genres !== 'N/A'
      ? result.genres
      : result.Genre && result.Genre !== 'N/A'
        ? result.Genre
        : '';

  const synopsisText =
    (result.synopsis && result.synopsis !== 'No synopsis available.' ? result.synopsis : null) ||
    (result.Plot && result.Plot !== 'N/A' ? result.Plot : null) ||
    result.overview ||
    null;

  const castList = [
    ...(result.directorPersons || []),
    ...(result.createdByPersons || []),
    ...(result.castPersons || result.starringPersons || result.cast || []),
  ].slice(0, 18);

  // Where to Watch countries & streaming services
  const watchRows = Array.isArray(result.rows) ? result.rows : [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top 16:9 Backdrop Stage */}
      <View style={styles.heroStage}>
        {backdropUri ? (
          <ExpoImage
            source={{ uri: backdropUri }}
            style={styles.backdropImg}
            contentFit="cover"
            transition={300}
          />
        ) : null}

        <LinearGradient
          colors={['#040301', 'rgba(4,3,1,0.92)', 'rgba(4,3,1,0.45)', 'transparent']}
          locations={[0, 0.42, 0.78, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(4,3,1,0.5)', 'transparent', 'rgba(4,3,1,0.94)', '#040301']}
          locations={[0, 0.25, 0.84, 1]}
          style={StyleSheet.absoluteFill}
        />

        {/* Back Action */}
        <View style={styles.topBar}>
          <TvFocusable
            appearance="text"
            onPress={onBack}
            scaleOnFocus={1.04}
            borderRadius={6}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            {({ focused }) => (
              <Text style={[styles.backBtnText, focused && styles.textBtnFocused]}>Back</Text>
            )}
          </TvFocusable>
        </View>

        {/* Main Detail Header Content */}
        <View style={styles.heroBody}>
          {/* Left Poster */}
          <View style={styles.posterColumn}>
            <MediaArtwork
              uri={posterUri}
              title={title}
              variant="poster"
              style={styles.posterThumb}
            />
          </View>

          {/* Right Editorial Metadata & Actions */}
          <View style={styles.infoColumn}>
            <Text numberOfLines={2} style={styles.titleText}>
              {title}
            </Text>

            {/* Inline Metadata & Scores Line — no colored chips */}
            <Text numberOfLines={2} style={styles.metaDot}>
              {[
                imdbScore ? `IMDb ${imdbScore}` : tmdbScore ? `TMDb ${tmdbScore}` : null,
                rtScore ? `RT ${rtScore}` : null,
                metaScore ? `Metacritic ${metaScore}` : null,
                year || null,
                runtimeLabel || null,
                result.Rated && result.Rated !== 'N/A' ? result.Rated : null,
                nextEpLabel || null,
              ]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>

            {genresLabel ? <Text style={styles.genresLine}>{genresLabel}</Text> : null}

            {/* Synopsis */}
            {synopsisText ? (
              <Text numberOfLines={3} style={styles.plotText}>
                {synopsisText}
              </Text>
            ) : null}

            {/* Awards Summary Text */}
            {result.Awards && result.Awards !== 'N/A' ? (
              <Text numberOfLines={1} style={styles.awardsBannerText}>
                {result.Awards}
              </Text>
            ) : null}

            {/* 10-Foot Borderless Text Action Row */}
            <View style={styles.actionRow}>
              {mediaType === 'movie' ? (
                <TvFocusable
                  appearance="text"
                  hasTVPreferredFocus={true}
                  onPress={() => {
                    if (existingDownload?.state === 'completed') {
                      playDownloaded(existingDownload);
                    } else if (topStream) {
                      handleLaunchMovieStream(topStream, 'best');
                    } else {
                      setShowAllStreams(true);
                    }
                  }}
                  scaleOnFocus={1.04}
                  borderRadius={8}
                  style={styles.primaryBtn}
                  accessibilityLabel="Play movie now"
                >
                  {({ focused }) => (
                    <Text style={[styles.primaryBtnText, focused && styles.textBtnFocused]}>
                      {existingDownload?.state === 'completed'
                        ? 'Play Offline'
                        : topStream
                          ? `Play ${topStream.attributes?.resolution || '1080p'}`
                          : streamsLoading
                            ? 'Searching...'
                            : 'Browse Streams'}
                    </Text>
                  )}
                </TvFocusable>
              ) : (
                <TvFocusable
                  appearance="text"
                  hasTVPreferredFocus={true}
                  onPress={() => {
                    if (episodes.length > 0) {
                      handlePlayEpisode(episodes[0]);
                    }
                  }}
                  scaleOnFocus={1.04}
                  borderRadius={8}
                  style={styles.primaryBtn}
                  accessibilityLabel={`Play Season ${selectedSeasonNum} Episode 1`}
                >
                  {({ focused }) => (
                    <Text style={[styles.primaryBtnText, focused && styles.textBtnFocused]}>
                      Play S{String(selectedSeasonNum).padStart(2, '0')}E01
                    </Text>
                  )}
                </TvFocusable>
              )}

              {mediaType === 'movie' && streams.length > 0 ? (
                <TvFocusable
                  appearance="text"
                  onPress={() => setShowAllStreams((prev) => !prev)}
                  scaleOnFocus={1.04}
                  borderRadius={8}
                  style={styles.secondaryBtn}
                >
                  {({ focused }) => (
                    <Text style={[styles.secondaryBtnText, focused && styles.textBtnFocused]}>
                      {showAllStreams ? 'Hide Releases' : `Releases (${streams.length})`}
                    </Text>
                  )}
                </TvFocusable>
              ) : null}

              {mediaType === 'movie' && topStream && !existingDownload ? (
                <TvFocusable
                  appearance="text"
                  onPress={() =>
                    startDownload({
                      magnet: topStream.magnetUrl,
                      infoHash: topStream.infoHash,
                      fileIdx: topStream.fileIdx,
                      title,
                      releaseName: topStream.name,
                      mediaType: 'movie',
                      tmdbId,
                      imdbId,
                      year,
                      posterUrl: posterUri,
                      quality: topStream.attributes?.resolution || '1080p',
                    })
                  }
                  scaleOnFocus={1.04}
                  borderRadius={8}
                  style={styles.secondaryBtn}
                >
                  {({ focused }) => (
                    <Text style={[styles.secondaryBtnText, focused && styles.textBtnFocused]}>
                      Download
                    </Text>
                  )}
                </TvFocusable>
              ) : null}

              {bestTrailer ? (
                <TvFocusable
                  appearance="text"
                  onPress={() => setTrailerOpen(true)}
                  scaleOnFocus={1.04}
                  borderRadius={8}
                  style={styles.secondaryBtn}
                >
                  {({ focused }) => (
                    <Text style={[styles.secondaryBtnText, focused && styles.textBtnFocused]}>
                      Trailer
                    </Text>
                  )}
                </TvFocusable>
              ) : null}

              <TvFocusable
                appearance="text"
                onPress={() =>
                  onToggleWatchlist?.({
                    tmdbId,
                    imdbId,
                    mediaType,
                    title,
                    year,
                    posterUrl: posterUri,
                    backdropUrl: backdropUri,
                    rating: imdbScore || tmdbScore,
                  })
                }
                scaleOnFocus={1.04}
                borderRadius={8}
                style={styles.secondaryBtn}
              >
                {({ focused }) => (
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      isSaved && { color: GOLD_ACCENT },
                      focused && styles.textBtnFocused,
                    ]}
                  >
                    {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
                  </Text>
                )}
              </TvFocusable>
            </View>
          </View>
        </View>
      </View>

      {/* Active Offline Download Banner */}
      {existingDownload ? (
        <View style={styles.downloadBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.downloadTitle}>
              Offline Storage: {existingDownload.state.toUpperCase()} ·{' '}
              {Math.round((existingDownload.progress || 0) * 100)}% (
              {formatBytes(existingDownload.downloadedBytes || 0)} /{' '}
              {formatBytes(existingDownload.totalBytes || 0)})
            </Text>
            {existingDownload.state === 'downloading' ? (
              <Text style={styles.downloadSub}>
                Speed: {formatSpeed(existingDownload.speed || 0)}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TvFocusable
              appearance="text"
              onPress={() => playDownloaded(existingDownload)}
              borderRadius={6}
              style={styles.smallGoldBtn}
            >
              {({ focused }) => (
                <Text style={[styles.smallGoldBtnText, focused && styles.textBtnFocused]}>
                  Play File
                </Text>
              )}
            </TvFocusable>
            {existingDownload.state === 'downloading' ? (
              <TvFocusable
                appearance="text"
                onPress={() => pauseDownload(existingDownload.id)}
                borderRadius={6}
                style={styles.smallOutlineBtn}
              >
                {({ focused }) => (
                  <Text style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}>
                    Pause
                  </Text>
                )}
              </TvFocusable>
            ) : existingDownload.state === 'paused' ? (
              <TvFocusable
                appearance="text"
                onPress={() => resumeDownload(existingDownload.id)}
                borderRadius={6}
                style={styles.smallOutlineBtn}
              >
                {({ focused }) => (
                  <Text style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}>
                    Resume
                  </Text>
                )}
              </TvFocusable>
            ) : null}
            <TvFocusable
              appearance="text"
              onPress={() => deleteDownload(existingDownload.id)}
              borderRadius={6}
              style={styles.smallOutlineBtn}
            >
              {({ focused }) => (
                <Text
                  style={[
                    styles.smallOutlineBtnText,
                    { color: '#FF6961' },
                    focused && styles.textBtnFocused,
                  ]}
                >
                  Delete
                </Text>
              )}
            </TvFocusable>
          </View>
        </View>
      ) : null}

      {/* Where to Watch Streaming Availability */}
      {watchRows.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Where to Watch</Text>
          <View style={styles.providerPillsRow}>
            {watchRows.slice(0, 16).map((row) => {
              const services = serviceLabelsForRow(row);
              const servicesLabel = services.length > 0 ? services.join(', ') : 'Streaming';
              return (
                <View key={row.code} style={styles.providerPill}>
                  <Text style={styles.providerCountryText}>
                    {row.country}{' '}
                    <Text style={styles.providerServicesText}>· {servicesLabel}</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Movie All Peer Releases Drawer */}
      {mediaType === 'movie' && showAllStreams && streams.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Releases</Text>
          <View style={styles.releasesList}>
            {visibleStreams.slice(0, 18).map((rel, idx) => (
              <View key={`${rel.infoHash || idx}`} style={styles.releaseRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text numberOfLines={1} style={styles.releaseName}>
                    {rel.name}
                  </Text>
                  <View style={styles.releaseMetaRow}>
                    {rel.health?.badge ? (
                      <Text
                        style={[
                          styles.healthBadgeText,
                          { color: rel.health.color || GOLD_ACCENT },
                        ]}
                      >
                        {rel.health.badge}
                      </Text>
                    ) : null}
                    <Text numberOfLines={1} style={styles.releaseMeta}>
                      {[
                        rel.attributes?.resolution,
                        rel.attributes?.codec,
                        rel.attributes?.hdr,
                        rel.attributes?.audioBadge?.text,
                        rel.formattedSize || rel.sizeFormatted,
                        `${rel.scrapeVerified ? '' : '~'}${rel.seeders} seeders`,
                        rel.source,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TvFocusable
                    appearance="text"
                    onPress={() => handleLaunchMovieStream(rel, `rel-${idx}`)}
                    borderRadius={6}
                    style={styles.smallGoldBtn}
                  >
                    {({ focused }) => (
                      <Text style={[styles.smallGoldBtnText, focused && styles.textBtnFocused]}>
                        Play
                      </Text>
                    )}
                  </TvFocusable>
                  <TvFocusable
                    appearance="text"
                    onPress={() =>
                      startDownload({
                        magnet: rel.magnetUrl,
                        infoHash: rel.infoHash,
                        fileIdx: rel.fileIdx,
                        title,
                        releaseName: rel.name,
                        mediaType: 'movie',
                        tmdbId,
                        imdbId,
                        year,
                        posterUrl: posterUri,
                        quality: rel.attributes?.resolution || '',
                      })
                    }
                    borderRadius={6}
                    style={styles.smallOutlineBtn}
                  >
                    {({ focused }) => (
                      <Text style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}>
                        Download
                      </Text>
                    )}
                  </TvFocusable>
                </View>
              </View>
            ))}
            {hiddenDeadStreamsCount > 0 && healthyStreams.length > 0 ? (
              <View style={styles.toggleDeadRow}>
                <TvFocusable
                  appearance="text"
                  onPress={() => setShowDeadStreams((prev) => !prev)}
                  scaleOnFocus={1.03}
                  borderRadius={6}
                  style={styles.smallOutlineBtn}
                  accessibilityLabel={
                    showDeadStreams ? 'Hide dead and archive swarms' : 'Show all swarms'
                  }
                >
                  {({ focused }) => (
                    <Text style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}>
                      {showDeadStreams
                        ? 'Hide dead / archive swarms'
                        : `Show ${hiddenDeadStreamsCount} dead / archive swarm${hiddenDeadStreamsCount === 1 ? '' : 's'}`}
                    </Text>
                  )}
                </TvFocusable>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* TV Series Interactive Season & Episode Browser */}
      {mediaType === 'tv' && seasons.length > 0 ? (
        <View style={styles.sectionBlock}>
          <View style={styles.seasonHeaderRow}>
            <Text style={styles.sectionTitle}>Episodes</Text>
            {topSeasonPack ? (
              <View style={styles.seasonPackActions}>
                <TvFocusable
                  appearance="text"
                  onPress={() =>
                    launchStream({
                      magnetUrl: topSeasonPack.magnetUrl,
                      title: topSeasonPack.name,
                      mediaTitle: `${title} Season ${selectedSeasonNum}`,
                      originalTitle,
                      year,
                      tmdbId,
                      fileIdx: 0,
                      imdbId,
                      season: selectedSeasonNum,
                      episode: 1,
                    })
                  }
                  borderRadius={6}
                  style={styles.smallGoldBtn}
                >
                  {({ focused }) => (
                    <Text style={[styles.smallGoldBtnText, focused && styles.textBtnFocused]}>
                      {`Play Season ${selectedSeasonNum} Pack${topSeasonPack.health?.badge ? ` · ${topSeasonPack.health.badge}` : ''}`}
                    </Text>
                  )}
                </TvFocusable>
                {seasonPacks.length > 0 ? (
                  <TvFocusable
                    appearance="text"
                    onPress={() => setShowSeasonPacksDrawer((prev) => !prev)}
                    borderRadius={6}
                    style={styles.smallOutlineBtn}
                  >
                    {({ focused }) => (
                      <Text style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}>
                        {showSeasonPacksDrawer
                          ? 'Hide Packs'
                          : `Season Packs (${seasonPacks.length})`}
                      </Text>
                    )}
                  </TvFocusable>
                ) : null}
              </View>
            ) : null}
          </View>

          {showSeasonPacksDrawer && seasonPacks.length > 0 ? (
            <View style={styles.seasonPacksDrawer}>
              {visibleSeasonPacks.slice(0, 10).map((pack, pIdx) => (
                <View key={`${pack.infoHash || pIdx}`} style={styles.releaseRow}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text numberOfLines={1} style={styles.releaseName}>
                      {pack.name}
                    </Text>
                    <View style={styles.releaseMetaRow}>
                      {pack.health?.badge ? (
                        <Text
                          style={[
                            styles.healthBadgeText,
                            { color: pack.health.color || GOLD_ACCENT },
                          ]}
                        >
                          {pack.health.badge}
                        </Text>
                      ) : null}
                      <Text numberOfLines={1} style={styles.releaseMeta}>
                        {[
                          pack.attributes?.resolution,
                          pack.attributes?.codec,
                          pack.formattedSize || pack.sizeFormatted,
                          `${pack.scrapeVerified ? '' : '~'}${pack.seeders} seeders`,
                          pack.source,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </View>
                  <TvFocusable
                    appearance="text"
                    onPress={() =>
                      launchStream({
                        magnetUrl: pack.magnetUrl,
                        title: pack.name,
                        mediaTitle: `${title} Season ${selectedSeasonNum}`,
                        originalTitle,
                        year,
                        tmdbId,
                        fileIdx: 0,
                        imdbId,
                        season: selectedSeasonNum,
                        episode: 1,
                      })
                    }
                    borderRadius={6}
                    style={styles.smallGoldBtn}
                  >
                    {({ focused }) => (
                      <Text style={[styles.smallGoldBtnText, focused && styles.textBtnFocused]}>
                        Play
                      </Text>
                    )}
                  </TvFocusable>
                </View>
              ))}
              {hiddenDeadPacksCount > 0 && healthySeasonPacks.length > 0 ? (
                <View style={styles.toggleDeadRow}>
                  <TvFocusable
                    appearance="text"
                    onPress={() => setShowDeadSeasonPacks((prev) => !prev)}
                    scaleOnFocus={1.03}
                    borderRadius={6}
                    style={styles.smallOutlineBtn}
                  >
                    {({ focused }) => (
                      <Text style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}>
                        {showDeadSeasonPacks
                          ? 'Hide dead / archive packs'
                          : `Show ${hiddenDeadPacksCount} dead / archive pack${hiddenDeadPacksCount === 1 ? '' : 's'}`}
                      </Text>
                    )}
                  </TvFocusable>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Horizontal Season Selector Text Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seasonTabsRow}
          >
            {seasons.map((s) => {
              const active = s.seasonNumber === selectedSeasonNum;
              return (
                <TvFocusable
                  key={s.seasonNumber}
                  appearance="text"
                  onPress={() => setSelectedSeasonNum(s.seasonNumber)}
                  scaleOnFocus={1.04}
                  borderRadius={6}
                  style={styles.seasonPill}
                >
                  {({ focused }) => (
                    <View style={{ alignItems: 'center' }}>
                      <Text
                        style={[
                          styles.seasonPillText,
                          active && styles.seasonPillTextActive,
                          focused && styles.textBtnFocused,
                        ]}
                      >
                        {s.name || `Season ${s.seasonNumber}`}
                        {s.episodeCount ? ` (${s.episodeCount})` : ''}
                      </Text>
                      {active ? <View style={styles.activeUnderline} /> : null}
                    </View>
                  )}
                </TvFocusable>
              );
            })}
          </ScrollView>

          {/* Episodes List */}
          {episodesLoading ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={GOLD_ACCENT} />
            </View>
          ) : (
            <View style={styles.episodesList}>
              {episodes.map((ep) => {
                const epSwarms = episodeSwarms[ep.episodeNumber] || [];
                const isEpLoading = loadingEpisodeNum === ep.episodeNumber;
                const isEpExpanded = expandedEpisodeNum === ep.episodeNumber;

                return (
                  <View key={ep.id || ep.episodeNumber} style={styles.episodeBlock}>
                    <View style={styles.episodeRow}>
                      <View style={styles.episodeStillWrap}>
                        <MediaArtwork
                          uri={ep.stillUrl || backdropUri}
                          title={ep.name}
                          variant="backdrop"
                          style={styles.episodeStill}
                        />
                      </View>

                      <View style={styles.episodeInfo}>
                        <Text numberOfLines={1} style={styles.episodeTitle}>
                          {ep.episodeNumber}. {ep.name || `Episode ${ep.episodeNumber}`}
                        </Text>
                        <Text style={styles.episodeMeta}>
                          {[
                            ep.airDate,
                            ep.runtimeMinutes || ep.runtime
                              ? `${ep.runtimeMinutes || ep.runtime}m`
                              : null,
                            ep.rating
                              ? `${ep.rating}`
                              : ep.voteAverage > 0
                                ? `${ep.voteAverage.toFixed(1)}`
                                : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                        {ep.overview ? (
                          <Text numberOfLines={2} style={styles.episodeOverview}>
                            {ep.overview}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.episodeActions}>
                        <TvFocusable
                          appearance="text"
                          onPress={() => handlePlayEpisode(ep)}
                          scaleOnFocus={1.04}
                          borderRadius={6}
                          style={styles.smallGoldBtn}
                        >
                          {({ focused }) => (
                            <Text style={[styles.smallGoldBtnText, focused && styles.textBtnFocused]}>
                              {isEpLoading ? 'Loading...' : 'Play'}
                            </Text>
                          )}
                        </TvFocusable>

                        <TvFocusable
                          appearance="text"
                          onPress={() => handleBrowseEpisodeSources(ep)}
                          scaleOnFocus={1.04}
                          borderRadius={6}
                          style={styles.smallOutlineBtn}
                        >
                          {({ focused }) => (
                            <Text
                              style={[styles.smallOutlineBtnText, focused && styles.textBtnFocused]}
                            >
                              {isEpExpanded ? 'Hide' : 'Sources'}
                            </Text>
                          )}
                        </TvFocusable>
                      </View>
                    </View>

                    {/* Expanded Episode Swarm Releases */}
                    {isEpExpanded && epSwarms.length > 0
                      ? (() => {
                          const healthyEp = epSwarms.filter((s) => !isDeadOrArchiveStream(s));
                          const hiddenEpDead = epSwarms.length - healthyEp.length;
                          const showAllForEp = Boolean(showDeadEpisodeSwarms[ep.episodeNumber]);
                          const visibleEp =
                            showAllForEp || !healthyEp.length ? epSwarms : healthyEp;

                          return (
                            <View style={styles.epSourcesDrawer}>
                              {visibleEp.slice(0, 10).map((rel, rIdx) => (
                                <View key={`${rel.infoHash}-${rIdx}`} style={styles.epSourceItem}>
                                  <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text numberOfLines={1} style={styles.epSourceName}>
                                      {rel.name}
                                    </Text>
                                    <View style={styles.releaseMetaRow}>
                                      {rel.health?.badge ? (
                                        <Text
                                          style={[
                                            styles.healthBadgeText,
                                            { color: rel.health.color || GOLD_ACCENT },
                                          ]}
                                        >
                                          {rel.health.badge}
                                        </Text>
                                      ) : null}
                                      {rel.isSeasonPackFallback ? (
                                        <Text style={styles.seasonPackBadgeText}>SEASON PACK</Text>
                                      ) : null}
                                      <Text numberOfLines={1} style={styles.releaseMeta}>
                                        {[
                                          rel.attributes?.resolution || 'HD',
                                          rel.formattedSize || rel.sizeFormatted,
                                          `${rel.scrapeVerified ? '' : '~'}${rel.seeders} seeds`,
                                          rel.source,
                                        ]
                                          .filter(Boolean)
                                          .join(' · ')}
                                      </Text>
                                    </View>
                                  </View>
                                  <View style={{ flexDirection: 'row', gap: 10 }}>
                                    <TvFocusable
                                      appearance="text"
                                      onPress={() =>
                                        launchStream({
                                          magnetUrl: rel.magnetUrl,
                                          title: rel.name,
                                          mediaTitle: `${title} S${String(selectedSeasonNum).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')}`,
                                          originalTitle,
                                          year,
                                          tmdbId,
                                          fileIdx: rel.fileIdx,
                                          imdbId,
                                          season: selectedSeasonNum,
                                          episode: ep.episodeNumber,
                                        })
                                      }
                                      borderRadius={6}
                                      style={styles.smallGoldBtn}
                                    >
                                      {({ focused }) => (
                                        <Text
                                          style={[
                                            styles.smallGoldBtnText,
                                            focused && styles.textBtnFocused,
                                          ]}
                                        >
                                          Stream
                                        </Text>
                                      )}
                                    </TvFocusable>
                                    <TvFocusable
                                      appearance="text"
                                      onPress={() =>
                                        startDownload({
                                          magnet: rel.magnetUrl,
                                          infoHash: rel.infoHash,
                                          fileIdx: rel.fileIdx,
                                          title: `${title} S${String(selectedSeasonNum).padStart(2, '0')}E${String(ep.episodeNumber).padStart(2, '0')}`,
                                          releaseName: rel.name,
                                          mediaType: 'tv',
                                          tmdbId,
                                          imdbId,
                                          season: selectedSeasonNum,
                                          episode: ep.episodeNumber,
                                          year,
                                          posterUrl: posterUri,
                                        })
                                      }
                                      borderRadius={6}
                                      style={styles.smallOutlineBtn}
                                    >
                                      {({ focused }) => (
                                        <Text
                                          style={[
                                            styles.smallOutlineBtnText,
                                            focused && styles.textBtnFocused,
                                          ]}
                                        >
                                          Download
                                        </Text>
                                      )}
                                    </TvFocusable>
                                  </View>
                                </View>
                              ))}
                              {hiddenEpDead > 0 && healthyEp.length > 0 ? (
                                <View style={styles.toggleDeadRow}>
                                  <TvFocusable
                                    appearance="text"
                                    onPress={() =>
                                      setShowDeadEpisodeSwarms((prev) => ({
                                        ...prev,
                                        [ep.episodeNumber]: !prev[ep.episodeNumber],
                                      }))
                                    }
                                    scaleOnFocus={1.03}
                                    borderRadius={6}
                                    style={styles.smallOutlineBtn}
                                  >
                                    {({ focused }) => (
                                      <Text
                                        style={[
                                          styles.smallOutlineBtnText,
                                          focused && styles.textBtnFocused,
                                        ]}
                                      >
                                        {showAllForEp
                                          ? 'Hide dead / archive swarms'
                                          : `Show ${hiddenEpDead} dead / archive swarm${hiddenEpDead === 1 ? '' : 's'}`}
                                      </Text>
                                    )}
                                  </TvFocusable>
                                </View>
                              ) : null}
                            </View>
                          );
                        })()
                      : null}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {/* Cast & Crew Swimlane */}
      {castList.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>Cast</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.castRow}
          >
            {castList.map((person, idx) => (
              <TvFocusable
                key={`${person.id || person.name}-${idx}`}
                appearance="text"
                onPress={() => onSelectPerson?.(person)}
                scaleOnFocus={1.04}
                borderRadius={10}
                style={styles.castCard}
              >
                <View style={styles.castCardInner}>
                  <MediaArtwork
                    uri={person.profileUrl || person.profile_path}
                    title={person.name}
                    variant="person"
                    style={styles.castAvatar}
                  />
                  <Text numberOfLines={1} style={styles.castName}>
                    {person.name}
                  </Text>
                  <Text numberOfLines={1} style={styles.castRole}>
                    {person.character || person.job || 'Cast'}
                  </Text>
                </View>
              </TvFocusable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Franchise Rail */}
      {franchiseItems.length > 1 ? (
        <TvContentRail
          title={franchiseName || 'Film Collection'}
          data={franchiseItems}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {/* Recommended & Similar Swimlanes */}
      {recommendedItems.length > 0 ? (
        <TvContentRail
          title="Recommended Next"
          data={recommendedItems.slice(0, 20)}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {similarItems.length > 0 ? (
        <TvContentRail
          title="More Like This"
          data={similarItems.slice(0, 20)}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      <TrailerModal
        visible={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        trailerUrl={bestTrailer?.url}
        candidates={trailerCandidates}
        trailerType={bestTrailer?.type}
        posterUrl={backdropUri}
        title={title}
      />
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
  },
  centerStage: {
    alignItems: 'center',
    backgroundColor: '#040301',
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    color: '#E1DDD7',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.body,
    marginTop: 12,
  },
  heroStage: {
    minHeight: 330,
    paddingBottom: 20,
    paddingHorizontal: TV_SPACE.overscanX,
    paddingTop: 18,
    position: 'relative',
  },
  backdropImg: {
    ...StyleSheet.absoluteFillObject,
    left: '20%',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    zIndex: 5,
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
  textBtnFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  heroBody: {
    flexDirection: 'row',
    gap: 24,
    zIndex: 5,
  },
  posterColumn: {
    backgroundColor: '#0E0C09',
    borderRadius: 10,
    elevation: 8,
    height: 216,
    overflow: 'hidden',
    width: 144,
  },
  posterThumb: {
    height: '100%',
    width: '100%',
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 36,
    marginBottom: 8,
  },
  metaDot: {
    color: '#D8D2C7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
    marginBottom: 8,
  },
  genresLine: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
    marginBottom: 8,
  },
  plotText: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.body,
    lineHeight: 22,
    marginBottom: 10,
    maxWidth: '94%',
  },
  awardsBannerText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
    marginBottom: 12,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 4,
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryBtnText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.button,
    fontWeight: '800',
  },
  secondaryBtnText: {
    color: '#D8D2C7',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.button,
    fontWeight: '700',
  },
  downloadBanner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginHorizontal: TV_SPACE.overscanX,
    paddingVertical: 10,
  },
  downloadTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  downloadSub: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 26,
    paddingHorizontal: TV_SPACE.overscanX,
  },
  sectionTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
    marginBottom: 12,
  },
  providerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginTop: 4,
  },
  providerPill: {
    paddingVertical: 4,
  },
  providerCountryText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  providerServicesText: {
    color: '#B5AFA4',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  releasesList: {
    gap: 10,
  },
  releaseRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  releaseName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.cardTitle,
    fontWeight: '700',
  },
  releaseMeta: {
    color: '#C7C1B7',
    flexShrink: 1,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
  },
  releaseMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  healthBadgeText: {
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  seasonPackBadgeText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  toggleDeadRow: {
    alignItems: 'flex-start',
    marginTop: 6,
  },
  seasonPackActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  seasonPacksDrawer: {
    gap: 10,
    marginBottom: 14,
  },
  smallGoldBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallGoldBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  smallOutlineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallOutlineBtnText: {
    color: '#D8D2C7',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  seasonHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seasonTabsRow: {
    alignItems: 'center',
    gap: 14,
    paddingBottom: 14,
    paddingVertical: 4,
  },
  seasonPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  seasonPillText: {
    color: '#ABA59B',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  seasonPillTextActive: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  activeUnderline: {
    backgroundColor: GOLD_ACCENT,
    borderRadius: 1,
    height: 2,
    marginTop: 4,
    width: '100%',
  },
  episodesList: {
    gap: 14,
  },
  episodeBlock: {
    overflow: 'hidden',
  },
  episodeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 8,
  },
  episodeStillWrap: {
    borderRadius: 8,
    height: 84,
    overflow: 'hidden',
    position: 'relative',
    width: 148,
  },
  episodeStill: {
    height: '100%',
    width: '100%',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.body,
    fontWeight: '700',
  },
  episodeMeta: {
    color: '#B5AFA4',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    marginTop: 2,
  },
  episodeOverview: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    lineHeight: 20,
    marginTop: 4,
  },
  episodeActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  epSourcesDrawer: {
    gap: 8,
    paddingVertical: 10,
  },
  epSourceItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  epSourceName: {
    color: '#E6E1D7',
    flex: 1,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    paddingRight: 12,
  },
  castRow: {
    gap: 14,
    paddingVertical: 8,
  },
  castCard: {
    padding: 8,
    width: 132,
  },
  castCardInner: {
    alignItems: 'center',
  },
  castAvatar: {
    borderRadius: 8,
    height: 126,
    marginBottom: 8,
    width: 104,
  },
  castName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
    textAlign: 'center',
  },
  castRole: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.eyebrow,
    marginTop: 2,
    textAlign: 'center',
  },
});
