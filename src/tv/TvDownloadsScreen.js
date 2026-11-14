import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
        <View>
          <Text style={styles.eyebrow}>OFFLINE CINEMA VAULT</Text>
          <Text style={styles.title}>Downloads & Storage ({downloads.length})</Text>
        </View>

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
          <Ionicons name="cloud-download-outline" size={42} color={GOLD_ACCENT} />
          <Text style={styles.emptyTitle}>No offline downloads yet</Text>
          <Text style={styles.emptySub}>
            Open any Movie or TV Episode and select “Download Offline” to save high-bitrate video
            directly to your TV storage for zero-buffering playback.
          </Text>
          <TvFocusable
            hasTVPreferredFocus={true}
            onPress={() => onNavigateTab?.('home')}
            scaleOnFocus={1.05}
            borderRadius={999}
            style={styles.browseBtn}
          >
            <Text style={styles.browseBtnText}>Browse Programme</Text>
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
                    {String(dl.state || 'downloading').toUpperCase()} • {pct}% •{' '}
                    {formatBytes(dl.downloadedBytes || 0)} / {formatBytes(dl.totalBytes || 0)}
                    {dl.state === 'downloading' ? ` • ${formatSpeed(dl.speed || 0)}` : ''}
                  </Text>
                  <View style={styles.dlTrack}>
                    <View style={[styles.dlFill, { width: `${pct}%` }]} />
                  </View>
                </View>

                <View style={styles.dlActions}>
                  <TvFocusable
                    hasTVPreferredFocus={idx === 0}
                    onPress={() => playDownloaded(dl)}
                    scaleOnFocus={1.05}
                    borderRadius={999}
                    style={styles.goldBtn}
                  >
                    <Text style={styles.goldBtnText}>Play</Text>
                  </TvFocusable>

                  {dl.state === 'downloading' ? (
                    <TvFocusable
                      onPress={() => pauseDownload(dl.id)}
                      scaleOnFocus={1.05}
                      borderRadius={999}
                      style={styles.outlineBtn}
                    >
                      <Text style={styles.outlineBtnText}>Pause</Text>
                    </TvFocusable>
                  ) : dl.state === 'paused' ? (
                    <TvFocusable
                      onPress={() => resumeDownload(dl.id)}
                      scaleOnFocus={1.05}
                      borderRadius={999}
                      style={styles.outlineBtn}
                    >
                      <Text style={styles.outlineBtnText}>Resume</Text>
                    </TvFocusable>
                  ) : null}

                  <TvFocusable
                    onPress={() => deleteDownload(dl.id)}
                    scaleOnFocus={1.05}
                    borderRadius={999}
                    style={styles.outlineBtn}
                  >
                    <Text style={[styles.outlineBtnText, { color: '#FF6961' }]}>Delete</Text>
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
    paddingTop: 20,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: TV_TYPE.h1,
    fontWeight: '800',
  },
  storageBox: {
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: 300,
  },
  storageLabel: {
    color: '#E6CD9C',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    marginBottom: 6,
  },
  gaugeTrack: {
    backgroundColor: '#25211B',
    borderRadius: 4,
    height: 6,
    overflow: 'hidden',
  },
  gaugeFill: {
    backgroundColor: GOLD_ACCENT,
    height: '100%',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 14,
    borderWidth: 1,
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
    backgroundColor: GOLD_ACCENT,
    justifyContent: 'center',
    marginTop: 20,
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  browseBtnText: {
    color: '#140F06',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.button,
    fontWeight: '800',
  },
  listWrap: {
    gap: 14,
  },
  dlCard: {
    alignItems: 'center',
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 18,
    padding: 14,
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
    height: 6,
    overflow: 'hidden',
  },
  dlFill: {
    backgroundColor: GOLD_ACCENT,
    height: '100%',
  },
  dlActions: {
    flexDirection: 'row',
    gap: 10,
  },
  goldBtn: {
    alignItems: 'center',
    backgroundColor: GOLD_ACCENT,
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  goldBtnText: {
    color: '#140F06',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '800',
  },
  outlineBtn: {
    alignItems: 'center',
    backgroundColor: '#191610',
    borderColor: '#312D27',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TV_SPACE.chipMin,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  outlineBtnText: {
    color: '#F5EEE1',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
});
