# Launch Plan: Trova TV (`replica-launch`)

1. **Preflight Gates**:
   - `npm test` (563/563 passing)
   - `contrast.py` (16/16 WCAG AA/AAA passing)
   - `parity.py` (100% must-haves & counted features done)
   - `sweep.py` (0 hits for competitor names, domains, or brand colors)
   - `listing.py` (0 errors on App Store & Google Play metadata)
2. **Target Hardware Rollout**:
   - Build dual-ABI (`armeabi-v7a` + `arm64-v8a`) release APK via `./gradlew assembleRelease`.
   - Install `is.xyz.mpv` (`armeabi-v7a`) and `Trova TV` (`kkadogo.findstreamer.com`) onto Sony BRAVIA 4K TV (`10.0.0.230`).
   - Verify 10-foot D-pad navigation and live rendering on the Sony TV.
