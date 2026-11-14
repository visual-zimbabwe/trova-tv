import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { GOLD_ACCENT } from '../theme/programme';
import { TV_FOCUS, TV_SELECTED } from './tvTheme';

/**
 * Core 10-Foot TV D-Pad Focusable Primitive.
 * Provides native Android TV D-pad focus handling (`focusable={true}`),
 * a 3dp warm-white (#FFF4DC) focus ring, soft halo glow (`boxShadow`),
 * outer scale lift on focus, and optional `hasTVPreferredFocus`.
 */
export function TvFocusable({
  children,
  onPress,
  onLongPress,
  onFocus,
  onBlur,
  onFocusChange,
  focusKey,
  disabled = false,
  hasTVPreferredFocus = false,
  scaleOnFocus = TV_FOCUS.scale,
  focusBorderColor = TV_FOCUS.ringColor,
  focusBorderWidth = TV_FOCUS.ringWidth,
  focusBackgroundColor,
  borderRadius = 10,
  style,
  focusedStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
  testID,
}) {
  const [focused, setFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const effectiveScale =
    scaleOnFocus && scaleOnFocus > 1
      ? Math.max(TV_FOCUS.scaleSmall, scaleOnFocus)
      : 1;

  const handleFocus = useCallback(
    (e) => {
      setFocused(true);
      if (effectiveScale !== 1) {
        Animated.spring(scaleAnim, {
          toValue: effectiveScale,
          friction: 7,
          tension: 120,
          useNativeDriver: true,
        }).start();
      }
      onFocusChange?.(true, focusKey, e);
      onFocus?.(e);
    },
    [effectiveScale, focusKey, onFocus, onFocusChange, scaleAnim],
  );

  const handleBlur = useCallback(
    (e) => {
      setFocused(false);
      if (effectiveScale !== 1) {
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 120,
          useNativeDriver: true,
        }).start();
      }
      onFocusChange?.(false, focusKey, e);
      onBlur?.(e);
    },
    [effectiveScale, focusKey, onBlur, onFocusChange, scaleAnim],
  );

  const flatStyle = StyleSheet.flatten(style) || {};
  const outerFlex = flatStyle.flex != null ? { flex: flatStyle.flex } : null;
  const isGoldSelected =
    flatStyle.backgroundColor === GOLD_ACCENT ||
    flatStyle.backgroundColor === TV_SELECTED.fill;

  const resolvedFocusBg =
    focusBackgroundColor !== undefined
      ? focusBackgroundColor
      : !isGoldSelected
        ? TV_FOCUS.surface
        : null;

  return (
    <Animated.View
      style={[
        outerFlex,
        effectiveScale !== 1 ? { transform: [{ scale: scaleAnim }] } : null,
        focused && styles.lifted,
      ]}
    >
      <Pressable
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        focusable={!disabled}
        hasTVPreferredFocus={hasTVPreferredFocus}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: Boolean(disabled), selected: focused }}
        testID={testID}
        style={({ pressed }) => [
          styles.base,
          { borderRadius },
          style,
          focused && {
            borderColor: focusBorderColor,
            borderWidth: focusBorderWidth,
            boxShadow: TV_FOCUS.glow,
          },
          focused && resolvedFocusBg ? { backgroundColor: resolvedFocusBg } : null,
          focused && focusedStyle,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <View style={styles.inner}>
          {typeof children === 'function' ? children({ focused }) : children}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderColor: 'transparent',
    borderWidth: TV_FOCUS.ringWidth,
  },
  lifted: {
    elevation: 16,
    zIndex: 30,
  },
  inner: {
    flexShrink: 0,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.4,
  },
});
