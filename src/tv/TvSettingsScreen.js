import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { TV_SPACE, TV_TYPE } from './tvTheme';
import {
  formatQuotaLine,
  getRateQuotaSnapshot,
  subscribeRateQuota,
} from '../lib/apiRateQuota';

/**
 * S10c: 10-Foot Settings, API Telemetry & System Information Screen.
 */
export function TvSettingsScreen({
  watchlistCount = 0,
  collectionsCount = 0,
  onClearRecent,
}) {
  const [quota, setQuota] = useState(getRateQuotaSnapshot);

  useEffect(() => subscribeRateQuota(setQuota), []);

  const providers = [
    { key: 'tmdb', name: 'TMDb Metadata & Discovery API', state: quota.tmdb },
    { key: 'trakt', name: 'Trakt Community Pulse API', state: quota.trakt },
    { key: 'omdb', name: 'OMDb Multi-Critic Scorecard API', state: quota.omdb },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>SYSTEM & TELEMETRY</Text>
      <Text style={styles.title}>Trova TV Settings</Text>

      <View style={styles.gridRow}>
        {/* Left Card: TV Platform & Playback Engine */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>10-FOOT HARDWARE PROFILE</Text>
          <Text style={styles.cardTitle}>Sony BRAVIA 4K TV Edition</Text>

          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Streaming Engine</Text>
            <Text style={styles.kvVal}>Go Torrent Swarm Server (127.0.0.1:8899)</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Native ABIs</Text>
            <Text style={styles.kvVal}>armeabi-v7a & arm64-v8a</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Video Players</Text>
            <Text style={styles.kvVal}>TrovaPlayerActivity (D-Pad OSD) + mpv-android</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Auto Subtitles</Text>
            <Text style={styles.kvVal}>English UTF-8 SRT (OpenSubtitles / Subdl / Podnapisi)</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvKey}>Saved Library</Text>
            <Text style={styles.kvVal}>
              {watchlistCount} Titles across {collectionsCount} Collections
            </Text>
          </View>

          <View style={{ marginTop: 14 }}>
            <TvFocusable
              hasTVPreferredFocus={true}
              onPress={onClearRecent}
              scaleOnFocus={1.04}
              borderRadius={10}
              style={styles.actionBtn}
            >
              <View style={styles.btnInner}>
                <Ionicons name="trash-outline" size={15} color={GOLD_ACCENT} />
                <Text style={styles.actionBtnText}>Clear Recently Viewed History</Text>
              </View>
            </TvFocusable>
          </View>
        </View>

        {/* Right Card: Live API Quota Telemetry */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>PROVIDER QUOTA TELEMETRY</Text>
          <Text style={styles.cardTitle}>Live API Status</Text>

          {providers.map((p) => {
            const line =
              formatQuotaLine(p.state) ||
              (p.state?.lastUpdated
                ? 'Healthy — active session responses nominal'
                : 'Ready — awaiting first query');
            return (
              <View key={p.key} style={styles.quotaBlock}>
                <View style={styles.quotaHeader}>
                  <Ionicons
                    name={p.state?.rateLimitedAt ? 'warning' : 'checkmark-circle'}
                    size={15}
                    color={p.state?.rateLimitedAt ? '#FF6961' : '#4CD964'}
                  />
                  <Text style={styles.quotaName}>{p.name}</Text>
                </View>
                <Text style={styles.quotaDetail}>{line}</Text>
              </View>
            );
          })}
        </View>
      </View>
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
    marginBottom: 18,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  card: {
    backgroundColor: '#0D0B07',
    borderColor: '#25211B',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: 20,
  },
  cardEyebrow: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  cardTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
    marginBottom: 14,
  },
  kvRow: {
    borderBottomColor: '#191610',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  kvKey: {
    color: '#C7C1B7',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.meta,
  },
  kvVal: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '600',
  },
  actionBtn: {
    alignItems: 'center',
    backgroundColor: '#191610',
    borderColor: 'rgba(212, 168, 83, 0.4)',
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  btnInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  quotaBlock: {
    borderBottomColor: '#191610',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  quotaHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  quotaName: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.cardTitle,
    fontWeight: '700',
  },
  quotaDetail: {
    color: '#C7C1B7',
    fontFamily: fonts.body,
    fontSize: TV_TYPE.meta,
    marginTop: 4,
  },
});
