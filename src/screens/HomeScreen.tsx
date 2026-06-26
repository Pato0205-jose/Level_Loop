import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, homeInitDurationMs, spacing } from '../constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const CORNER_SIZE = 48;
const LOGO_SIZE = 128;
const FONT_WAIT_MS = 3500;

type Props = {
  onFinish?: () => void;
};

function poppins(fontsLoaded: boolean, name: string): string | undefined {
  return fontsLoaded ? name : undefined;
}

export function HomeScreen({ onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0.33)).current;
  const [fontWaitDone, setFontWaitDone] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const uiReady = fontsLoaded || fontWaitDone;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setFontWaitDone(true), FONT_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.85,
          duration: 2200,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.2,
          duration: 2200,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  useEffect(() => {
    if (!onFinish) return;
    const timer = setTimeout(onFinish, homeInitDurationMs);
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!uiReady) {
    return (
      <View style={styles.root}>
        <Image
          source={require('../../assets/images/splash.png')}
          style={styles.background}
          contentFit="cover"
        />
      </View>
    );
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/images/splash.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + spacing.margin,
              paddingBottom: insets.bottom + spacing.xl,
            },
          ]}
        >
          <View style={styles.centerBlock}>
            <View style={styles.logoSection}>
              <View style={styles.logoGlow} />
              <BlurView intensity={40} tint="dark" style={styles.logoCard}>
                <Image
                  source={require('../../assets/images/logo.png')}
                  style={styles.logo}
                  contentFit="contain"
                />
              </BlurView>
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.title, { fontFamily: poppins(fontsLoaded, 'Poppins_700Bold') }]}>
                Level Loop
              </Text>
              <Text style={[styles.subtitle, { fontFamily: poppins(fontsLoaded, 'Poppins_600SemiBold') }]}>
                The Future of Mastery
              </Text>
            </View>
          </View>

          <View style={styles.bottomBlock}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFillWrap, { width: progressWidth }]}>
                <LinearGradient
                  colors={[colors.primaryContainer, colors.tertiary]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.progressFill}
                />
              </Animated.View>
            </View>
            <Text style={[styles.statusText, { fontFamily: poppins(fontsLoaded, 'Poppins_400Regular') }]}>
              Initializing core simulations...
            </Text>
          </View>
        </View>

        <View style={[styles.corner, styles.cornerTopLeft]} />
        <View style={[styles.corner, styles.cornerTopRight]} />
        <View style={[styles.corner, styles.cornerBottomLeft]} />
        <View style={[styles.corner, styles.cornerBottomRight]} />

        <View style={styles.particles} pointerEvents="none">
          <View style={[styles.particle, styles.p1]} />
          <View style={[styles.particle, styles.p2]} />
          <View style={[styles.particle, styles.p3]} />
          <View style={[styles.particle, styles.p4]} />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: `${colors.surfaceContainerLowest}66`,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.margin,
    justifyContent: 'space-between',
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: LOGO_SIZE + 64,
    height: LOGO_SIZE + 64,
    borderRadius: (LOGO_SIZE + 64) / 2,
    backgroundColor: `${colors.primaryFixedDim}33`,
  },
  logoCard: {
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4D`,
    borderRadius: 12,
    padding: spacing.md,
    overflow: 'hidden',
    backgroundColor: `${colors.surfaceContainerHighest}33`,
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  titleBlock: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.base,
  },
  title: {
    fontSize: 36,
    lineHeight: 43,
    color: colors.title,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(207, 189, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 17,
    color: `${colors.tertiary}CC`,
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  bottomBlock: {
    width: 192,
    alignSelf: 'center',
    gap: spacing.sm,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFillWrap: {
    height: '100%',
  },
  progressFill: {
    flex: 1,
    borderRadius: 999,
    shadowColor: colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    color: `${colors.onSurfaceVariant}66`,
    textAlign: 'center',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: `${colors.primary}4D`,
  },
  cornerTopLeft: {
    top: spacing.margin,
    left: spacing.margin,
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: spacing.margin,
    right: spacing.margin,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: spacing.margin,
    left: spacing.margin,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: spacing.margin,
    right: spacing.margin,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderBottomRightRadius: 8,
  },
  particles: {
    ...StyleSheet.absoluteFill,
    opacity: 0.3,
  },
  particle: {
    position: 'absolute',
    borderRadius: 999,
  },
  p1: {
    top: '15%',
    left: '20%',
    width: 4,
    height: 4,
    backgroundColor: colors.tertiary,
  },
  p2: {
    top: '40%',
    right: '15%',
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
  },
  p3: {
    bottom: '25%',
    left: '10%',
    width: 6,
    height: 6,
    backgroundColor: colors.secondary,
  },
  p4: {
    top: '70%',
    right: '30%',
    width: 4,
    height: 4,
    backgroundColor: colors.tertiary,
  },
});
