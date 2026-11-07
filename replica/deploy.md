# Replica Phase 11 — Deploy & Live Sony BRAVIA 4K TV Verification (`replica-deploy`)

## 1. Target Device & Environment

| Attribute | Value |
|---|---|
| **Target Device** | Sony BRAVIA 4K TV (`BRAVIA_4K_AE2`, Android 14 / SDK 34) |
| **ADB Endpoint** | `10.0.0.230:42547` (`adb-126827004004112B0000B564504-tPX7p4._adb-tls-connect._tcp`) |
| **CPU ABI** | `armeabi-v7a,armeabi` (32-bit ARM userland on 4K TV panel) |
| **Display Panel** | Physical `3840x2160` (4K UHD) / Surface `1920x1080` @ `320 dpi` (`960x540 dp` 16:9 viewport) |
| **App Package** | `kkadogo.findstreamer.com` (**Trova TV**) |
| **Companion Player** | Built-in `TrovaPlayerActivity` + `is.xyz.mpv` (`mpv-android` `armeabi-v7a`) |
| **Native Engine** | `libtorrentstreamer.so` (Go `anacrolix/torrent` + OpenSubtitles/SubDL/Podnapisi SRT sidecar engine, compiled for both `armeabi-v7a` and `arm64-v8a`) |

---

## 2. Build & Installation Pipeline

```bash
# 1. Cross-compile Go native torrent + subtitle engine for both 32-bit and 64-bit ARM
cd ~/apps/trova/android-engine
ANDROID_NDK_HOME=/home/juwimana/Android/Sdk/ndk/27.1.12297006 ./build.sh

# 2. Run full 563-test suite (including 10-foot TV architecture & parity tests)
cd ~/apps/trova && npm test

# 3. Assemble dual-ABI release APK (armeabi-v7a + arm64-v8a)
cd ~/apps/trova/android
JAVA_HOME=/home/juwimana/.local/share/android-studio/jbr \
ANDROID_HOME=/home/juwimana/Android/Sdk \
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a

# 4. Install on Sony BRAVIA 4K TV (10.0.0.230:42547)
adb -s 10.0.0.230:42547 install -r ~/apps/trova/android/app/build/outputs/apk/release/app-release.apk
adb -s 10.0.0.230:42547 shell am start -n kkadogo.findstreamer.com/.MainActivity
```

---

## 3. Live Sony TV Verification & Captured 10-Foot Screens

All screens were navigated via Android TV D-pad keyevents (`DPAD_UP`, `DPAD_DOWN`, `DPAD_LEFT`, `DPAD_RIGHT`, `DPAD_CENTER`, `BACK`) on the Sony BRAVIA 4K TV (`10.0.0.230:42547`) with zero crashes (`adb -s 10.0.0.230:42547 logcat -b crash -d` empty):

| Screen ID | Screen Name | Captured Screenshot | Status |
|---|---|---|---|
| **S01** | Collapsible Left Navigation Rail (Expanded on Focus) | `replica/clone-screens/S01-sidebar.png` | Verified on Sony TV (`1920x1080`) |
| **S02** | 10-Foot Home Screen (16:9 Hero Billboard + Top 10 & Curated Swimlanes) | `replica/clone-screens/S02-home.png` | Verified on Sony TV (`1920x1080`) |
| **S03/S04** | Title Detail Dossier (Multi-Critic Scorecard + Peer Swarms + Cast & Crew) | `replica/clone-screens/S03-detail.png` | Verified on Sony TV (`1920x1080`) |
| **S05** | Split-Screen 10-Foot Search Studio (6x6 D-Pad Keyboard + Live Poster Grid) | `replica/clone-screens/S05-search.png` | Verified on Sony TV (`1920x1080`) |
| **S06** | Multi-Facet Discover Studio (Type, Sort, Rating, Language, Decade, Genre Chips) | `replica/clone-screens/S06-discover.png` | Verified on Sony TV (`1920x1080`) |
| **S07** | Franchises (2,671 Sagas) & IMDb Top 100 Films/Series Canon | `replica/clone-screens/S07-collections.png` | Verified on Sony TV (`1920x1080`) |
| **S08** | 87 Global Film & Television Awards Hub (Cannes, Oscars, Emmys, BAFTA...) | `replica/clone-screens/S08-awards.png` | Verified on Sony TV (`1920x1080`) |
| **S10** | Personal Watchlist, Offline Downloads & 10-Foot Settings | `replica/clone-screens/S10-watchlist.png` | Verified on Sony TV (`1920x1080`) |

---

## 4. Replica Verification Gate Summary

- **Design Contrast Audit (`contrast.py`)**: `16 pairs, 0 failing AA`
- **Feature Parity Gate (`parity.py`)**: `100.0 / 100 (18/18 must-haves done, 32/32 total features done)`
- **Entrepreneur Review Synthesis (`reviews.py`)**: `79 real verbatim reviews -> 6 concrete UX upgrades shipped`
- **Brand Sweep (`sweep.py`)**: `Clean (0 forbidden references in src/tv)`
- **Store Listing Validator (`listing.py`)**: `OK (0 errors)`
- **Automated Test Suite (`npm test`)**: `563 tests, 563 pass, 0 fail`
