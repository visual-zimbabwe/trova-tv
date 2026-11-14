import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { TvFocusable } from './TvFocusable';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';

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
 * 10-Foot Overlay Left Navigation Rail.
 * Reserves a fixed 68dp collapsed footprint so expanding to 240dp overlays the stage
 * without pushing or reflowing content. Entering the rail from the stage lands on `activeTab`.
 */
export function TvSidebar({
  activeTab = 'home',
  onSelectTab,
  watchlistCount = 0,
  activeDownloadCount = 0,
}) {
  const [focusedKey, setFocusedKey] = useState(null);
  const blurTimerRef = useRef(null);

  const expanded = Boolean(focusedKey);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const handleItemFocus = useCallback((key) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setFocusedKey(key);
  }, []);

  const handleItemBlur = useCallback((key) => {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => {
      setFocusedKey((prev) => (prev === key ? null : prev));
    }, 60);
  }, []);

  return (
    <View style={styles.railFootprint}>
      {expanded ? (
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(4, 3, 1, 0.96)', 'rgba(4, 3, 1, 0.78)', 'transparent']}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.backdropScrim}
        />
      ) : null}

      <View
        style={[
          styles.sidebar,
          expanded ? styles.sidebarExpanded : styles.sidebarCollapsed,
        ]}
      >
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
                focusKey={item.key}
                onFocus={() => handleItemFocus(item.key)}
                onBlur={() => handleItemBlur(item.key)}
                onPress={() => onSelectTab?.(item.key)}
                scaleOnFocus={TV_FOCUS.scaleSmall}
                borderRadius={12}
                focusBackgroundColor={TV_FOCUS.surface}
                style={styles.navItem}
                accessibilityLabel={item.label}
              >
                {({ focused }) => (
                  <View style={styles.navItemInner}>
                    {isActive ? <View style={styles.activeBar} /> : null}
                    <View style={styles.iconWrap}>
                      <Ionicons
                        name={isActive || focused ? item.activeIcon : item.icon}
                        size={22}
                        color={
                          focused
                            ? '#FFF4DC'
                            : isActive
                              ? GOLD_ACCENT
                              : '#9E988E'
                        }
                      />
                    </View>
                    {expanded ? (
                      <View style={styles.labelRow}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.navLabel,
                            isActive && styles.navLabelActive,
                            focused && styles.navLabelFocused,
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
    </View>
  );
}

const styles = StyleSheet.create({
  railFootprint: {
    height: '100%',
    width: TV_SPACE.railCollapsedWidth,
    zIndex: 50,
  },
  backdropScrim: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 380,
    zIndex: 49,
  },
  sidebar: {
    backgroundColor: '#070503',
    bottom: 0,
    height: '100%',
    justifyContent: 'space-between',
    left: 0,
    paddingVertical: 12,
    position: 'absolute',
    top: 0,
    zIndex: 50,
  },
  sidebarCollapsed: {
    paddingHorizontal: 8,
    width: TV_SPACE.railCollapsedWidth,
  },
  sidebarExpanded: {
    borderRightColor: 'rgba(212, 168, 83, 0.22)',
    borderRightWidth: 1,
    elevation: 24,
    paddingHorizontal: 14,
    width: TV_SPACE.railExpandedWidth,
  },
  brandHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: 36,
    paddingHorizontal: 6,
  },
  brandDiamond: {
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 83, 0.18)',
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
    fontSize: 22,
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
    minHeight: 41,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'relative',
  },
  navItemInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  activeBar: {
    backgroundColor: GOLD_ACCENT,
    borderRadius: 3,
    bottom: 4,
    left: -6,
    position: 'absolute',
    top: 4,
    width: 4,
  },
  iconWrap: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  labelRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navLabel: {
    color: '#ABA59B',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.body,
    fontWeight: '600',
  },
  navLabelActive: {
    color: GOLD_ACCENT,
    fontFamily: fonts.heading,
    fontWeight: '700',
  },
  navLabelFocused: {
    color: '#FFFFFF',
    fontFamily: fonts.heading,
    fontWeight: '800',
  },
  badgePill: {
    backgroundColor: 'rgba(212, 168, 83, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: GOLD_ACCENT,
    fontFamily: fonts.label,
    fontSize: TV_TYPE.badge,
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    height: 18,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  footerText: {
    color: '#9E988E',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
});
