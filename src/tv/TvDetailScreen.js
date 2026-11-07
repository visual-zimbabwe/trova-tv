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
import {
  fetchSeasonEpisodes,
  fetchTitleCollection,
  fetchTitleRails,
} from '../lib/tmdb';
import {
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
  const [episodeSwarms, setEpisodeSwarms] = useState({});
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
      searchMovieTorrents({ title, year, imdbId })
        .then((res) => {
          if (!cancelled) {
            setStreams(res || []);
            setStreamsLoading(false);
            if (res?.[0]?.magnetUrl && res[0].seeders > 0) {
              fetch(
                `http://127.0.0.1:8899/preload?magnet=${encodeURIComponent(res[0].magnetUrl)}`,
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
  }, [mediaType, title, year, imdbId]);

  // Fetch TV Season episodes + Season Pack torrents when viewing a series
  useEffect(() => {
    let cancelled = false;
    if (mediaType === 'tv' && tmdbId && selectedSeasonNum != null) {
      setEpisodesLoading(true);
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
  }, [mediaType, tmdbId, selectedSeasonNum, title, imdbId]);

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
        const best = existing[0];
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
          seasonNumber: selectedSeasonNum,
          episodeNumber: epNum,
          imdbId,
        });
        setEpisodeSwarms((prev) => ({ ...prev, [epNum]: found || [] }));
        if (found && found.length > 0) {
          const best = found[0];
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
    [expandedEpisodeNum, episodeSwarms, title, selectedSeasonNum, imdbId],
  );

  if (loading && !result) {
    return (
      <View style={styles.centerStage}>
        <ActivityIndicator size="large" color={GOLD_ACCENT} />
        <Text style={styles.loadingText}>Loading 10-foot cinema dossier...</Text>
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

  const topStream = streams[0] || null;
  const topSeasonPack = seasonPacks[0] || null;
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

        {/* Back Button & Eyebrow */}
        <View style={styles.topBar}>
          <TvFocusable
            onPress={onBack}
            scaleOnFocus={1.04}
            borderRadius={999}
            style={styles.backBtn}
            accessibilityLabel="Back"
          >
            <Text style={styles.backBtnText}>Back</Text>
          </TvFocusable>

          <Text style={styles.eyebrowText}>
            {mediaType === 'tv' ? 'TELEVISION SERIES' : 'FEATURE FILM'}
          </Text>
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

            {/* Scorecard Row: Clean borderless pills */}
            <View style={styles.scorecardRow}>
              {imdbScore ? (
                <View style={styles.scoreBadgeGold}>
                  <Text style={styles.scoreSourceGold}>IMDb</Text>
                  <Text style={styles.scoreValueGold}>{imdbScore}</Text>
                </View>
              ) : null}

              {rtScore ? (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreSource}>Rotten Tomatoes</Text>
                  <Text style={styles.scoreValue}>{rtScore}</Text>
                </View>
              ) : null}

              {metaScore ? (
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreSource}>Metacritic</Text>
                  <Text style={styles.scoreValue}>{metaScore}</Text>
                </View>
              ) : null}

              {tmdbScore && !imdbScore ? (
                <View style={styles.scoreBadgeGold}>
                  <Text style={styles.scoreSourceGold}>TMDb</Text>
                  <Text style={styles.scoreValueGold}>{tmdbScore}</Text>
                </View>
              ) : null}

              {year ? <Text style={styles.metaDot}>{year}</Text> : null}
              {runtimeLabel ? <Text style={styles.metaDot}>· {runtimeLabel}</Text> : null}
              {result.Rated && result.Rated !== 'N/A' ? (
                <Text style={styles.metaDot}>· {result.Rated}</Text>
              ) : null}
              {nextEpLabel ? (
                <View style={styles.nextEpPill}>
                  <Text style={styles.nextEpText}>{nextEpLabel}</Text>
                </View>
              ) : null}
            </View>

            {genresLabel ? <Text style={styles.genresLine}>{genresLabel}</Text> : null}

            {/* Synopsis */}
            {synopsisText ? (
              <Text numberOfLines={3} style={styles.plotText}>
                {synopsisText}
              </Text>
            ) : null}

            {/* Awards Summary Banner */}
            {result.Awards && result.Awards !== 'N/A' ? (
              <View style={styles.awardsBanner}>
                <Text numberOfLines={1} style={styles.awardsBannerText}>
                  {result.Awards}
                </Text>
              </View>
            ) : null}

            {/* 10-Foot Action Buttons Row */}
            <View style={styles.actionRow}>
              {mediaType === 'movie' ? (
                <TvFocusable
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
                  borderRadius={999}
                  focusBorderColor="#FEFBF6"
                  style={styles.primaryBtn}
                  accessibilityLabel="Play movie now"
                >
                  <Text style={styles.primaryBtnText}>
                    {existingDownload?.state === 'completed'
                      ? 'Play Offline'
                      : topStream
                        ? `Play (${topStream.attributes?.resolution || '1080p'} · ${topStream.seeders} peers)`
                        : streamsLoading
                          ? 'Searching Swarms...'
                          : 'Browse Streams'}
                  </Text>
                </TvFocusable>
              ) : (
                <TvFocusable
                  hasTVPreferredFocus={true}
                  onPress={() => {
                    if (episodes.length > 0) {
                      handlePlayEpisode(episodes[0]);
                    }
                  }}
                  scaleOnFocus={1.04}
                  borderRadius={999}
                  focusBorderColor="#FEFBF6"
                  style={styles.primaryBtn}
                  accessibilityLabel={`Play Season ${selectedSeasonNum} Episode 1`}
                >
                  <Text style={styles.primaryBtnText}>
                    Play S{String(selectedSeasonNum).padStart(2, '0')}E01
                  </Text>
                </TvFocusable>
              )}

              {mediaType === 'movie' && streams.length > 0 ? (
                <TvFocusable
                  onPress={() => setShowAllStreams((prev) => !prev)}
                  scaleOnFocus={1.04}
                  borderRadius={999}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>
                    {showAllStreams ? 'Hide Releases' : `All Releases (${streams.length})`}
                  </Text>
                </TvFocusable>
              ) : null}

              {mediaType === 'movie' && topStream && !existingDownload ? (
                <TvFocusable
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
                  borderRadius={999}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Download</Text>
                </TvFocusable>
              ) : null}

              {bestTrailer ? (
                <TvFocusable
                  onPress={() => setTrailerOpen(true)}
                  scaleOnFocus={1.04}
                  borderRadius={999}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Trailer</Text>
                </TvFocusable>
              ) : null}

              <TvFocusable
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
                borderRadius={999}
                style={styles.secondaryBtn}
              >
                <Text style={[styles.secondaryBtnText, isSaved && { color: GOLD_ACCENT }]}>
                  {isSaved ? 'In Watchlist' : 'Add to Watchlist'}
                </Text>
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TvFocusable
              onPress={() => playDownloaded(existingDownload)}
              borderRadius={999}
              style={styles.smallGoldBtn}
            >
              <Text style={styles.smallGoldBtnText}>Play File</Text>
            </TvFocusable>
            {existingDownload.state === 'downloading' ? (
              <TvFocusable
                onPress={() => pauseDownload(existingDownload.id)}
                borderRadius={999}
                style={styles.smallOutlineBtn}
              >
                <Text style={styles.smallOutlineBtnText}>Pause</Text>
              </TvFocusable>
            ) : existingDownload.state === 'paused' ? (
              <TvFocusable
                onPress={() => resumeDownload(existingDownload.id)}
                borderRadius={999}
                style={styles.smallOutlineBtn}
              >
                <Text style={styles.smallOutlineBtnText}>Resume</Text>
              </TvFocusable>
            ) : null}
            <TvFocusable
              onPress={() => deleteDownload(existingDownload.id)}
              borderRadius={999}
              style={styles.smallOutlineBtn}
            >
              <Text style={[styles.smallOutlineBtnText, { color: '#FF6961' }]}>Delete</Text>
            </TvFocusable>
          </View>
        </View>
      ) : null}

      {/* Where to Watch Streaming Availability Strip with full country names */}
      {watchRows.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>WHERE TO WATCH OFFICIALLY</Text>
          <View style={styles.providerPillsRow}>
            {watchRows.slice(0, 16).map((row) => {
              const services = serviceLabelsForRow(row);
              const servicesLabel = services.length > 0 ? services.join(', ') : 'Streaming';
              return (
                <View key={row.code} style={styles.providerPill}>
                  <Text style={styles.providerCountryText}>{row.country}</Text>
                  <Text style={styles.providerServicesText}>{servicesLabel}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Movie All Peer Releases Drawer */}
      {mediaType === 'movie' && showAllStreams && streams.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>AVAILABLE PEER SWARM RELEASES</Text>
          <Text style={styles.sectionTitle}>Select Quality & Edition</Text>
          <View style={styles.releasesList}>
            {streams.slice(0, 14).map((rel, idx) => (
              <View key={`${rel.infoHash || idx}`} style={styles.releaseRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text numberOfLines={1} style={styles.releaseName}>
                    {rel.name}
                  </Text>
                  <Text style={styles.releaseMeta}>
                    {[
                      rel.attributes?.resolution,
                      rel.attributes?.codec,
                      rel.attributes?.hdr,
                      rel.sizeFormatted,
                      `${rel.seeders} seeders`,
                      rel.source,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TvFocusable
                    onPress={() => handleLaunchMovieStream(rel, `rel-${idx}`)}
                    borderRadius={999}
                    style={styles.smallGoldBtn}
                  >
                    <Text style={styles.smallGoldBtnText}>Play</Text>
                  </TvFocusable>
                  <TvFocusable
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
                    borderRadius={999}
                    style={styles.smallOutlineBtn}
                  >
                    <Text style={styles.smallOutlineBtnText}>Download</Text>
                  </TvFocusable>
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* TV Series Interactive Season & Episode Browser */}
      {mediaType === 'tv' && seasons.length > 0 ? (
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>EPISODE GUIDE & STREAMING</Text>
          <View style={styles.seasonHeaderRow}>
            <Text style={styles.sectionTitle}>Seasons & Episodes</Text>
            {topSeasonPack ? (
              <TvFocusable
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
                borderRadius={999}
                style={styles.smallOutlineBtn}
              >
                <Text style={styles.smallOutlineBtnText}>
                  Season {selectedSeasonNum} Pack ({topSeasonPack.seeders} peers)
                </Text>
              </TvFocusable>
            ) : null}
          </View>

          {/* Horizontal Season Selector Pills */}
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
                  onPress={() => setSelectedSeasonNum(s.seasonNumber)}
                  scaleOnFocus={1.04}
                  borderRadius={999}
                  style={[styles.seasonPill, active && styles.seasonPillActive]}
                >
                  <Text style={[styles.seasonPillText, active && styles.seasonPillTextActive]}>
                    {s.name || `Season ${s.seasonNumber}`}
                    {s.episodeCount ? ` (${s.episodeCount})` : ''}
                  </Text>
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
                        <View style={styles.epNumBadge}>
                          <Text style={styles.epNumText}>
                            E{String(ep.episodeNumber).padStart(2, '0')}
                          </Text>
                        </View>
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
                              ? `★ ${ep.rating}`
                              : ep.voteAverage > 0
                                ? `★ ${ep.voteAverage.toFixed(1)}`
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
                          onPress={() => handlePlayEpisode(ep)}
                          scaleOnFocus={1.04}
                          borderRadius={999}
                          style={styles.smallGoldBtn}
                        >
                          <Text style={styles.smallGoldBtnText}>
                            {isEpLoading ? 'Loading...' : 'Play'}
                          </Text>
                        </TvFocusable>

                        <TvFocusable
                          onPress={() => handleBrowseEpisodeSources(ep)}
                          scaleOnFocus={1.04}
                          borderRadius={999}
                          style={styles.smallOutlineBtn}
                        >
                          <Text style={styles.smallOutlineBtnText}>
                            {isEpExpanded ? 'Hide' : 'Sources'}
                          </Text>
                        </TvFocusable>
                      </View>
                    </View>

                    {/* Expanded Episode Swarm Releases */}
                    {isEpExpanded && epSwarms.length > 0 ? (
                      <View style={styles.epSourcesDrawer}>
                        {epSwarms.slice(0, 6).map((rel, rIdx) => (
                          <View key={`${rel.infoHash}-${rIdx}`} style={styles.epSourceItem}>
                            <Text numberOfLines={1} style={styles.epSourceName}>
                              {rel.name} ({rel.attributes?.resolution || 'HD'} · {rel.seeders}{' '}
                              peers)
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TvFocusable
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
                                borderRadius={999}
                                style={styles.smallGoldBtn}
                              >
                                <Text style={styles.smallGoldBtnText}>Stream</Text>
                              </TvFocusable>
                              <TvFocusable
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
                                borderRadius={999}
                                style={styles.smallOutlineBtn}
                              >
                                <Text style={styles.smallOutlineBtnText}>Download</Text>
                              </TvFocusable>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : null}
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
          <Text style={styles.sectionEyebrow}>CAST & CREATORS</Text>
          <Text style={styles.sectionTitle}>Featured Performers</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.castRow}
          >
            {castList.map((person, idx) => (
              <TvFocusable
                key={`${person.id || person.name}-${idx}`}
                onPress={() => onSelectPerson?.(person)}
                scaleOnFocus={1.05}
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
          eyebrow="FRANCHISE CONTINUITY"
          title={franchiseName || 'Film Collection'}
          subtitle={`${franchiseItems.length} installments`}
          data={franchiseItems}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {/* Recommended & Similar Swimlanes */}
      {recommendedItems.length > 0 ? (
        <TvContentRail
          eyebrow="CURATED FOR YOU"
          title="Recommended Next"
          data={recommendedItems.slice(0, 20)}
          savedKeys={savedKeys}
          onSelectItem={onSelectItem}
          onToggleWatchlist={onToggleWatchlist}
        />
      ) : null}

      {similarItems.length > 0 ? (
        <TvContentRail
          eyebrow="RELATED PROGRAMME"
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
    paddingBottom: 56,
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
    fontSize: 16,
    marginTop: 12,
  },
  heroStage: {
    minHeight: 310,
    paddingBottom: 18,
    paddingHorizontal: 28,
    paddingTop: 16,
    position: 'relative',
  },
  backdropImg: {
    ...StyleSheet.absoluteFillObject,
    left: '20%',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    zIndex: 5,
  },
  backBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  backBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '700',
  },
  eyebrowText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroBody: {
    flexDirection: 'row',
    gap: 22,
    zIndex: 5,
  },
  posterColumn: {
    backgroundColor: '#0E0C09',
    borderRadius: 10,
    elevation: 8,
    height: 200,
    overflow: 'hidden',
    width: 134,
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
    lineHeight: 35,
    marginBottom: 8,
  },
  scorecardRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  scoreBadgeGold: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 83, 0.16)',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreSourceGold: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '800',
  },
  scoreValueGold: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '800',
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  scoreSource: {
    color: '#A39E94',
    fontFamily: fonts.label,
    fontSize: 9.5,
    fontWeight: '700',
  },
  scoreValue: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '700',
  },
  metaDot: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
  },
  nextEpPill: {
    backgroundColor: 'rgba(76, 217, 100, 0.16)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  nextEpText: {
    color: '#4CD964',
    fontFamily: fonts.label,
    fontSize: 10.5,
    fontWeight: '700',
  },
  genresLine: {
    color: '#C2BDB5',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  plotText: {
    color: '#C2BDB5',
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 10,
    maxWidth: '92%',
  },
  awardsBanner: {
    backgroundColor: 'rgba(212, 168, 83, 0.10)',
    borderRadius: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  awardsBannerText: {
    color: '#EADCC5',
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '600',
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: GOLD_ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  primaryBtnText: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtnText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 12.5,
    fontWeight: '700',
  },
  downloadBanner: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.05)',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginHorizontal: 28,
    padding: 12,
  },
  downloadTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 12.5,
    fontWeight: '700',
  },
  downloadSub: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 11,
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 22,
    paddingHorizontal: 28,
  },
  sectionEyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  sectionTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  providerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  providerPill: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  providerCountryText: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 12.5,
    fontWeight: '700',
  },
  providerServicesText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 1,
  },
  releasesList: {
    gap: 8,
  },
  releaseRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(245, 238, 225, 0.04)',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  releaseName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '700',
  },
  releaseMeta: {
    color: '#A39E94',
    fontFamily: fonts.label,
    fontSize: 11,
    marginTop: 2,
  },
  smallGoldBtn: {
    backgroundColor: GOLD_ACCENT,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  smallGoldBtnText: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '800',
  },
  smallOutlineBtn: {
    backgroundColor: 'rgba(245, 238, 225, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallOutlineBtnText: {
    color: '#F5EEE1',
    fontFamily: fonts.label,
    fontSize: 11.5,
    fontWeight: '600',
  },
  seasonHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  seasonTabsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  seasonPill: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  seasonPillActive: {
    backgroundColor: GOLD_ACCENT,
  },
  seasonPillText: {
    color: '#E1DDD7',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
  },
  seasonPillTextActive: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  episodesList: {
    gap: 10,
  },
  episodeBlock: {
    backgroundColor: 'rgba(245, 238, 225, 0.03)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  episodeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    padding: 10,
  },
  episodeStillWrap: {
    borderRadius: 8,
    height: 78,
    overflow: 'hidden',
    position: 'relative',
    width: 138,
  },
  episodeStill: {
    height: '100%',
    width: '100%',
  },
  epNumBadge: {
    backgroundColor: 'rgba(4, 3, 1, 0.85)',
    borderRadius: 4,
    bottom: 5,
    left: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    position: 'absolute',
  },
  epNumText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '800',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 14,
    fontWeight: '700',
  },
  episodeMeta: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 11,
    marginTop: 2,
  },
  episodeOverview: {
    color: '#A39E94',
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 3,
  },
  episodeActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  epSourcesDrawer: {
    backgroundColor: 'rgba(245, 238, 225, 0.06)',
    gap: 6,
    padding: 10,
  },
  epSourceItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  epSourceName: {
    color: '#E1DDD7',
    flex: 1,
    fontFamily: fonts.label,
    fontSize: 11.5,
    paddingRight: 10,
  },
  castRow: {
    gap: 10,
    paddingVertical: 4,
  },
  castCard: {
    backgroundColor: 'rgba(245, 238, 225, 0.04)',
    padding: 6,
    width: 108,
  },
  castCardInner: {
    alignItems: 'center',
  },
  castAvatar: {
    borderRadius: 8,
    height: 116,
    marginBottom: 6,
    width: 92,
  },
  castName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  castRole: {
    color: '#A39E94',
    fontFamily: fonts.body,
    fontSize: 10,
    marginTop: 1,
    textAlign: 'center',
  },
});
