import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
      <Text style={styles.title}>Settings</Text>

      <View style={styles.gridRow}>
        {/* Left Column: TV Platform & Playback Engine */}
        <View style={styles.card}>
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

          <View style={{ marginTop: 14, alignItems: 'flex-start' }}>
            <TvFocusable
              appearance="text"
              hasTVPreferredFocus={true}
              onPress={onClearRecent}
              scaleOnFocus={1.04}
              borderRadius={8}
              style={styles.actionBtn}
            >
              {({ focused }) => (
                <Text style={[styles.actionBtnText, focused && styles.textFocused]}>
                  Clear Recently Viewed History
                </Text>
              )}
            </TvFocusable>
          </View>
        </View>

        {/* Right Column: Live API Quota Telemetry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Live API Status</Text>

          {providers.map((p) => {
            const line =
              formatQuotaLine(p.state) ||
              (p.state?.lastUpdated
                ? 'Healthy — active session responses nominal'
                : 'Ready — awaiting first query');
            return (
              <View key={p.key} style={styles.quotaBlock}>
                <Text style={styles.quotaName}>{p.name}</Text>
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
    paddingTop: 14,
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
    gap: 32,
  },
  card: {
    flex: 1,
    paddingVertical: 8,
  },
  cardTitle: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.railTitle,
    fontWeight: '700',
    marginBottom: 14,
  },
  kvRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  kvKey: {
    color: '#ABA59B',
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
    justifyContent: 'center',
    minHeight: TV_SPACE.targetMin,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionBtnText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontSize: TV_TYPE.meta,
    fontWeight: '700',
  },
  textFocused: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  quotaBlock: {
    paddingVertical: 10,
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
