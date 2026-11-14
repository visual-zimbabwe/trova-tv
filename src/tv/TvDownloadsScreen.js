import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { useDownloads } from '../lib/downloadManager';
import { TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * S10b: 10-Foot Offline Downloads & 75 GB Local Storage Pool Manager.
 */
export function TvDownloadsScreen({ onNavigateTab }) {
  const {
    downloads = [],
    usedBytes = 0,
    maxBytes = 75 * 1024 * 1024 * 1024,
    pauseDownload,
    resumeDownload,
    deleteDownload,
    playDownloaded,
    formatBytes,
    formatSpeed,
  } = useDownloads();

  const usagePct = Math.min(100, Math.round((usedBytes / (maxBytes || 1)) * 100));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.title}>Downloads ({downloads.length})</Text>

        <View style={styles.storageBox}>
          <Text style={styles.storageLabel}>
            Used: {formatBytes(usedBytes)} / {formatBytes(maxBytes)} ({usagePct}%)
          </Text>
          <View style={styles.gaugeTrack}>
            <View style={[styles.gaugeFill, { width: `${usagePct}%` }]} />
          </View>
        </View>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No offline downloads yet</Text>
          <Text style={styles.emptySub}>
            Open any Movie or TV Episode and select “Download” to save high-bitrate video
            directly to your TV storage for zero-buffering playback.
          </Text>
          <TvFocusable
            appearance="text"
            hasTVPreferredFocus={true}
            onPress={() => onNavigateTab?.('home')}
            scaleOnFocus={1.04}
            borderRadius={8}
            style={styles.browseBtn}
          >
            {({ focused }) => (
              <Text style={[styles.browseBtnText, focused && styles.textFocused]}>
                Browse Programme
              </Text>
            )}
          </TvFocusable>
        </View>
      ) : (
        <View style={styles.listWrap}>
          {downloads.map((dl, idx) => {
            const pct = Math.round((dl.progress || 0) * 100);
            return (
              <View key={dl.id || idx} style={styles.dlCard}>
                <MediaArtwork
                  uri={dl.posterUrl}
                  title={dl.title}
                  variant="poster"
                  style={styles.poster}
                />

                <View style={styles.dlInfo}>
                  <Text numberOfLines={1} style={styles.dlTitle}>
                    {dl.title}
                  </Text>
                  <Text numberOfLines={1} style={styles.dlRelease}>
                    {dl.releaseName}
                  </Text>
                  <Text style={styles.dlStatus}>
                    {String(dl.state || 'downloading').toUpperCase()} · {pct}% ·{' '}
                    {formatBytes(dl.downloadedBytes || 0)} / {formatBytes(dl.totalBytes || 0)}
                    {dl.state === 'downloading' ? ` · ${formatSpeed(dl.speed || 0)}` : ''}
                  </Text>
                  <View style={styles.dlTrack}>
                    <View style={[styles.dlFill, { width: `${pct}%` }]} />
                  </View>
                </View>

                <View style={styles.dlActions}>
                  <TvFocusable
                    appearance="text"
                    hasTVPreferredFocus={idx === 0}
                    onPress={() => playDownloaded(dl)}
                    scaleOnFocus={1.04}
                    borderRadius={6}
                    style={styles.goldBtn}
                  >
                    {({ focused }) => (
                      <Text style={[styles.goldBtnText, focused && styles.textFocused]}>Play</Text>
                    )}
                  </TvFocusable>

                  {dl.state === 'downloading' ? (
                    <TvFocusable
                      appearance="text"
                      onPress={() => pauseDownload(dl.id)}
                      scaleOnFocus={1.04}
                      borderRadius={6}
                      style={styles.outlineBtn}
                    >
                      {({ focused }) => (
                        <Text style={[styles.outlineBtnText, focused && styles.textFocused]}>
                          Pause
                        </Text>
                      )}
                    </TvFocusable>
                  ) : dl.state === 'paused' ? (
                    <TvFocusable
                      appearance="text"
                      onPress={() => resumeDownload(dl.id)}
                      scaleOnFocus={1.04}
                      borderRadius={6}
                      style={styles.outlineBtn}
                    >
                      {({ focused }) => (
                        <Text style={[styles.outlineBtnText, focused && styles.textFocused]}>
                          Resume
                        </Text>
                      )}
                    </TvFocusable>
                  ) : null}

                  <TvFocusable
                    appearance="text"
                    onPress={() => deleteDownload(dl.id)}
                    scaleOnFocus={1.04}
                    borderRadius={6}
                    style={styles.outlineBtn}
                  >
                    {({ focused }) => (
                      <Text
                        style={[
                          styles.outlineBtnText,
                          { color: '#FF6961' },
                          focused && styles.textFocused,
                        ]}
                      >
                        Delete
                      </Text>
                    )}
                  </TvFocusable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#040301',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 64,
    paddingHorizontal: TV_SPACE.overscanX,
    paddingTop: 14,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  storageBox: {
    width: 280,
  },
  storageLabel: {
    color: '#D8D2C7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    marginBottom: 6,
  },
  gaugeTrack: {
    backgroundColor: '#25211B',
    borderRadius: 4,
    height: 4,
    overflow: 'hidden',
  },
  gaugeFill: {
    backgroundColor: GOLD_ACCENT,
    height: '100%',
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 24,
    padding: 40,
  },
  emptyTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    lineHeight: 21,
    marginTop: 6,
    maxWidth: 540,
    textAlign: 'center',
  },
  browseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  browseBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.button,
    fontWeight: '800',
  },
  textFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  listWrap: {
    gap: 14,
  },
  dlCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 18,
    paddingVertical: 12,
  },
  poster: {
    borderRadius: 8,
    height: 96,
    width: 64,
  },
  dlInfo: {
    flex: 1,
  },
  dlTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.body,
    fontWeight: '700',
  },
  dlRelease: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    marginTop: 2,
  },
  dlStatus: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    marginBottom: 6,
    marginTop: 4,
  },
  dlTrack: {
    backgroundColor: '#25211B',
    borderRadius: 4,
    height: 4,
    overflow: 'hidden',
  },
  dlFill: {
    backgroundColor: GOLD_ACCENT,
    height: '100%',
  },
  dlActions: {
    flexDirection: 'row',
    gap: 12,
  },
  goldBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  goldBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  outlineBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  outlineBtnText: {
    color: '#D8D2C7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
});
