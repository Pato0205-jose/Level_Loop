import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { androidTextInputProps } from './GlassPanel';
import { colors, spacing } from '../constants/theme';

type Props = TextInputProps & {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  variant?: 'login' | 'register';
};

export function AuthTextField({
  label,
  icon,
  variant = 'login',
  style,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);
  const isRegister = variant === 'register';

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          isRegister && styles.fieldRegister,
          focused && (isRegister ? styles.fieldRegisterFocused : styles.fieldFocused),
        ]}
      >
        <MaterialIcons
          name={icon}
          size={22}
          color={isRegister ? `${colors.tertiaryBright}B3` : colors.outline}
          style={styles.icon}
        />
        <TextInput
          {...inputProps}
          {...androidTextInputProps}
          style={[styles.input, isRegister && styles.inputRegister, style]}
          placeholderTextColor={
            isRegister ? `${colors.outline}80` : `${colors.outlineVariant}99`
          }
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  label: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.7,
    color: colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    borderRadius: 8,
    backgroundColor: colors.primaryContainer,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  fieldFocused: Platform.select({
    android: {
      borderBottomColor: colors.tertiaryBright,
      borderWidth: 1,
      borderColor: colors.tertiaryBright,
    },
    default: {
      borderBottomColor: colors.tertiaryBright,
      shadowColor: colors.tertiaryBright,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  icon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'android' ? spacing.sm : 0,
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: colors.onPrimaryContainer,
  },
  fieldRegister: {
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4D`,
    borderBottomWidth: 1,
  },
  fieldRegisterFocused: Platform.select({
    android: {
      borderColor: colors.tertiary,
    },
    default: {
      borderColor: colors.tertiary,
      shadowColor: colors.tertiary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
  }),
  inputRegister: {
    color: colors.onSurface,
  },
});
