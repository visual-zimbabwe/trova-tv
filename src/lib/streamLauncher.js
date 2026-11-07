import { AppState, Linking, NativeModules, Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';
import * as ScreenOrientation from 'expo-screen-orientation';
import { trovaToast as toastiva } from './trovaToast';

const { TorrentStreamerModule } = NativeModules;

let activePlayerCleanup = null;

/**
 * Launches a stream on Android TV in landscape orientation (using the built-in
 * 10-foot TrovaPlayerActivity or mpv-android), keeping landscape orientation
 * locked at all times on TV.
 */
export async function launchStream({
  magnetUrl,
  title,
  mediaTitle,
  originalTitle,
  year,
  tmdbId,
  fileIdx,
  imdbId,
  season,
  episode,
  downloadId,
  cachedSubtitleUrl,
}) {
  if (!magnetUrl && !downloadId) return false;

  if (Platform.OS === 'android') {
    let streamUrl;
    if (downloadId) {
      streamUrl = `http://127.0.0.1:8899/download/play?id=${encodeURIComponent(downloadId)}`;
    } else {
      streamUrl = `http://127.0.0.1:8899/stream?magnet=${encodeURIComponent(magnetUrl)}`;
      if (typeof fileIdx === 'number') {
        streamUrl += `&fileIdx=${fileIdx}`;
      }
    }

    toastiva.info('Starting TV stream & resolving English subtitles...');

    if (TorrentStreamerModule?.startService) {
      try {
        await TorrentStreamerModule.startService(mediaTitle || title || 'Trova TV Stream');
      } catch (serviceErr) {
        console.log('[launchStream] Foreground service start error:', serviceErr);
      }
    }

    let preloadPromise = Promise.resolve();
    if (!downloadId && magnetUrl) {
      try {
        const preloadController = new AbortController();
        const preloadTimeout = setTimeout(() => preloadController.abort(), 1500);
        preloadPromise = fetch(
          `http://127.0.0.1:8899/preload?magnet=${encodeURIComponent(magnetUrl)}`,
          { signal: preloadController.signal },
        )
          .catch(() => {})
          .finally(() => clearTimeout(preloadTimeout));
      } catch {
        // Preload is opportunistic
      }
    }

    let subtitleUrl = cachedSubtitleUrl || null;
    const hasEnglishSubs = /\b(esub|esubs|eng\.sub|english\.sub|en\.sub)\b/i.test(title || '');
    if (!subtitleUrl && !hasEnglishSubs && (imdbId || mediaTitle || title)) {
      try {
        const cleanImdb = imdbId ? String(imdbId).trim() : '';
        const params = [];
        if (cleanImdb) params.push(`imdb=${encodeURIComponent(cleanImdb)}`);
        if (season != null) params.push(`season=${season}`);
        if (episode != null) params.push(`episode=${episode}`);
        if (title) params.push(`title=${encodeURIComponent(title)}`);
        if (mediaTitle) params.push(`mediaTitle=${encodeURIComponent(mediaTitle)}`);
        if (originalTitle) params.push(`originalTitle=${encodeURIComponent(originalTitle)}`);
        if (tmdbId) params.push(`tmdbId=${encodeURIComponent(String(tmdbId))}`);
        if (year) params.push(`year=${encodeURIComponent(String(year))}`);

        const query = `http://127.0.0.1:8899/fetch-subtitle?${params.join('&')}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const subRes = await fetch(query, { signal: controller.signal }).catch(() => null);
        clearTimeout(timeoutId);

        if (subRes && subRes.ok) {
          const data = await subRes.json().catch(() => null);
          if (data?.status && data?.url) {
            subtitleUrl = data.url;
          }
        }
      } catch (subErr) {
        console.log('[launchStream] Subtitle fetch error:', subErr);
      }
    }

    await preloadPromise;

    if (activePlayerCleanup) {
      await activePlayerCleanup();
    }

    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    } catch {
      // Already in landscape on TV
    }

    let hasLeftTrova = AppState.currentState !== 'active';
    let cleanupDone = false;
    let appStateSub = null;

    const cleanup = async () => {
      if (cleanupDone) return;
      cleanupDone = true;
      if (appStateSub) {
        appStateSub.remove();
        appStateSub = null;
      }
      if (activePlayerCleanup === cleanup) {
        activePlayerCleanup = null;
      }
      // Keep TV locked in LANDSCAPE (never revert to PORTRAIT_UP on TV)
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {
        // Ignored
      }
      if (TorrentStreamerModule?.stopService) {
        try {
          const statusRes = await fetch('http://127.0.0.1:8899/download/status').catch(() => null);
          const statusJson = statusRes ? await statusRes.json().catch(() => null) : null;
          if (!statusJson || !(Number(statusJson.activeCount) > 0)) {
            await TorrentStreamerModule.stopService();
          }
        } catch {
          // Ignored
        }
      }
    };

    activePlayerCleanup = cleanup;

    appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        hasLeftTrova = true;
      } else if (nextState === 'active' && hasLeftTrova) {
        cleanup();
      }
    });

    let playerLaunched = false;

    if (TorrentStreamerModule?.launchPlayer) {
      try {
        await TorrentStreamerModule.launchPlayer(
          streamUrl,
          mediaTitle || title || 'Trova TV Stream',
          subtitleUrl,
        );
        playerLaunched = true;
      } catch (launchErr) {
        console.log('[launchStream] Native player launch failed, falling back:', launchErr);
      }
    }

    if (!playerLaunched) {
      const intentExtra = {
        title: mediaTitle || title || 'Trova TV Stream',
      };
      if (subtitleUrl) {
        intentExtra.subs = [subtitleUrl];
        intentExtra['subs.enable'] = [subtitleUrl];
        intentExtra.subtitles_location = subtitleUrl;
      }

      try {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: streamUrl,
          type: 'video/*',
          packageName: 'is.xyz.mpv',
          className: 'is.xyz.mpv.MPVActivity',
          extra: intentExtra,
        });
        playerLaunched = true;
      } catch {
        try {
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: streamUrl,
            type: 'video/*',
            extra: intentExtra,
          });
          playerLaunched = true;
        } catch {
          // Fall through
        }
      }
    }

    if (playerLaunched) {
      return true;
    }

    await cleanup();
  }

  try {
    const supported = await Linking.canOpenURL(magnetUrl);
    if (supported) {
      await Linking.openURL(magnetUrl);
      return true;
    }
  } catch {
    // Ignored
  }

  toastiva.info('Unable to launch video player');
  return false;
}
