import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';

export const TV_NAV_ITEMS = [
  { key: 'search', label: 'Search', icon: 'search-outline', activeIcon: 'search' },
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { key: 'movies', label: 'Movies', icon: 'film-outline', activeIcon: 'film' },
  { key: 'tv', label: 'TV Shows', icon: 'tv-outline', activeIcon: 'tv' },
  { key: 'collections', label: 'Collections', icon: 'albums-outline', activeIcon: 'albums' },
  { key: 'awards', label: 'Honors', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'discover', label: 'Discover', icon: 'compass-outline', activeIcon: 'compass' },
  { key: 'watchlist', label: 'Watchlist', icon: 'bookmark-outline', activeIcon: 'bookmark' },
  {
    key: 'downloads',
    label: 'Downloads',
    icon: 'cloud-download-outline',
    activeIcon: 'cloud-download',
  },
  { key: 'settings', label: 'Settings', icon: 'settings-outline', activeIcon: 'settings' },
];

/**
 * 10-Foot Collapsible Left Navigation Rail.
 * Seamless, borderless design that integrates cleanly with the 10-foot dark canvas.
 */
export function TvSidebar({
  activeTab = 'home',
  onSelectTab,
  watchlistCount = 0,
  activeDownloadCount = 0,
}) {
  const [focusedKey, setFocusedKey] = useState(null);
  const expanded = Boolean(focusedKey);

  return (
    <View style={[styles.sidebar, expanded ? styles.sidebarExpanded : styles.sidebarCollapsed]}>
      {/* Brand Wordmark */}
      <View style={styles.brandHeader}>
        <View style={styles.brandDiamond}>
          <Text style={styles.brandMonogram}>T</Text>
        </View>
        {expanded ? <Text style={styles.brandWordmark}>Trova</Text> : null}
      </View>

      {/* Navigation Items */}
      <View style={styles.navList}>
        {TV_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const badge =
            item.key === 'downloads' && activeDownloadCount > 0
              ? String(activeDownloadCount)
              : item.key === 'watchlist' && watchlistCount > 0
                ? String(watchlistCount)
                : null;

          return (
            <TvFocusable
              key={item.key}
              onFocus={() => setFocusedKey(item.key)}
              onBlur={() => setFocusedKey((prev) => (prev === item.key ? null : prev))}
              onPress={() => onSelectTab?.(item.key)}
              scaleOnFocus={1.03}
              borderRadius={12}
              focusBackgroundColor="rgba(212, 168, 83, 0.16)"
              style={[
                styles.navItem,
                isActive && !focusedKey ? styles.navItemActiveCollapsed : null,
                isActive && expanded ? styles.navItemActiveExpanded : null,
              ]}
              accessibilityLabel={item.label}
            >
              {({ focused }) => (
                <View style={styles.navItemInner}>
                  <View style={styles.iconWrap}>
                    <Ionicons
                      name={isActive || focused ? item.activeIcon : item.icon}
                      size={20}
                      color={isActive || focused ? GOLD_ACCENT : '#8E887E'}
                    />
                    {isActive && !expanded ? <View style={styles.activeDot} /> : null}
                  </View>
                  {expanded ? (
                    <View style={styles.labelRow}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.navLabel,
                          (isActive || focused) && styles.navLabelActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                      {badge ? (
                        <View style={styles.badgePill}>
                          <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              )}
            </TvFocusable>
          );
        })}
      </View>

      {/* Footer Status */}
      <View style={styles.footer}>
        {expanded ? <Text style={styles.footerText}>TROVA 4K TV</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    backgroundColor: '#070503',
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 18,
    zIndex: 50,
  },
  sidebarCollapsed: {
    paddingHorizontal: 10,
    width: 68,
  },
  sidebarExpanded: {
    paddingHorizontal: 14,
    width: 218,
  },
  brandHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: 38,
    paddingHorizontal: 6,
  },
  brandDiamond: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 83, 0.16)',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  brandMonogram: {
    color: GOLD_ACCENT,
    fontFamily: fonts.wordmark,
    fontSize: 18,
    fontWeight: '700',
  },
  brandWordmark: {
    color: '#F5EEE1',
    fontFamily: fonts.wordmark,
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  navList: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
  },
  navItem: {
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  navItemActiveCollapsed: {
    backgroundColor: 'rgba(212, 168, 83, 0.10)',
  },
  navItemActiveExpanded: {
    backgroundColor: 'rgba(212, 168, 83, 0.12)',
  },
  navItemInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  iconWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    position: 'relative',
    width: 24,
  },
  activeDot: {
    backgroundColor: GOLD_ACCENT,
    borderRadius: 3,
    bottom: -3,
    height: 4,
    position: 'absolute',
    width: 12,
  },
  labelRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navLabel: {
    color: '#8E887E',
    fontFamily: fonts.label,
    fontSize: 14,
    fontWeight: '600',
  },
  navLabelActive: {
    color: '#F5EEE1',
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  badgePill: {
    backgroundColor: 'rgba(212, 168, 83, 0.20)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  badgeText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  footerText: {
    color: '#8E887E',
    fontFamily: fonts.label,
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});
