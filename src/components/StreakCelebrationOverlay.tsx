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
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';

type Props = {
  streak: number;
  onClose: () => void;
  /** Cambia el copy de "racha aumentada" a "saludo diario". */
  mode?: 'celebration' | 'greeting';
};

const FLAME_COLOR_1 = '#ffb86b';
const FLAME_COLOR_2 = '#ff5b3e';
const FLAME_GLOW = '#ff8c42';
const BG_TOP = '#3b1408';
const BG_BOTTOM = '#1a0c1c';

export function StreakCelebrationOverlay({ streak, onClose, mode = 'celebration' }: Props) {
  const insets = useSafeAreaInsets();
  const numberScale = useRef(new Animated.Value(0.4)).current;
  const numberOpacity = useRef(new Animated.Value(0)).current;
  const flameY = useRef(new Animated.Value(0)).current;
  const flameScale = useRef(new Animated.Value(0.4)).current;
  const flameRotate = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const ctaTranslate = useRef(new Animated.Value(40)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const sparksOpacity = useRef(new Animated.Value(0)).current;

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
        Animated.timing(flameScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.6)),
          useNativeDriver: true,
        }),
        Animated.timing(sparksOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(numberScale, {
          toValue: 1,
          tension: 60,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(numberOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(messageOpacity, {
        toValue: 1,
        duration: 320,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(ctaTranslate, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(ctaOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameY, {
          toValue: -10,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flameY, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const wiggleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameRotate, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flameRotate, {
          toValue: -1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    flameLoop.start();
    wiggleLoop.start();
    return () => {
      flameLoop.stop();
      wiggleLoop.stop();
    };
  }, [
    flameScale,
    flameY,
    flameRotate,
    numberScale,
    numberOpacity,
    messageOpacity,
    ctaTranslate,
    ctaOpacity,
    sparksOpacity,
  ]);

  const message = useMemo(
    () => (mode === 'greeting' ? getGreetingMessage(streak) : getStreakMessage(streak)),
    [streak, mode],
  );
  const milestone = useMemo(() => mode === 'celebration' && isMilestone(streak), [streak, mode]);

  if (!fontsLoaded) {
    return (
      <Modal
        visible
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <LinearGradient colors={[BG_TOP, BG_BOTTOM]} style={StyleSheet.absoluteFill} />
        </View>
      </Modal>
    );
  }

  const rotateInterpolation = flameRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-6deg', '6deg'],
  });

  return (
    <Modal
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
      <LinearGradient
        colors={[BG_TOP, BG_BOTTOM]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Animated.View
        style={[styles.sparksLayer, { opacity: sparksOpacity }]}
        pointerEvents="none"
      >
        {SPARKS.map((spark, i) => (
          <FloatingSpark key={i} delay={spark.delay} top={spark.top} left={spark.left} size={spark.size} />
        ))}
      </Animated.View>

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
      >
        {milestone && (
          <View style={styles.milestoneBadge}>
            <MaterialIcons name="emoji-events" size={14} color={FLAME_COLOR_1} />
            <Text style={styles.milestoneText}>¡Hito alcanzado!</Text>
          </View>
        )}

        <View style={styles.flameWrap}>
          <View style={styles.flameGlow} />
          <Animated.View
            style={{
              transform: [
                { translateY: flameY },
                { scale: flameScale },
                { rotate: rotateInterpolation },
              ],
            }}
          >
            <MaterialIcons name="local-fire-department" size={160} color={FLAME_COLOR_2} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.numberWrap,
            { opacity: numberOpacity, transform: [{ scale: numberScale }] },
          ]}
        >
          <Text style={styles.numberText}>{streak}</Text>
          <Text style={styles.numberSubText}>
            {streak === 1 ? 'día de racha' : 'días de racha'}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.messageWrap, { opacity: messageOpacity }]}>
          <Text style={styles.messageTitle}>{message.title}</Text>
          <Text style={styles.messageBody}>{message.body}</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.ctaWrap,
            { opacity: ctaOpacity, transform: [{ translateY: ctaTranslate }] },
          ]}
        >
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.ctaBtn, pressed && styles.ctaBtnPressed]}
          >
            <LinearGradient
              colors={[FLAME_COLOR_1, FLAME_COLOR_2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ctaText}>
              {mode === 'greeting' ? '¡A practicar!' : '¡Sigue así!'}
            </Text>
            <MaterialIcons name="arrow-forward" size={22} color="#2a0c00" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
    </Modal>
  );
}

function FloatingSpark({
  delay,
  top,
  left,
  size,
}: {
  delay: number;
  top: string;
  left: string;
  size: number;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -180,
            duration: 2600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1800,
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.spark,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          top: top as never,
          left: left as never,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

type StreakMessage = { title: string; body: string };

function getStreakMessage(streak: number): StreakMessage {
  if (streak >= 365)
    return {
      title: '¡Un año entero!',
      body: 'Eres una leyenda viviente del aprendizaje.',
    };
  if (streak >= 100)
    return {
      title: '¡Cien días!',
      body: 'La constancia es tu superpoder.',
    };
  if (streak >= 50)
    return {
      title: '¡Cincuenta días!',
      body: 'Estás imparable. La rutina ya es tuya.',
    };
  if (streak >= 30)
    return {
      title: '¡Un mes completo!',
      body: 'Un hábito sólido. ¡Sigue subiendo de nivel!',
    };
  if (streak >= 14)
    return {
      title: '¡Dos semanas seguidas!',
      body: 'Esto ya es parte de tu día a día.',
    };
  if (streak >= 7)
    return {
      title: '¡Una semana completa!',
      body: 'Siete días sin fallar. ¡Increíble!',
    };
  if (streak >= 5)
    return {
      title: '¡Cinco días seguidos!',
      body: 'Estás formando un hábito real.',
    };
  if (streak >= 3)
    return {
      title: '¡Tres días seguidos!',
      body: 'El impulso está creciendo. No lo sueltes.',
    };
  if (streak === 2)
    return {
      title: '¡Día dos!',
      body: 'Ya tienes una racha de verdad. Mañana otra vez.',
    };
  return {
    title: '¡Comenzaste una racha!',
    body: 'Practica mañana para mantenerla viva.',
  };
}

function isMilestone(streak: number): boolean {
  return [3, 7, 14, 30, 50, 100, 365].includes(streak);
}

function getGreetingMessage(streak: number): StreakMessage {
  if (streak >= 30)
    return {
      title: `¡Llevas ${streak} días!`,
      body: 'Tu constancia es increíble. Vamos por hoy también.',
    };
  if (streak >= 7)
    return {
      title: `¡${streak} días seguidos!`,
      body: 'No rompas la racha. Una lección y sigues.',
    };
  if (streak >= 3)
    return {
      title: `¡${streak} días seguidos!`,
      body: 'Vienes con buen ritmo. Sigamos hoy.',
    };
  if (streak >= 1)
    return {
      title: `Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`,
      body: 'Practica hoy para mantenerla viva.',
    };
  return {
    title: '¡Bienvenida!',
    body: 'Completa una lección hoy y comienza tu racha.',
  };
}

const SPARKS = [
  { delay: 0, top: '60%', left: '20%', size: 6 },
  { delay: 300, top: '55%', left: '70%', size: 4 },
  { delay: 700, top: '45%', left: '15%', size: 5 },
  { delay: 1100, top: '50%', left: '80%', size: 6 },
  { delay: 1500, top: '65%', left: '40%', size: 4 },
  { delay: 200, top: '40%', left: '55%', size: 5 },
  { delay: 900, top: '70%', left: '60%', size: 6 },
  { delay: 1300, top: '35%', left: '30%', size: 4 },
];

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BG_BOTTOM,
  },
  sparksLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  spark: {
    position: 'absolute',
    backgroundColor: FLAME_COLOR_1,
    shadowColor: FLAME_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
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
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${FLAME_COLOR_1}66`,
    backgroundColor: `${FLAME_COLOR_1}1a`,
  },
  milestoneText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: FLAME_COLOR_1,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  flameWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
  },
  flameGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: FLAME_GLOW,
    opacity: 0.18,
    shadowColor: FLAME_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
  },
  numberWrap: {
    alignItems: 'center',
    gap: 4,
  },
  numberText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 120,
    lineHeight: 130,
    color: '#fff',
    letterSpacing: -4,
    textShadowColor: FLAME_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
  },
  numberSubText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: FLAME_COLOR_1,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  messageWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  messageTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  messageBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: '#f5d3b3',
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
    shadowColor: FLAME_COLOR_2,
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
    color: '#2a0c00',
    letterSpacing: 0.4,
  },
});
