import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { TV_FOCUS } from './tvTheme';

/**
 * Core 10-Foot TV D-Pad Focusable Primitive.
 * Provides native Android TV D-pad focus handling (`focusable={true}`),
 * restrained scale lift, soft halo glow (`boxShadow`), and gentle highlight
 * (`appearance="text"`) or hairline frame (`appearance="card"`).
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
  appearance = 'text', // 'text' | 'card'
  scaleOnFocus,
  focusBorderColor = TV_FOCUS.ringColor,
  focusBorderWidth,
  focusBackgroundColor,
  borderRadius = 8,
  style,
  focusedStyle,
  accessibilityLabel,
  accessibilityRole = 'button',
  testID,
}) {
  const [focused, setFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const isCard = appearance === 'card';
  const defaultScale = isCard ? TV_FOCUS.scale : TV_FOCUS.scaleSmall;
  const rawScale = scaleOnFocus !== undefined ? scaleOnFocus : defaultScale;
  const effectiveScale =
    rawScale && rawScale > 1 ? Math.max(TV_FOCUS.scaleSmall, rawScale) : 1;

  const resolvedBorderWidth =
    focusBorderWidth !== undefined ? focusBorderWidth : isCard ? TV_FOCUS.ringWidth : 0;

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
  const outerFlex = {};
  if (flatStyle.flex != null) outerFlex.flex = flatStyle.flex;
  if (flatStyle.flexGrow != null) outerFlex.flexGrow = flatStyle.flexGrow;
  if (flatStyle.flexShrink != null) outerFlex.flexShrink = flatStyle.flexShrink;
  if (flatStyle.flexBasis != null) outerFlex.flexBasis = flatStyle.flexBasis;
  const hasOuterFlex = Object.keys(outerFlex).length > 0;

  const {
    flex: _flex,
    flexGrow: _flexGrow,
    flexShrink: _flexShrink,
    flexBasis: _flexBasis,
    ...innerStyle
  } = flatStyle;

  const resolvedFocusBg =
    focusBackgroundColor !== undefined
      ? focusBackgroundColor
      : isCard
        ? null
        : TV_FOCUS.surface;

  return (
    <Animated.View
      style={[
        hasOuterFlex ? outerFlex : null,
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
          { borderRadius, borderWidth: resolvedBorderWidth },
          innerStyle,
          focused && {
            borderColor: focusBorderColor,
            borderWidth: resolvedBorderWidth,
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
