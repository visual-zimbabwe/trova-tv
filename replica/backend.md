# Backend & Native Engine Checklist: Trova TV (`replica-backend`)

## Local Go Torrent & Subtitle Server (`127.0.0.1:8899`)
- [x] Dual-ABI CGO cross-compilation (`arm64-v8a` and `armeabi-v7a` for Sony BRAVIA 4K TV) into `android/app/src/main/jniLibs/`
- [x] Android `TorrentStreamerService` foreground service (`mediaPlayback` type) with persistent notification and wake-lock
- [x] HTTP range streaming (`/stream`) with prioritized piece read-ahead for instant 1080p/4K video start and seeking
- [x] Swarm metadata preloader (`/preload`) warmed opportunistically when opening a title detail screen
- [x] Automatic English subtitle resolver (`/fetch-subtitle`) querying OpenSubtitles, Subdl, and Podnapisi, normalizing to UTF-8 `.srt`
- [x] Persistent 75 GB offline download pool (`/download/start`, `/download/pause`, `/download/resume`, `/download/delete`, `/download/status`, `/download/play`)

## Official Public Metadata Integrations
- [x] **TMDb API v3**: Movies, TV series, seasons, episodes, cast/crew credits, watch providers, recommendations, multi-search
- [x] **OMDb API**: IMDb rating, Rotten Tomatoes Tomatometer, Metacritic Metascore, awards summary
- [x] **Trakt API v2**: Real-time trending movies & shows with watcher counts (with automatic TMDb popularity fallback)
- [x] **TVmaze API**: Next airing episode timestamps and broadcast schedule enrichment
- [x] **Wikidata SPARQL**: 47 Film Award Ceremonies, 40 Global Television Honors, literary source material (`basedOn`), and soundtracks

## Security & Privacy Checklist
- [x] Zero user login wall or cloud account tracking; 100% local-first household data in AsyncStorage
- [x] `.env.example` documented with variable names only
- [x] Local HTTP streaming server binds strictly to loopback (`127.0.0.1:8899`)
- [x] Rate-limit telemetry (`src/lib/apiRateQuota.js`) tracks HTTP 429 retry headers across TMDb, Trakt, and OMDb
