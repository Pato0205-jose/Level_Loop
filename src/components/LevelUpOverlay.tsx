import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';

type Props = {
  level: number;
  onClose: () => void;
};

const BG_TOP = '#1f0a47';
const BG_BOTTOM = '#0d061f';
const GLOW = '#cfbdff';

export function LevelUpOverlay({ level, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const starScale = useRef(new Animated.Value(0)).current;
  const starRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(20)).current;
  const levelScale = useRef(new Animated.Value(0.4)).current;
  const levelOpacity = useRef(new Animated.Value(0)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(starScale, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          tension: 40,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(levelScale, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(levelOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(ctaOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();

    const rotateLoop = Animated.loop(
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    rotateLoop.start();
    return () => rotateLoop.stop();
  }, [
    starScale,
    starRotate,
    titleOpacity,
    titleTranslate,
    levelScale,
    levelOpacity,
    ctaOpacity,
    ringOpacity,
    ringScale,
  ]);

  if (!fontsLoaded) {
    return (
      <View style={styles.overlay}>
        <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  const rotateInterpolation = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.overlay}>
      <LinearGradient
        colors={[BG_TOP, BG_BOTTOM]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.iconWrap,
            {
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        >
          <View style={styles.ringOuter} />
          <View style={styles.ringInner} />
          <Animated.View
            style={[
              styles.starWrap,
              {
                transform: [{ scale: starScale }, { rotate: rotateInterpolation }],
              },
            ]}
          >
            <MaterialIcons name="auto-awesome" size={150} color={colors.primaryAccent} />
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[
            styles.titleWrap,
            { opacity: titleOpacity, transform: [{ translateY: titleTranslate }] },
          ]}
        >
          <Text style={styles.label}>¡Subiste de nivel!</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.levelWrap,
            { opacity: levelOpacity, transform: [{ scale: levelScale }] },
          ]}
        >
          <Text style={styles.levelHint}>Nivel</Text>
          <Text style={styles.levelNumber}>{level}</Text>
          <View style={styles.divider} />
          <Text style={styles.subtitle}>
            Sigue resolviendo lecciones para desbloquear más temas y avatares.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.ctaWrap, { opacity: ctaOpacity }]}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
          >
            <LinearGradient
              colors={[colors.primaryContainer, colors.secondaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ctaText}>Continuar</Text>
            <MaterialIcons name="arrow-forward" size={22} color="#fff" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    backgroundColor: BG_BOTTOM,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.margin,
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 520,
    alignSelf: 'center',
    width: '100%',
  },
  iconWrap: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderColor: `${GLOW}33`,
  },
  ringInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: `${GLOW}55`,
    backgroundColor: `${GLOW}08`,
    shadowColor: GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  starWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
  },
  label: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: GLOW,
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  levelWrap: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelHint: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.outline,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  levelNumber: {
    fontFamily: 'Poppins_900Black',
    fontSize: 120,
    lineHeight: 130,
    color: '#fff',
    letterSpacing: -4,
    textShadowColor: GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  divider: {
    width: 64,
    height: 2,
    backgroundColor: `${GLOW}55`,
    borderRadius: 1,
    marginVertical: 4,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 320,
  },
  ctaWrap: {
    width: '100%',
    maxWidth: 360,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 58,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaBtnPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  ctaText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 17,
    color: '#fff',
    letterSpacing: 0.4,
  },
});
