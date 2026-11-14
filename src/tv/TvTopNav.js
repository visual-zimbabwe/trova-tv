import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TvFocusable } from './TvFocusable';
import { TV_NAV_ITEMS } from './TvSidebar';
import { GOLD_ACCENT } from '../theme/programme';
import { fonts } from '../theme/tokens';
import { TV_FOCUS, TV_SPACE, TV_TYPE } from './tvTheme';

/**
 * 10-Foot Top Horizontal Text Navigation Bar.
 * Clean text labels only — no icons, no button backgrounds or chips at rest.
 * Active tab is indicated by warm gold text and a crisp underline; focus adds
 * a subtle scale lift and soft warm highlight.
 */
export function TvTopNav({
  activeTab = 'home',
  onSelectTab,
  watchlistCount = 0,
  activeDownloadCount = 0,
}) {
  return (
    <View style={styles.topNavBar}>
      <Text style={styles.brandWordmark}>Trova</Text>

      <View style={styles.navRow}>
        {TV_NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          const count =
            item.key === 'downloads' && activeDownloadCount > 0
              ? activeDownloadCount
              : item.key === 'watchlist' && watchlistCount > 0
                ? watchlistCount
                : null;

          return (
            <TvFocusable
              key={item.key}
              appearance="text"
              focusKey={item.key}
              onPress={() => onSelectTab?.(item.key)}
              scaleOnFocus={TV_FOCUS.scaleSmall}
              borderRadius={6}
              style={styles.navItem}
              accessibilityLabel={item.label}
            >
              {({ focused }) => (
                <View style={styles.navItemInner}>
                  <View style={styles.labelLine}>
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
                    {count ? (
                      <Text
                        style={[
                          styles.countText,
                          isActive && styles.navLabelActive,
                          focused && styles.navLabelFocused,
                        ]}
                      >
                        {count}
                      </Text>
                    ) : null}
                  </View>
                  {isActive ? <View style={styles.activeUnderline} /> : null}
                </View>
              )}
            </TvFocusable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topNavBar: {
    alignItems: 'center',
    backgroundColor: '#040301',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: TV_SPACE.overscanX,
    paddingVertical: 10,
    zIndex: 50,
  },
  brandWordmark: {
    color: GOLD_ACCENT,
    fontFamily: fonts.wordmark,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginRight: 16,
  },
  navRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 2,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  navItemInner: {
    alignItems: 'center',
  },
  labelLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  navLabel: {
    color: '#ABA59B',
    fontFamily: fonts.heading,
    fontSize: 13.5,
    fontWeight: '700',
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
  countText: {
    color: '#7E7970',
    fontFamily: fonts.label,
    fontSize: TV_TYPE.eyebrow,
    fontWeight: '600',
  },
  activeUnderline: {
    backgroundColor: GOLD_ACCENT,
    borderRadius: 1,
    height: 2,
    marginTop: 4,
    width: '100%',
  },
});
