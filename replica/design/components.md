# Component Specifications: Trova TV (10-Foot Living-Room System)

## TvFocusable
- **variants**: `button-primary`, `button-secondary`, `button-ghost`, `card`, `pill`, `nav-item`, `key`
- **sizes**: `sm` (height 40px), `md` (height 48px), `lg` (height 56px), `card` (dynamic)
- **states**:
  - `default`: border `1px solid #312D27` (or transparent on cards), scale `1.0`
  - `focused`: border `2.5px solid #D4A853` (`focus-ring`), scale `1.05` (spring 140ms), elevation `10`, warm glow shadow `rgba(212, 168, 83, 0.35)`
  - `selected`: background `rgba(212, 168, 83, 0.18)` or solid `#D4A853` with `#1A1204` ink
  - `disabled`: opacity `0.42`, non-focusable
- **a11y**: Native Android TV `focusable={true}`, `hasTVPreferredFocus`, clear `accessibilityLabel` and `accessibilityRole="button"`
- **used on**: S01..S10

## TvSidebar
- **variants**: `collapsed` (width 78px), `expanded` (width 248px)
- **items**: Search, Home, Movies, TV Shows, Collections, Awards, Discover, Watchlist, Downloads, Settings
- **states**: collapsed icon-only with active gold indicator bar; expands smoothly when any sidebar item receives D-pad focus; shows `Trova` wordmark in `PlayfairDisplay_700Bold_Italic`
- **used on**: S01..S10

## TvHeroBillboard
- **variants**: `home-spotlight` (height 410px), `detail-hero` (height 460px)
- **states**: loading skeleton, filled with 16:9 high-res TMDb backdrop, multi-stop linear gradient scrim (`transparent -> #040301`), eyebrow badge (`FEATURED` / `HONORS` / `TRENDING`), title (`display` 44px), metadata row (Year, Runtime, Rating pill, Genres), 3-line synopsis, and D-pad action row (`Watch Now`, `More Info`, `+ Watchlist`, `Spotlight Next/Prev`)
- **used on**: S02, S03

## TvContentRail
- **variants**: `poster` (156x234 cards), `ranked` (Top 10 with giant gold outline numeral + poster), `backdrop` (260x146 16:9 cards), `person` (124x168 portrait cards)
- **states**: loading skeleton cards, ready (auto-scrolls horizontally to keep focused card centered in viewport), empty, error with D-pad `Retry` button
- **used on**: S02, S03, S05, S07, S08, S09

## TvPosterCard
- **variants**: `rail` (156x234), `grid` (166x249), `ranked` (200x234)
- **states**: default, focused (2.5px `#D4A853` border + 1.06x zoom + title brighten), bookmarked badge (`bookmark` gold pill in top-left), rating badge (`★ 8.4` in top-right)
- **used on**: S02, S03, S05, S06, S07, S08, S09, S10

## TvEpisodeCard
- **variants**: `horizontal-row` (220x124 16:9 episode still + metadata + action buttons)
- **states**: default, focused, resolving swarms, downloading (progress bar + speed), completed offline, unaired
- **used on**: S04

## TvOnScreenKeyboard
- **variants**: `alphanumeric-6col` (A-Z, 0-9, Space, Backspace, Clear, Search)
- **states**: key default, key focused (`#D4A853` fill with `#1A1204` text), key pressed
- **used on**: S05
