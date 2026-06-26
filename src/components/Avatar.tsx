import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '../constants/theme';

type Props = {
  name: string;
  size?: number;
  borderColor?: string;
  borderWidth?: number;
  glow?: boolean;
  gradient?: readonly [string, string];
  style?: ViewStyle;
};

const PALETTES: ReadonlyArray<readonly [string, string]> = [
  ['#5015bd', '#a6c8ff'],
  ['#3192fd', '#51d5ff'],
  ['#cfbdff', '#5015bd'],
  ['#00caf8', '#027fe9'],
  ['#3d0a49', '#5015bd'],
  ['#51d5ff', '#a6c8ff'],
];

function pickGradient(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

export function Avatar({
  name,
  size = 40,
  borderColor,
  borderWidth = 0,
  glow = false,
  gradient,
  style,
}: Props) {
  const grad = gradient ?? pickGradient(name);
  const radius = size / 2;
  const fontSize = Math.max(11, Math.round(size * 0.4));

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderWidth,
          borderColor: borderColor ?? colors.outlineVariant,
          overflow: 'hidden',
        },
        glow && borderColor
          ? {
              shadowColor: borderColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 10,
              elevation: 6,
            }
          : null,
        style,
      ]}
    >
      <LinearGradient
        colors={grad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, { borderRadius: radius }]}
      >
        <Text style={[styles.initials, { fontSize }]}>{initialsOf(name)}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: 'Poppins_700Bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
});
