# Test Plan: Trova TV (`replica-test`)

## Flows Under Test

### F01: Browse Home Hub and 1-Click Stream a Movie
- **F01-H1 (Happy Path)**: Launch Trova TV (`LEANBACK_LAUNCHER`) -> Hero Billboard receives initial D-pad focus (`Watch Now`) -> Navigate down to Top 10 Trending / Watchlist rails -> Select a movie card -> `TvDetailScreen` opens with IMDb/RT/Metacritic scores -> Select `Play Now` -> `TrovaPlayerActivity` launches in landscape with automatic English subtitles.
- **F01-E1 (Edge: 0 Seeders)**: Swarm has 0 seeders -> Displays warning toast and allows picking an alternative release in `All Releases`.
- **F01-E2 (Edge: Player Exit Orientation)**: Press Back in video player -> Returns to `TvDetailScreen` in 16:9 `LANDSCAPE` without snapping to portrait.

### F02: Browse TV Series Season & Play Episode or Season Pack
- **F02-H1 (Happy Path)**: Select a TV Series -> `TvDetailScreen` loads Season 1 episodes -> Switch Season pill (`Season 2`) -> Select `Play` on Episode card -> Resolves episode torrent (`fileIdx`) and streams in landscape.
- **F02-E1 (Edge: Multi-Episode Season Pack)**: Select `Sources` on an episode -> Lists both single-episode swarms and multi-file season packs mapped to the exact episode `fileIdx`.

### F03: 10-Foot D-Pad Search for Title or Actor
- **F03-H1 (Happy Path)**: D-pad Left to expand `TvSidebar` -> Select `Search` -> Use 6x6 on-screen keyboard to spell `DUNE` -> Live Poster Grid and Cast row update on the right -> Select title or actor.
- **F03-E1 (Edge: Zero Matches)**: Enter gibberish string -> Displays clear empty state (`No matches found`) and `CLEAR` key resets back to Recent & Trending rails.

### F04: Multi-Facet Discovery
- **F04-H1 (Happy Path)**: Open `Discover` -> Toggle `Films` / `TV Series` -> Select `Highest Rated`, `8.0+`, `French`, or Genre chip -> 5-column poster grid updates -> Select `Load More Titles` at bottom.
- **F04-E1 (Edge: Tri-State Genre Exclusion)**: Click genre once to include, twice to exclude (`✕`), three times to clear; `Reset All Filters` restores default state.

### F05: Global Film & TV Awards (87 Ceremonies) and Franchises (470+ Collections)
- **F05-H1 (Happy Path)**: Open `Honors & Awards` -> Switch between `All Laureates (87)`, `Film Ceremonies (47)`, and `TV Honors (40)` -> Filter by ceremony -> Open winner.
- **F05-H2 (Happy Path)**: Open `Collections` -> Browse 470+ Film Franchises or switch to `IMDb Top 100 Films` / `IMDb Top 100 Series`.

### F06: Watchlist & 75 GB Offline Downloads
- **F06-H1 (Happy Path)**: Toggle `+ Watchlist` on `TvDetailScreen` -> Open `My Watchlist` from sidebar -> Item appears in grid -> Select `Download Offline` -> Track progress in `Downloads` screen.
