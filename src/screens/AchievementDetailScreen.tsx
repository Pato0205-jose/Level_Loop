import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';
import { evaluateAchievement, type Achievement } from '../constants/achievements';
import { loadAchievements } from '../services/achievements';
import type { UserProgress } from '../services/progress';

type Props = {
  achievementId: string;
  userId?: string | null;
  progress?: UserProgress | null;
  onBack: () => void;
};

const HEADER_HEIGHT = 64;

export function AchievementDetailScreen({
  achievementId,
  userId,
  progress,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets();
  const [achievement, setAchievement] = useState<Achievement | undefined>(() =>
    evaluateAchievement(achievementId, progress),
  );
  const haloRotate = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const all = await loadAchievements(userId ?? null, progress);
      if (cancelled) return;
      setAchievement(all.find((a) => a.id === achievementId));
    })();
    return () => {
      cancelled = true;
    };
  }, [achievementId, userId, progress]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (!achievement?.unlocked) return;
    const loop = Animated.loop(
      Animated.timing(haloRotate, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [haloRotate, achievement?.unlocked]);

  useEffect(() => {
    if (achievement?.unlocked) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, achievement?.unlocked]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  if (!achievement) {
    return (
      <View style={styles.root}>
        <View
          style={[styles.empty, { paddingTop: insets.top + 100 }]}
        >
          <Text style={styles.emptyText}>Logro no encontrado.</Text>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const haloSpin = haloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.95],
  });

  const progressPct = Math.round(achievement.progress * 100);
  const accent = achievement.color;

  return (
    <View style={styles.root}>
      <View style={[styles.glow, { backgroundColor: `${accent}1F` }]} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.md,
            paddingBottom: insets.bottom + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          {achievement.unlocked ? (
            <Animated.View
              style={[
                styles.medalHalo,
                { transform: [{ rotate: haloSpin }] },
              ]}
            >
              <LinearGradient
                colors={[accent, `${accent}80`, accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.medalHaloGradient}
              />
            </Animated.View>
          ) : (
            <Animated.View
              style={[
                styles.medalHaloLocked,
                { opacity: pulseOpacity },
              ]}
            />
          )}

          <View
            style={[
              styles.medal,
              {
                borderColor: achievement.unlocked
                  ? accent
                  : `${colors.outline}66`,
                backgroundColor: achievement.unlocked
                  ? `${accent}1F`
                  : 'rgba(32, 29, 50, 0.7)',
              },
            ]}
          >
            <MaterialIcons
              name={achievement.unlocked ? achievement.icon : 'lock'}
              size={72}
              color={achievement.unlocked ? accent : colors.outline}
            />
          </View>

          <View
            style={[
              styles.statusPill,
              achievement.unlocked
                ? {
                    backgroundColor: `${accent}26`,
                    borderColor: `${accent}66`,
                  }
                : styles.statusPillLocked,
            ]}
          >
            <MaterialIcons
              name={achievement.unlocked ? 'verified' : 'lock-clock'}
              size={14}
              color={achievement.unlocked ? accent : colors.outline}
            />
            <Text
              style={[
                styles.statusPillText,
                {
                  color: achievement.unlocked ? accent : colors.outline,
                },
              ]}
            >
              {achievement.unlocked ? 'Desbloqueado' : 'En progreso'}
            </Text>
          </View>

          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.caption}>{achievement.caption}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descripción</Text>
          <BlurView intensity={30} tint="dark" style={styles.card}>
            <Text style={styles.cardText}>{achievement.description}</Text>
          </BlurView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requisito</Text>
          <BlurView intensity={30} tint="dark" style={styles.card}>
            <View style={styles.requirementRow}>
              <View
                style={[
                  styles.requirementIcon,
                  { backgroundColor: `${accent}1F` },
                ]}
              >
                <MaterialIcons name="flag" size={20} color={accent} />
              </View>
              <Text style={styles.requirementText}>
                {achievement.requirement}
              </Text>
            </View>
          </BlurView>
        </View>

        {!achievement.unlocked && (
          <View style={styles.section}>
            <View style={styles.progressHeader}>
              <Text style={styles.sectionTitle}>Progreso</Text>
              <Text style={[styles.progressPct, { color: accent }]}>
                {progressPct}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPct}%`,
                    backgroundColor: accent,
                    shadowColor: accent,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressHelper}>
              Sigue practicando para desbloquear este logro.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recompensa</Text>
          <BlurView
            intensity={30}
            tint="dark"
            style={[styles.card, styles.rewardCard, { borderColor: `${accent}40` }]}
          >
            <View
              style={[
                styles.rewardIconWrap,
                { backgroundColor: `${accent}1F` },
              ]}
            >
              <MaterialIcons name="card-giftcard" size={26} color={accent} />
            </View>
            <Text style={styles.rewardText}>{achievement.reward}</Text>
          </BlurView>
        </View>

        {achievement.unlocked && achievement.unlockedAt && (
          <View style={styles.unlockedFootnote}>
            <MaterialIcons name="event" size={14} color={colors.outline} />
            <Text style={styles.unlockedFootnoteText}>
              Desbloqueado el{' '}
              {new Date(achievement.unlockedAt).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}
      </ScrollView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + HEADER_HEIGHT },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <MaterialIcons
              name="arrow-back"
              size={26}
              color={colors.primaryAccent}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Logro</Text>
          <View style={{ width: 26 }} />
        </View>
      </BlurView>
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
  glow: {
    position: 'absolute',
    top: '8%',
    left: '15%',
    right: '15%',
    height: 280,
    borderRadius: 200,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.7)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  medalHalo: {
    position: 'absolute',
    top: 0,
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  medalHaloGradient: {
    flex: 1,
    borderRadius: 90,
    opacity: 0.7,
  },
  medalHaloLocked: {
    position: 'absolute',
    top: 8,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(148, 142, 160, 0.15)',
  },
  medal: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: spacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  statusPillLocked: {
    backgroundColor: 'rgba(148, 142, 160, 0.12)',
    borderColor: `${colors.outline}40`,
  },
  statusPillText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 30,
    color: colors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  caption: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    color: colors.tertiaryBright,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.base,
  },
  card: {
    padding: spacing.md,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  cardText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.onSurface,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  requirementIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
    lineHeight: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: spacing.base,
  },
  progressPct: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 29, 50, 0.8)',
    overflow: 'hidden',
    marginHorizontal: spacing.base,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  progressHelper: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.outline,
    paddingHorizontal: spacing.base,
    marginTop: 2,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rewardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardText: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  unlockedFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  unlockedFootnoteText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.outline,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  emptyText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  backBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  backBtnText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurface,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
