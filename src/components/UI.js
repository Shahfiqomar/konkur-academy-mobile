import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.navy} size="large" />
    </View>
  );
}

export function ErrorView({ message }) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export function Button({ title, onPress, disabled, variant = 'primary', style }) {
  const variantStyle = variant === 'primary' ? styles.buttonPrimary : styles.buttonSecondary;
  const textStyle = variant === 'primary' ? styles.buttonTextPrimary : styles.buttonTextSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={textStyle}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    fontSize: 15,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.navy,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line + '33',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonTextPrimary: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonTextSecondary: {
    color: colors.heading,
    fontWeight: '700',
    fontSize: 14,
  },
});
