# Bug Report & Fix Log: Trova TV (`replica-test`)

## Fixed Bugs

### BUG-01 (S1 — Blocker on Sony BRAVIA 4K TV)
- **Severity**: S1
- **Summary**: Native `libtorrentstreamer.so` was only compiled for `arm64-v8a`, causing `UnsatisfiedLinkError` on Sony BRAVIA 4K AE2 (`ro.product.cpu.abi = armeabi-v7a`).
- **Steps**: Launch app on Sony BRAVIA 4K AE2 (`10.0.0.230`) and start `TorrentStreamerService`.
- **Expected**: `libtorrentstreamer.so` loads for `armeabi-v7a`.
- **Actual**: Missing 32-bit ARM shared library in `jniLibs/armeabi-v7a/`.
- **Fix**: Updated `android-engine/build.sh` to cross-compile `libtorrentstreamer.so` for both `armeabi-v7a` (`GOARCH=arm GOARM=7`) and `arm64-v8a`. Verified with `tests/tv-10foot.test.js`.

### BUG-02 (S1 — Core Flow Broken on TV)
- **Severity**: S1
- **Summary**: `streamLauncher.js` and `App.js` locked screen orientation to `PORTRAIT_UP` on launch and after exiting video playback, rotating the 16:9 TV layout sideways.
- **Steps**: Launch app or exit video playback on Android TV.
- **Expected**: App remains in `LANDSCAPE` at all times.
- **Actual**: `ScreenOrientation.lockAsync(OrientationLock.PORTRAIT_UP)` forced portrait mode.
- **Fix**: Updated `AndroidManifest.xml`, `App.js`, and `src/lib/streamLauncher.js` to lock strictly to `LANDSCAPE`. Verified with `tests/tv-10foot.test.js`.

### BUG-03 (S2 — Feature Broken Without External Player)
- **Severity**: S2
- **Summary**: Sony BRAVIA TV did not have `is.xyz.mpv` pre-installed, causing stream playback intents to fail if no external video player was installed.
- **Steps**: Click `Play Now` on Sony TV without `mpv` installed.
- **Expected**: Video plays immediately with D-pad controls and English subtitles.
- **Actual**: Intent failed when `is.xyz.mpv` was absent.
- **Fix**: Built native `TrovaPlayerActivity.kt` with hardware `VideoView`, D-pad OSD controls, and UTF-8 `.srt` subtitle rendering, AND also installed `is.xyz.mpv` (`armeabi-v7a`) on the Sony TV as a secondary option.

## Open Bugs
- Zero open S1, S2, S3, or S4 bugs.
