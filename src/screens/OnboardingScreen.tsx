import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';
import {
  setOnboardingDone,
  updateCurrentUser,
  type PublicUser,
} from '../services/auth';

type Props = {
  user: PublicUser;
  onFinish: (user: PublicUser) => void;
};

type StepId = 'welcome' | 'interests' | 'goal';

const STEPS: StepId[] = ['welcome', 'interests', 'goal'];

type Interest = {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
};

const INTERESTS: Interest[] = [
  { id: 'math', title: 'Matemáticas', icon: 'calculate', accent: colors.tertiaryBright },
  { id: 'physics', title: 'Física', icon: 'science', accent: colors.primaryAccent },
  { id: 'code', title: 'Programación', icon: 'code', accent: colors.secondaryContainer },
  { id: 'english', title: 'Inglés', icon: 'translate', accent: '#00c1ed' },
];

const GOAL_OPTIONS = [
  { min: 5, label: 'Casual', helper: '5 min al día' },
  { min: 10, label: 'Regular', helper: '10 min al día' },
  { min: 20, label: 'Serio', helper: '20 min al día' },
  { min: 30, label: 'Intenso', helper: '30 min al día' },
];

export function OnboardingScreen({ user, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const [stepIdx, setStepIdx] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [dailyGoalMin, setDailyGoalMin] = useState(10);
  const [busy, setBusy] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const canAdvance = useMemo(() => {
    if (step === 'interests') return interests.length > 0;
    if (step === 'goal') return dailyGoalMin > 0;
    return true;
  }, [step, interests, dailyGoalMin]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const handleNext = async () => {
    if (!canAdvance || busy) return;
    if (!isLast) {
      setStepIdx((i) => i + 1);
      return;
    }
    setBusy(true);
    try {
      const updated = await updateCurrentUser({ interests, dailyGoalMin });
      await setOnboardingDone(true);
      onFinish(updated ?? user);
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (stepIdx === 0) return;
    setStepIdx((i) => i - 1);
  };

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={[styles.topRow, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          disabled={stepIdx === 0}
          style={({ pressed }) => [
            styles.topBtn,
            stepIdx === 0 && styles.topBtnDisabled,
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={stepIdx === 0 ? colors.outline : colors.onSurface}
          />
        </Pressable>

        <View style={styles.progressTrack}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= stepIdx && styles.progressDotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.topBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {step === 'welcome' && (
          <WelcomeStep userName={user.name} />
        )}
        {step === 'interests' && (
          <InterestsStep
            selected={interests}
            onToggle={toggleInterest}
          />
        )}
        {step === 'goal' && (
          <GoalStep value={dailyGoalMin} onChange={setDailyGoalMin} />
        )}
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
      >
        <Pressable
          onPress={handleNext}
          disabled={!canAdvance || busy}
          style={({ pressed }) => [
            styles.cta,
            (!canAdvance || busy) && styles.ctaDisabled,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={[colors.primaryContainer, colors.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.ctaText}>
            {busy
              ? 'Guardando...'
              : isLast
                ? 'Empezar a aprender'
                : 'Siguiente'}
          </Text>
          {!busy && (
            <MaterialIcons
              name={isLast ? 'rocket-launch' : 'arrow-forward'}
              size={22}
              color="#ffffff"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

function WelcomeStep({ userName }: { userName: string }) {
  return (
    <View style={styles.welcomeWrap}>
      <View style={styles.logoWrap}>
        <View style={styles.logoHalo} />
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>
      <Text style={styles.welcomeKicker}>¡Bienvenido!</Text>
      <Text style={styles.welcomeTitle} numberOfLines={2}>
        Hola, {userName}
      </Text>
      <Text style={styles.welcomeText}>
        Vamos a personalizar tu experiencia en{' '}
        <Text style={styles.welcomeBold}>Level Loop</Text>. En 2 pasos sabremos
        qué quieres aprender y cuánto tiempo le dedicarás al día.
      </Text>

      <View style={styles.welcomeBenefits}>
        <Benefit icon="auto-stories" text="Lecciones cortas explicadas paso a paso." />
        <Benefit icon="sports-esports" text="Ejercicios gamificados con XP y rachas." />
        <Benefit icon="emoji-events" text="Logros desbloqueables conforme avanzas." />
      </View>
    </View>
  );
}

function Benefit({
  icon,
  text,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.benefitRow}>
      <View style={styles.benefitIconWrap}>
        <MaterialIcons name={icon} size={20} color={colors.tertiaryBright} />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
}

function InterestsStep({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepKicker}>Paso 2</Text>
      <Text style={styles.stepTitle}>¿Qué quieres aprender?</Text>
      <Text style={styles.stepHelper}>
        Elige una o más materias. Podrás cambiarlo después desde tu perfil.
      </Text>

      <View style={styles.interestGrid}>
        {INTERESTS.map((interest) => {
          const active = selected.includes(interest.id);
          return (
            <Pressable
              key={interest.id}
              onPress={() => onToggle(interest.id)}
              style={({ pressed }) => [
                styles.interestCard,
                active && {
                  borderColor: interest.accent,
                  shadowColor: interest.accent,
                  shadowOpacity: 0.35,
                  shadowRadius: 14,
                },
                pressed && styles.pressed,
              ]}
            >
              <BlurView
                intensity={30}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  styles.interestIconWrap,
                  { borderColor: `${interest.accent}66` },
                  active && { backgroundColor: `${interest.accent}26` },
                ]}
              >
                <MaterialIcons
                  name={interest.icon}
                  size={32}
                  color={interest.accent}
                />
              </View>
              <Text style={styles.interestTitle}>{interest.title}</Text>
              {active && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: interest.accent },
                  ]}
                >
                  <MaterialIcons name="check" size={14} color="#001f28" />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function GoalStep({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <View style={styles.stepWrap}>
      <Text style={styles.stepKicker}>Paso 3</Text>
      <Text style={styles.stepTitle}>¿Cuánto quieres practicar al día?</Text>
      <Text style={styles.stepHelper}>
        Establece una meta diaria realista. La consistencia gana a la
        intensidad.
      </Text>

      <View style={styles.goalList}>
        {GOAL_OPTIONS.map((opt) => {
          const active = opt.min === value;
          return (
            <Pressable
              key={opt.min}
              onPress={() => onChange(opt.min)}
              style={({ pressed }) => [
                styles.goalCard,
                active && styles.goalCardActive,
                pressed && styles.pressed,
              ]}
            >
              <BlurView
                intensity={30}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.goalLeft}>
                <View
                  style={[
                    styles.goalRadio,
                    active && styles.goalRadioActive,
                  ]}
                >
                  {active && <View style={styles.goalRadioDot} />}
                </View>
                <View style={styles.goalText}>
                  <Text style={styles.goalLabel}>{opt.label}</Text>
                  <Text style={styles.goalHelper}>{opt.helper}</Text>
                </View>
              </View>
              <Text style={styles.goalMin}>{opt.min} min</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  glowTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 200,
    backgroundColor: `${colors.primaryContainer}1F`,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 360,
    height: 360,
    borderRadius: 200,
    backgroundColor: `${colors.tertiaryBright}1F`,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  topBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
  },
  topBtnDisabled: {
    opacity: 0.3,
  },
  progressTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
  },
  progressDot: {
    width: 28,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(207, 189, 255, 0.2)',
  },
  progressDotActive: {
    backgroundColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  welcomeWrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  logoWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.md,
  },
  logoHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: `${colors.tertiaryBright}33`,
  },
  logo: {
    width: 110,
    height: 110,
  },
  welcomeKicker: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: colors.tertiaryBright,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  welcomeTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: colors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  welcomeText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  welcomeBold: {
    fontFamily: 'Poppins_600SemiBold',
    color: colors.onSurface,
  },
  welcomeBenefits: {
    width: '100%',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
  },
  benefitIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.tertiaryBright}1A`,
  },
  benefitText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurface,
    lineHeight: 18,
  },
  stepWrap: {
    gap: spacing.sm,
  },
  stepKicker: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: colors.tertiaryBright,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  stepTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.onSurface,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  stepHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  interestCard: {
    flexBasis: '47%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    overflow: 'hidden',
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    position: 'relative',
  },
  interestIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  interestTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalList: {
    gap: spacing.sm,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  goalCardActive: {
    borderColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  goalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  goalRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalRadioActive: {
    borderColor: colors.tertiaryBright,
  },
  goalRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.tertiaryBright,
  },
  goalText: {
    gap: 2,
  },
  goalLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  goalHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
  goalMin: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: colors.tertiaryBright,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: `${colors.background}E6`,
    borderTopWidth: 1,
    borderTopColor: 'rgba(207, 189, 255, 0.05)',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
});
