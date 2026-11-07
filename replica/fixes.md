# Entrepreneur Fix Plan & Positioning: Trova TV (`replica-entrepreneur`)

Sample size: 79 real verbatim reviews across App Store and Hacker News (`replica/reviews.csv` -> `replica/feedback.md`).

## 1. What They Hate (Ranked by Evidence)
1. **Sluggish smart TV navigation, lag, and crashes** (12 reviews, 2 sources, avg 1.9★)
   - Verbatim: `"Netflix UI ruins such a major factor of owning and shelling out the money for an Apple TV."` (https://apps.apple.com/us/app/id363590051)
2. **Fake % match scores instead of real IMDb / Rotten Tomatoes ratings** (10 reviews, 2 sources, avg 2.2★)
   - Verbatim: `"I wish Netflix would integrate IMDB and Rotten Tomatoes ratings and allow you to filter."` (https://news.ycombinator.com/item?id=34844287)
3. **Catalog fragmentation across too many streaming apps** (9 reviews, 2 sources, avg 1.9★)
   - Verbatim: `"How much more can you make these apps miserable?"` (https://apps.apple.com/us/app/id363590051)
4. **Intrusive auto-playing trailer audio while browsing** (9 reviews, avg 2.0★)
   - Verbatim: `"Maybe he means like autoplaying trailers when hovering over a title on the Apple TV?"` (https://news.ycombinator.com/item?id=20466012)
5. **Price hikes, ad tiers, and household IP blocks** (8 reviews, 2 sources, avg 2.6★)
   - Verbatim: `"Why do you need so much more ads?"` (https://apps.apple.com/us/app/id363590051)

## 2. What Is Missing
- Real multi-critic scorecards (IMDb + Rotten Tomatoes + Metacritic) directly on the TV detail page and filterable in Discover.
- Unified cross-service Where-to-Watch availability combined with 1-click direct stream & download playback.
- Browsable archive of all 87 Global Film & Television Award Ceremonies and 470+ complete Film Franchises.

## 3. What Is Unsolved
- Cinephiles on 4K Smart TVs are forced to juggle 8 separate laggy apps, endure auto-playing trailer noise, and still cannot filter by real IMDb rating, original language, decade, or festival awards.

## 4. The Fix Plan (Implemented in Trova TV)
1. **Silent Widescreen Hero Billboard (`TvHeroBillboard.js`)** — Size: S (`replica-build`). Zero auto-playing audio when navigating with D-pad; trailers play only when the user clicks `Trailer`.
2. **Real Multi-Critic Scorecard (`TvDetailScreen.js`)** — Size: S (`replica-build`). Shows verified IMDb, Rotten Tomatoes, Metacritic, and TMDb scores side by side.
3. **Unified Where-to-Watch + 1-Click Peer Swarm Playback (`TvDetailScreen.js` + `streamLauncher.js`)** — Size: M (`replica-build` / `replica-backend`). Shows official streaming providers AND 1-click 1080p/4K swarm streaming + 75 GB offline downloads.
4. **Automatic English Subtitle Resolution (`android-engine` + `TrovaPlayerActivity.kt`)** — Size: M (`replica-backend`). Fetches and renders UTF-8 `.srt` subtitles automatically.
5. **87 Global Film & TV Honors + 470+ Franchises (`TvAwardsScreen.js`, `TvCollectionsScreen.js`)** — Size: S (`replica-build`). Instant zero-latency local catalog browsing.

## 5. Positioning Angle
> For living-room film & television lovers who hate juggling eight laggy, ad-stuffed streaming apps that hide real ratings behind noisy auto-playing trailers, **Trova TV** is the 10-foot cinema programme that unites every streaming service, 87 global award ceremonies, real IMDb/Rotten Tomatoes/Metacritic scores, and instant 1-click 4K/1080p playback on your TV.
