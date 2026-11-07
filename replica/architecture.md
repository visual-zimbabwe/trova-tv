# Architecture: Trova TV (10-Foot Living-Room Cinema & Streaming Hub)

## Stack

| layer | choice | why |
| --- | --- | --- |
| TV client | React Native 0.83.6 + Expo 55 (Android TV Leanback) | Reuses battle-tested JS/TS data & domain libraries from `~/apps/find-streamer` while targeting 10-foot 1080p/4K Android TV (`LEANBACK_LAUNCHER`) |
| styling | Token-driven StyleSheet (`src/theme/tokens.js` + `replica/design/tokens.json`) | Zero runtime CSS overhead, strict 10-foot typography & warm gold-on-obsidian contrast |
| D-pad navigation | Custom 10-foot Spatial Focus Engine (`TvFocusable`, `TvSidebar`, `TvAppShell`) | Native Android TV D-pad focus rings, zoom animations, hardware `BackHandler`, and focus memory per rail |
| local persistence | `@react-native-async-storage/async-storage` (10 GB quota) + Go engine state | Local-first privacy: zero cloud login required; watchlist, collections, recents, and download state persist on-device |
| media & metadata APIs | TMDb + OMDb + Trakt + TVmaze + Wikidata SPARQL | Official public APIs for metadata, ratings, watch providers, episode schedules, and awards |
| streaming & download backend | Embedded Go `anacrolix/torrent` HTTP Server (`127.0.0.1:8899`) via JNI (`libtorrentstreamer.so`) | Compiled for both `armeabi-v7a` (Sony BRAVIA 4K TV) and `arm64-v8a`, running inside `TorrentStreamerService` (`mediaPlayback` foreground service) |
| video playback | Built-in `TrovaPlayerActivity` (Android TV D-pad MediaPlayer/VideoView with subtitle overlay) + `mpv-android` (`is.xyz.mpv`) | Seamless 10-foot landscape playback with D-pad transport controls (Play/Pause, Seek -10s/+10s, Subtitle toggle) and external `mpv` support |

## Schema

Tables: 5 logical stores (persisted in local AsyncStorage JSON keys + Go engine `downloads_state.json`). Access rules: Single-household local device storage; zero external telemetry.

```sql
-- See replica/schema.sql for the complete relational representation of the local state stores.
```

## API

### Local Go Streaming & Subtitle Engine (`http://127.0.0.1:8899`)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `GET /preload` | Warms up peer swarm & fetches torrent info-dict metadata | `TvDetailScreen` / `streamLauncher` | `?magnet=<uri>` | `200 OK` JSON `{ status, name, files }` | F01, F02 |
| `GET /stream` | Streams selected video file via HTTP Range requests with read-ahead priority | `TrovaPlayerActivity` / `mpv-android` | `?magnet=<uri>&fileIdx=<n>` | `206 Partial Content` `video/mp4` or `video/x-matroska` | F01, F02 |
| `GET /fetch-subtitle` | Queries OpenSubtitles / Subdl / Podnapisi and converts best English subtitle to UTF-8 SRT | `streamLauncher` | `?imdb=<id>&tmdbId=<id>&title=<t>&season=<s>&episode=<e>` | JSON `{ status: true, url: "http://127.0.0.1:8899/subtitles/...", source }` | F01, F02 |
| `GET /download/start` | Starts persistent offline download inside the 75 GB storage pool | `downloadManager` | `?magnet=<uri>&fileIdx=<n>&title=<t>&tmdbId=<id>` | JSON `{ id, state }` | F06 |
| `GET /download/status` | Returns active & completed downloads, speeds, and disk usage | `downloadManager` / `TvDownloadsScreen` | none | JSON `{ activeCount, usedBytes, maxBytes, downloads: [...] }` | F06 |
| `GET /download/play` | Serves completed or in-progress downloaded file over HTTP | `streamLauncher` | `?id=<downloadId>` | `206 Partial Content` video stream | F06 |
| `GET /download/pause` | Pauses active download | `TvDownloadsScreen` | `?id=<downloadId>` | JSON `{ status: "paused" }` | F06 |
| `GET /download/resume` | Resumes paused download | `TvDownloadsScreen` | `?id=<downloadId>` | JSON `{ status: "downloading" }` | F06 |
| `GET /download/delete` | Deletes download and frees disk storage | `TvDownloadsScreen` | `?id=<downloadId>` | JSON `{ status: "deleted" }` | F06 |

### Public Metadata & Discovery APIs (`src/lib/*`)

| method path | does | who | input | output | flow |
| --- | --- | --- | --- | --- | --- |
| `tmdb.fetchTitleDetails` | Resolves full Movie/TV metadata, cast, trailers, seasons, providers | `useDetailController` | `(tmdbId, mediaType)` | Normalized `DetailResult` | F01, F02 |
| `omdb.fetchOmdbRatings` | Resolves IMDb, Rotten Tomatoes, Metacritic & award summary | `useDetailController` | `(imdbId, title, year)` | `{ imdbRating, rottenTomatoes, metacritic, awards }` | F01, F02 |
| `trakt.fetchHomeTraktTrendingRail` | Resolves top trending titles with live watcher counts | `TvHomeScreen`, `TvSearchScreen` | none | `{ items, source }` | F01, F03 |
| `torrentSearchEngine.searchMovieTorrents` | Queries public indexers (YTS, EZTV, TPB/Apibay, SolidTorrents) & ranks by quality/seeders | `TvDetailScreen` | `{ title, year, imdbId }` | `PeerSwarmRelease[]` | F01 |
| `torrentSearchEngine.searchEpisodeTorrents` | Queries episode + season pack torrents and resolves matching `fileIdx` | `TvSeasonModal` | `{ seriesTitle, seasonNumber, episodeNumber, imdbId }` | `PeerSwarmRelease[]` | F02 |

## The parts that bite

- **Sony BRAVIA 32-bit Userland (`armeabi-v7a`)**: Sony BRAVIA 4K AE2 runs Android 14 in 32-bit `armeabi-v7a` mode (`ro.product.cpu.abi=armeabi-v7a`). `libtorrentstreamer.so` MUST be cross-compiled with `GOARCH=arm GOARM=7 CC=armv7a-linux-androideabi24-clang` and packaged under `jniLibs/armeabi-v7a/` alongside `arm64-v8a/`.
- **Landscape Orientation Lifecycle**: Mobile Trova locked orientation to `PORTRAIT_UP` on launch and after player exit. On Android TV, locking to `PORTRAIT_UP` rotates or squishes the 16:9 television viewport. Trova TV locks exclusively to `LANDSCAPE` across `AndroidManifest.xml`, `App.js`, and `streamLauncher.js`.
- **10-Foot D-Pad Focus Visibility**: Standard touch `TouchableOpacity` gives no visible focus indicator on Android TV when navigated by remote D-pad. Every interactive element must use `TvFocusable`, which tracks `onFocus`/`onBlur`, renders a high-contrast `2.5px` warm gold (`#D4A853`) focus ring, scales up `1.05x`, and supports `hasTVPreferredFocus`.
- **Video Player Availability on TV**: If an external player isn't pre-installed, playback must never fail. We ship both a built-in native Android TV `TrovaPlayerActivity` (with D-pad transport controls & SRT subtitle rendering) AND install/support `is.xyz.mpv` (`armeabi-v7a`).

## Build order

1. **Vertical slice**: Android TV project setup in `~/apps/trova`, dual-ABI `libtorrentstreamer.so` build (`armeabi-v7a` + `arm64-v8a`), `TvSidebar` + `TvHomeScreen` (S01, S02) -> `TvDetailScreen` (S03) -> 1-Click Landscape Stream in `TrovaPlayerActivity` / `mpv`.
2. **Must-haves**: `TvSeasonModal` episode & season-pack browser (S04), `TvSearchScreen` with D-pad On-Screen Keyboard (S05), `TvDiscoverScreen` multi-facet studio (S06), `TvCollectionsScreen` franchises & IMDb Top 100 (S07), `TvAwardsScreen` 87 ceremonies (S08), `TvFilmographyScreen` (S09), and `TvWatchlistScreen` / `TvDownloadsScreen` / `TvSettingsScreen` (S10).
3. **Should-haves & Could-haves**: Trailer player modal, Based-On literary cards, Wikidata awards breakdown modal, rail sort toggles, API quota monitor, JSON backup/restore.
4. **Fixes from `replica-entrepreneur`**: Silent backdrop previews (zero auto-play audio annoyance), multi-critic scorecard badges on detail, unified Where-to-Watch + instant peer streaming, automatic English subtitles.
