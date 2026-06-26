import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientText } from '../components/GradientText';
import { colors, spacing } from '../constants/theme';

type Props = {
  onCreateAccount?: () => void;
  onSignIn?: () => void;
};

export function WelcomeScreen({ onCreateAccount, onSignIn }: Props) {
  const insets = useSafeAreaInsets();
  const floatY = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -20,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatY]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <View style={styles.bgTopGlow} />
      <View style={styles.bgBottomGlow} />

      <BackgroundDecor />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.hero, { transform: [{ translateY: floatY }] }]}>
          <View style={styles.headlineBlock}>
            <Text style={styles.headline}>Aprende mientras</Text>
            <GradientText
              style={styles.headlineGradient}
              colors={[colors.primary, colors.secondary, colors.tertiary]}
            >
              subes de nivel
            </GradientText>
          </View>

          <Text style={styles.description}>
            Domina nuevas habilidades con desafíos interactivos y gamificados. La educación del
            futuro, hoy.
          </Text>
        </Animated.View>

        <View style={styles.ctas}>
          <Pressable
            onPress={onCreateAccount}
            style={({ pressed }) => [styles.primaryBtnWrap, pressed && styles.btnPressed]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Crear cuenta</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={onSignIn}
            style={({ pressed }) => [styles.glassBtn, pressed && styles.btnPressed]}
          >
            <Text style={styles.glassBtnText}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function BackgroundDecor() {
  return (
    <View style={styles.decor} pointerEvents="none">
      <View style={[styles.decorParticle, { top: '25%', left: '25%' }]} />
      <View style={[styles.decorParticle, { top: '33%', right: '25%' }]} />
      <View style={[styles.decorParticle, { bottom: '25%', left: '33%' }]} />
      <View style={[styles.decorParticle, { bottom: '33%', right: '33%' }]} />
      <View style={styles.decorLineA} />
      <View style={styles.decorLineB} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bgTopGlow: {
    position: 'absolute',
    top: -120,
    left: '10%',
    right: '10%',
    height: 320,
    borderRadius: 200,
    backgroundColor: 'rgba(80, 21, 189, 0.25)',
  },
  bgBottomGlow: {
    position: 'absolute',
    bottom: -80,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(61, 10, 73, 0.4)',
  },
  decor: {
    ...StyleSheet.absoluteFill,
    opacity: 0.4,
  },
  decorParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    shadowColor: colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  decorLineA: {
    position: 'absolute',
    top: '20%',
    left: -40,
    width: '140%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '12deg' }],
  },
  decorLineB: {
    position: 'absolute',
    top: '10%',
    right: -40,
    width: '140%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    transform: [{ rotate: '-12deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.margin,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 512,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    width: '100%',
  },
  headlineBlock: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 4,
  },
  headline: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 42,
    lineHeight: 46,
    color: colors.onBackground,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headlineGradient: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  description: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    lineHeight: 29,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 480,
  },
  ctas: {
    width: '100%',
    maxWidth: 384,
    gap: 16,
  },
  primaryBtnWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtn: {
    paddingVertical: 20,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderRadius: 16,
  },
  primaryBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.onPrimary,
  },
  glassBtn: {
    paddingVertical: 20,
    paddingHorizontal: spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  glassBtnText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    color: colors.onSurfaceVariant,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
});
