import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TvFocusable } from './TvFocusable';
import { MediaArtwork } from '../components/MediaArtwork';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { useDownloads } from '../lib/downloadManager';

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
    paddingBottom: 56,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  headerBlock: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  eyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
  title: {
    color: '#F5EEE1',
    fontFamily: fonts.display,
    fontSize: 24,
    fontWeight: '800',
  },
  storageBox: {
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: 260,
  },
  storageLabel: {
    color: '#D5BA8A',
    fontFamily: fonts.label,
    fontSize: 11,
    marginBottom: 5,
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
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: '#A39E94',
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 520,
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: GOLD_ACCENT,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  browseBtnText: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontSize: 13,
    fontWeight: '800',
  },
  listWrap: {
    gap: 10,
  },
  dlCard: {
    alignItems: 'center',
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    padding: 12,
  },
  poster: {
    borderRadius: 8,
    height: 90,
    width: 60,
  },
  dlInfo: {
    flex: 1,
  },
  dlTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: 15,
    fontWeight: '700',
  },
  dlRelease: {
    color: '#A39E94',
    fontFamily: fonts.body,
    fontSize: 11.5,
    marginTop: 2,
  },
  dlStatus: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 11,
    marginBottom: 6,
    marginTop: 4,
  },
  dlTrack: {
    backgroundColor: '#25211B',
    borderRadius: 4,
    height: 5,
    overflow: 'hidden',
  },
  dlFill: {
    backgroundColor: GOLD_ACCENT,
    height: '100%',
  },
  dlActions: {
    flexDirection: 'row',
    gap: 8,
  },
  goldBtn: {
    backgroundColor: GOLD_ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  goldBtnText: {
    color: '#1A1204',
    fontFamily: fonts.heading,
    fontSize: 12,
    fontWeight: '800',
  },
  outlineBtn: {
    backgroundColor: '#191610',
    borderColor: '#312D27',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  outlineBtnText: {
    color: '#F5EEE1',
    fontFamily: fonts.label,
    fontSize: 12,
    fontWeight: '600',
  },
});
