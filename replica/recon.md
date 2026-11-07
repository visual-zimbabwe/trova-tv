# Recon map: Netflix / HBO Max / BBC iPlayer 10-Foot TV Standard (Android TV)

Scope: Full 10-foot living-room television streaming, discovery, awards, collections, and peer-swarm playback experience for Trova TV (`~/apps/trova`), reusing the `src/data` and `src/lib` engines from `~/apps/find-streamer`.
For: Living-room 4K Smart TV viewers (Sony BRAVIA 4K Android TV at `10.0.0.230`) who want a unified cinema programme, multi-service availability guide, global awards archive, and instant 1-click landscape playback with automatic subtitles.
Date: 2026-11-07

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Android TV Design Guidelines | https://developer.android.com/design/ui/tv | Official 10-foot D-pad focus, overscan (48dp/27dp), left navigation rail, hero carousel, and card grid rules |
| 2 | Netflix TV UI Help & Walkthrough | https://help.netflix.com/en/node/23876 | Collapsible left icon rail, widescreen 16:9 hero billboard, Top 10 numbered rails, instant D-pad category switching |
| 3 | Max (HBO Max) TV Features | https://help.max.com/us/Answer/Detail/000002547 | Deep editorial title pages, season/episode horizontal browser, cast & creator rails, award highlights |
| 4 | BBC iPlayer Connected TV Guide | https://www.bbc.co.uk/iplayer/help/questions/programme-information/connected-tv-nav | Programme-grade typography, split-screen A-Z D-pad search keyboard + live poster grid, curated categories |
| 5 | TMDb API Documentation | https://developer.themoviedb.org/docs | Public API for movies, TV shows, seasons, episodes, cast, collections, watch providers |
| 6 | Trakt API Documentation | https://trakt.docs.apiary.io/ | Trending movies & shows, community watcher metrics |
| 7 | Wikidata Query Service | https://query.wikidata.org/ | Global film (47 ceremonies) and television (40 ceremonies) honors, soundtracks, literary sources |
| 8 | Existing Trova Mobile Engine | file:///home/juwimana/apps/find-streamer | Shared `src/data` (awards catalogs, 470+ movie collections) and `src/lib` (TMDb, OMDb, Trakt, TVmaze, Go torrent swarm engine) |

## Core loop

Sit back 10 feet from the TV with a remote control (D-pad Up/Down/Left/Right/Select/Back), browse a cinema-grade widescreen billboard and horizontal swimlanes across Watchlist, Trending, Collections, 87 Global Awards, and Multi-Facet Discovery, open any Movie or TV Series to inspect multi-critic scores (IMDb, Rotten Tomatoes, Metacritic) and streaming availability, and launch instant 1080p/4K playback with automatic English subtitles in 2 clicks.

## Screens

| ID | screen | route / how to reach | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | 10-Foot App Shell & Left Nav Rail | Root launch (`LEANBACK_LAUNCHER`) | Persistent collapsible left navigation rail (Search, Home, Movies, TV Shows, Collections, Awards, Discover, Watchlist, Downloads, Settings) + overscan-safe 16:9 stage | `TvSidebar`, `TvFocusable`, `StatusBanner`, `TrovaToast` | collapsed, expanded (on D-pad left), offline banner, loading gate |
| S02 | Home / Movies / Shows 10-Foot Hub | Default screen or `Home` / `Movies` / `Shows` in Left Nav | Full-bleed 16:9 widescreen hero billboard with auto-rotating/scrubbable spotlight + horizontal D-pad swimlanes (Continue Watching / Downloads, Watchlist, Trakt Trending Top 10, Now Playing, Collections, Honors) + Country/Service/Language filter pills | `TvHeroBillboard`, `TvFilterPills`, `TvContentRail`, `TvPosterCard`, `TvRankedCard` | loading skeletons, filled, filtered, empty watchlist, error retry |
| S03 | Title Detail & Stream Hub | Select any card on any screen | HBO Max / Netflix TV full-bleed 16:9 backdrop detail stage with multi-critic scorecard (IMDb, RT, Metacritic), Plot, Awards modal, Where to Watch providers, 1-Click Play Best Swarm, Peer Release Picker (4K/1080p/Seeders), Offline Download, Trailer modal, Cast & Crew rail, Based-On source material, Franchise rail, and Similar Titles rail | `TvDetailHero`, `TvScorecardRow`, `TvStreamHubModal`, `TvPersonRail`, `TvContentRail`, `TvTrailerModal` | loading skeleton, resolved movie, resolved TV series, swarm searching, active download, error |
| S04 | TV Series Season & Episode Browser | Select "Episodes & Seasons" or any Season tab on S03 | Interactive 10-foot Season selector + Season Pack Binge/Download bar + Episode cards with 16:9 stills, air date, runtime, rating, plot, 1-click Episode Play, Source Picker, and Episode Download | `TvSeasonTabs`, `TvSeasonPackBar`, `TvEpisodeCard`, `TvEpisodeSourcesModal` | loading episodes, filled season, season pack resolving, episode downloading, empty/unaired |
| S05 | 10-Foot Split Search Studio | Select `Search` in Left Nav | BBC iPlayer / Netflix TV split-screen search: D-pad On-Screen Keyboard (A-Z, 0-9, Space, Backspace, Clear + voice/remote input) on the left; live-updating Poster Grid, Cast/Crew matches, Recent Titles, and Trending rails on the right | `TvOnScreenKeyboard`, `TvSearchInputBar`, `TvPosterGrid`, `TvPersonCard`, `TvContentRail` | idle (recent + trending), typing/loading, live matches, no matches |
| S06 | Multi-Facet Discover Studio | Select `Discover` in Left Nav | 10-foot filter bar for Movies vs Shows, Sort Order, Genres (include/exclude), Streaming Services & Region, Language, Release Year/Decade, Min Rating, and TV Status, driving a 6-column 10-foot poster grid with pagination | `TvDiscoverFilterBar`, `TvFilterModal`, `TvPosterGrid` | loading, filled grid, paginating next page, zero-match empty state |
| S07 | Franchises, Collections & IMDb Top 100 | Select `Collections` in Left Nav | Switch between 470+ Movie Franchises & Curated Collections swimlanes and IMDb Top 100 Movies / Top 100 TV Shows ranked gallery | `TvSubNavPills`, `TvFranchiseRail`, `TvRankedGrid`, `TvCollectionModal` | loading, franchises view, IMDb Top 100 Movies, IMDb Top 100 TV |
| S08 | Global Film & TV Awards Showcase | Select `Awards` in Left Nav | Dedicated 10-foot showcase of 47 Film Award Ceremonies (Oscars, Cannes, BAFTA, Venice, Berlinale...) and 40 Television Honors (Emmys, Golden Globes, Peabody, BAFTA TV...) with ceremony filter pills and winner rails | `TvAwardsHeader`, `TvCeremonyFilterRail`, `TvContentRail` | film honors, TV honors, all honors, filtered ceremony |
| S09 | Person Filmography Studio | Select any Cast / Director card on S03 or S05 | Actor / Director biography, portrait, career stats, and complete filmography swimlanes (Top Rated, Acting, Directing, Appearances) | `TvPersonHero`, `TvContentRail` | loading filmography, filled, empty |
| S10 | Watchlist, Downloads & Settings | Select `Watchlist`, `Downloads`, or `Settings` in Left Nav | 10-foot library grid with custom collection filters, active/completed 75 GB torrent downloads manager with speed/progress & 1-click play, API quota monitor (TMDb, Trakt, OMDb), and JSON backup/restore | `TvWatchlistGrid`, `TvDownloadCard`, `TvQuotaPanel`, `TvSettingsRow` | empty downloads, active downloading, completed offline ready, quota healthy/rate-limited |

## Flows

```
F01 Browse Home Hub and 1-Click Stream a Movie
    S01/S02 Home Hub -> D-pad Select Movie Card -> S03 Title Detail -> D-pad Select "Play Now (Best Stream)" -> Native Landscape Player (with auto English subtitles)
    happy path clicks: 2 (Select card -> Select Play)
    edge: 0 seeders warning, subtitle fallback fetch, player exit returns cleanly to S03 in landscape

F02 Browse TV Series Season & Play an Episode or Season Pack
    S02 Home/Shows -> S03 Series Detail -> S04 Season & Episode Browser -> Select Season tab -> Select Episode "Play" (or Season Pack Binge)
    happy path clicks: 3
    edge: multi-file torrent pack index resolution (`fileIdx`), unaired episode badge, offline downloaded episode

F03 10-Foot D-Pad Search for Title or Actor
    S01 Left Nav -> S05 Search Studio -> D-pad type query on on-screen keyboard -> Select live poster result (S03) or person (S09)
    happy path clicks: 4-6 D-pad presses
    edge: typo / zero matches state, clearing query returns to Recent & Trending

F04 Multi-Facet Discovery (Filter by Service, Genre, Language, Rating, Year)
    S01 Left Nav -> S06 Discover Studio -> Toggle Movies/Shows -> Select Genre / Streaming Service / Language / Rating chip -> Browse 6-column Poster Grid -> Select Title (S03)
    happy path clicks: 3
    edge: tri-state genre exclusion, narrowing to 0 results with 1-click Reset Filters

F05 Explore Global Film & TV Awards and Franchises
    S01 Left Nav -> S08 Awards (or S07 Collections) -> Filter by Ceremony (e.g. Academy Awards, Primetime Emmy, Cannes) or IMDb Top 100 -> Open Winner (S03)
    happy path clicks: 2
    edge: offline static catalog instant load (0 network latency)

F06 Manage Watchlist & Offline Downloads
    S03 Title Detail -> Toggle "+ Watchlist" or "Download Offline" -> S10 Watchlist / Downloads screen -> Play offline or manage 75 GB storage pool
    happy path clicks: 2
    edge: storage quota display, pause/resume/delete torrent download
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| `TvFocusable` | button, card, pill, nav-item, key | default, focused (2.5px gold ring + 1.06x scale + warm shadow), pressed, disabled, selected | all |
| `TvSidebar` | collapsed (76px icon rail), expanded (260px icon + label rail) | collapsed, expanded, active route highlighted | S01..S10 |
| `TvHeroBillboard` | home-spotlight, detail-backdrop | default, auto-cycling, focused CTA, loading | S02, S03 |
| `TvContentRail` | standard poster (2:3), wide backdrop (16:9), ranked Top 10, person avatar | loading, ready, empty, error | S02, S03, S05, S07, S08, S09 |
| `TvPosterCard` | standard (168x252), compact (148x222), grid (176x264), ranked | default, focused, bookmarked badge, rating badge, media-type badge | S02, S03, S05, S06, S07, S08, S09, S10 |
| `TvEpisodeCard` | horizontal 10-foot row with 16:9 still | default, focused, loading swarms, downloading, downloaded | S04 |
| `TvOnScreenKeyboard` | QWERTY / ABC grid + space/backspace/clear | key focused, key pressed | S05 |
| `TvModal` | stream-releases, season-episodes, filter-picker, awards-detail, trailer-webview | closed, open, loading | S03, S04, S06, S07 |

## Inferred data model

```
MediaItem          tmdbId, imdbId, mediaType ('movie' | 'tv'), title, originalTitle, year,
                   posterUrl, backdropUrl, overview, genres, rating, votes, runtimeMinutes,
                   originalLanguage, status, nextEpisode, watchProviders
                   evidence: src/lib/tmdb.js, src/lib/types.js
                   confidence: high

WatchlistEntry     id, tmdbId, mediaType, title, year, posterUrl, backdropUrl, rating,
                   collectionIds[], watched, addedAt
                   evidence: src/lib/watchlistModel.js, src/lib/storage.js
                   confidence: high

AwardCeremony      id, name, shortName, category ('movie' | 'tv'), items[] (winners with ceremony year & category)
                   evidence: src/data/awards_catalog.js, src/data/tv_awards_catalog.js, src/lib/awardsCatalog.js
                   confidence: high

PeerSwarmRelease   name, infoHash, magnetUrl, sizeBytes, seeders, peers, source, fileIdx,
                   attributes (resolution, codec, hdr, audio)
                   evidence: src/lib/torrentSearchEngine.js
                   confidence: high

OfflineDownload    id, infoHash, fileIdx, title, releaseName, mediaType, tmdbId, imdbId,
                   season, episode, state ('resolving'|'downloading'|'paused'|'completed'|'error'),
                   progress, speedBytesPerSec, totalBytes, downloadedBytes, cachedSubtitleUrl
                   evidence: src/lib/downloadManager.js, android-engine/main.go
                   confidence: high
```

Relationships: `Collection 1-n WatchlistEntry`, `TVSeries 1-n Season 1-n Episode`, `MediaItem 1-n PeerSwarmRelease`, `MediaItem 0-1 OfflineDownload`.

## Feature matrix

See `features.csv`. Must: 18, should: 10, could: 4, skip: 2, extras: 6.

## Out of scope (cannot or should not be cloned)

- Proprietary studio DRM catalogues (Netflix Originals, HBO Max, BBC licensed video streams) — marked `skip` in `features.csv`; Trova provides official deep-link / Where-to-Watch metadata plus user-initiated peer swarm / local media playback.
- Paid subscription billing & per-household account sharing locks — marked `skip`; Trova TV is 100% free, local-first, and ad-free with zero login wall.

## Size

Screens 10, flows 6, entities 5. Hard parts: Android TV D-pad spatial focus management across virtualized rails, dual-ABI (`armeabi-v7a` + `arm64-v8a`) Go `libtorrentstreamer.so` native compilation for Sony BRAVIA 4K TV, and landscape-locked video player integration with automatic subtitle loading. Size: M.
