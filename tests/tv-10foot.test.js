import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

test('AndroidManifest declares Android TV LEANBACK_LAUNCHER, landscape lock, and TrovaPlayerActivity', () => {
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.match(manifest, /android\.intent\.category\.LEANBACK_LAUNCHER/);
  assert.match(manifest, /android\.software\.leanback/);
  assert.match(manifest, /android:screenOrientation="landscape"/);
  assert.match(manifest, /android:banner="@drawable\/tv_banner"/);
  assert.match(manifest, /\.TrovaPlayerActivity/);
});

test('Dual-ABI libtorrentstreamer.so binaries exist for Sony BRAVIA TV (armeabi-v7a) and arm64-v8a', () => {
  const armv7 = path.join(root, 'android/app/src/main/jniLibs/armeabi-v7a/libtorrentstreamer.so');
  const arm64 = path.join(root, 'android/app/src/main/jniLibs/arm64-v8a/libtorrentstreamer.so');
  assert.ok(fs.existsSync(armv7), 'armeabi-v7a/libtorrentstreamer.so must exist for Sony TV');
  assert.ok(fs.existsSync(arm64), 'arm64-v8a/libtorrentstreamer.so must exist');
  assert.ok(fs.statSync(armv7).size > 5_000_000, 'armeabi-v7a binary should be > 5MB');
});

test('streamLauncher and TrailerModal never lock back to PORTRAIT_UP on Android TV, and MainActivity enforces LANDSCAPE', () => {
  const launcher = read('src/lib/streamLauncher.js');
  assert.ok(
    !launcher.includes('OrientationLock.PORTRAIT_UP'),
    'TV streamLauncher must never lock to OrientationLock.PORTRAIT_UP',
  );
  assert.match(launcher, /OrientationLock\.LANDSCAPE/);

  const trailerModal = read('src/components/TrailerModal.js');
  assert.ok(
    !trailerModal.includes('OrientationLock.PORTRAIT_UP'),
    'TrailerModal must never lock to OrientationLock.PORTRAIT_UP on TV',
  );
  assert.ok(
    !trailerModal.includes('ScreenOrientation.unlockAsync'),
    'TrailerModal must never unlock orientation on TV',
  );
  assert.match(trailerModal, /OrientationLock\.LANDSCAPE/);

  const mainActivity = read('android/app/src/main/java/kkadogo/findstreamer/com/MainActivity.kt');
  assert.match(mainActivity, /override fun setRequestedOrientation/);
  assert.match(mainActivity, /ActivityInfo\.SCREEN_ORIENTATION_LANDSCAPE/);
});

test('10-foot TV surfaces expose TvFocusable D-pad navigation across all 10 screens', () => {
  const tvFiles = [
    'src/tv/TvFocusable.js',
    'src/tv/TvSidebar.js',
    'src/tv/TvHeroBillboard.js',
    'src/tv/TvPosterCard.js',
    'src/tv/TvContentRail.js',
    'src/tv/TvHomeScreen.js',
    'src/tv/TvDetailScreen.js',
    'src/tv/TvSearchScreen.js',
    'src/tv/TvDiscoverScreen.js',
    'src/tv/TvCollectionsScreen.js',
    'src/tv/TvAwardsScreen.js',
    'src/tv/TvFilmographyScreen.js',
    'src/tv/TvWatchlistScreen.js',
    'src/tv/TvDownloadsScreen.js',
    'src/tv/TvSettingsScreen.js',
    'src/tv/TvAppShell.js',
  ];

  for (const file of tvFiles) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} should exist`);
  }

  const focusableSource = read('src/tv/TvFocusable.js');
  assert.match(focusableSource, /hasTVPreferredFocus/);
  assert.match(focusableSource, /focusable=\{!disabled\}/);
});
