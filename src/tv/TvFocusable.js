import React, { useCallback, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { GOLD_ACCENT } from '../theme/programme';

/**
 * Core 10-Foot TV D-Pad Focusable Primitive.
 * Provides native Android TV D-pad focus handling (`focusable={true}`),
 * a 2.5px warm gold (#D4A853) focus ring, smooth scale zoom on focus,
 * and optional `hasTVPreferredFocus`.
 */
export function TvFocusable({
  children,
  onPress,
  onLongPress,
  onFocus,
  onBlur,
  disabled = false,
  hasTVPreferredFocus = false,
  scaleOnFocus = 1.05,
  focusBorderColor = GOLD_ACCENT,
  focusBorderWidth = 2.5,
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

  const handleFocus = useCallback(
    (e) => {
      setFocused(true);
      if (scaleOnFocus && scaleOnFocus !== 1) {
        Animated.spring(scaleAnim, {
          toValue: scaleOnFocus,
          friction: 7,
          tension: 110,
          useNativeDriver: true,
        }).start();
      }
      onFocus?.(e);
    },
    [onFocus, scaleAnim, scaleOnFocus],
  );

  const handleBlur = useCallback(
    (e) => {
      setFocused(false);
      if (scaleOnFocus && scaleOnFocus !== 1) {
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 110,
          useNativeDriver: true,
        }).start();
      }
      onBlur?.(e);
    },
    [onBlur, scaleAnim, scaleOnFocus],
  );

  return (
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
          zIndex: 20,
          elevation: 12,
        },
        focused && focusBackgroundColor ? { backgroundColor: focusBackgroundColor } : null,
        focused && focusedStyle,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View
        style={[
          styles.inner,
          scaleOnFocus && scaleOnFocus !== 1 ? { transform: [{ scale: scaleAnim }] } : null,
        ]}
      >
        {typeof children === 'function' ? children({ focused }) : children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderColor: 'transparent',
    borderWidth: 2.5,
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
