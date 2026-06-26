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

import { Avatar } from '../components/Avatar';
import { BottomNav, bottomNavHeight, type MainTab } from '../components/BottomNav';
import { GradientText } from '../components/GradientText';
import { colors, spacing } from '../constants/theme';
import {
  evaluateAchievements,
  type Achievement,
} from '../constants/achievements';
import { getCourseProgressPct } from '../constants/roadmaps';
import type { PublicUser } from '../services/auth';
import { loadAchievements } from '../services/achievements';
import {
  countCompletedTopics,
  getLevelInfo,
  type UserProgress,
} from '../services/progress';

type Props = {
  user?: PublicUser | null;
  progress?: UserProgress | null;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenSettings?: () => void;
  onOpenNotifications?: () => void;
  onOpenAchievement?: (id: string) => void;
};

type Skill = {
  id: string;
  title: string;
};

const SKILLS: Skill[] = [
  { id: 'math', title: 'Matemáticas' },
  { id: 'physics', title: 'Física' },
  { id: 'code', title: 'Programación' },
  { id: 'english', title: 'Inglés' },
];

const HEADER_HEIGHT = 64;

function formatXp(value: number): string {
  return value.toLocaleString('es-MX');
}

export function ProfileScreen({
  user,
  progress,
  activeTab,
  onTabChange,
  onOpenSettings,
  onOpenNotifications,
  onOpenAchievement,
}: Props) {
  const insets = useSafeAreaInsets();
  const haloRotate = useRef(new Animated.Value(0)).current;
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    evaluateAchievements(progress),
  );
  const displayName = user?.name ?? 'Piloto Anónimo';
  const totalXp = progress?.totalXp ?? 0;
  const levelInfo = getLevelInfo(totalXp);
  const streakDays = progress?.streakDays ?? 0;
  const lessonsCompleted = countCompletedTopics(progress);
  const bio = user?.bio?.trim()
    ? user.bio
    : levelInfo.level >= 20
      ? 'Maestro Galáctico'
      : levelInfo.level >= 12
        ? 'Comandante'
        : levelInfo.level >= 7
          ? 'Explorador'
          : levelInfo.level >= 3
            ? 'Aprendiz Estelar'
            : 'Cadete Novato';

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(haloRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [haloRotate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await loadAchievements(user?.id, progress);
      if (!cancelled) setAchievements(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, progress]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const haloSpin = haloRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.root}>
      <GridBackground />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + HEADER_HEIGHT + spacing.lg,
            paddingBottom: insets.bottom + bottomNavHeight + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader haloSpin={haloSpin} name={displayName} bio={bio} />
        <StatsRow
          totalXp={totalXp}
          streakDays={streakDays}
          lessonsCompleted={lessonsCompleted}
        />
        <LevelProgressBlock levelInfo={levelInfo} totalXp={totalXp} />
        <SkillsSection progress={progress} />
        <AchievementsSection
          achievements={achievements}
          onOpen={onOpenAchievement}
        />
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
          <View style={styles.headerLeft}>
            <Avatar
              name={displayName}
              size={40}
              borderColor={colors.tertiaryBright}
              borderWidth={2}
              glow
            />
            <Text style={styles.headerLevel}>LVL {levelInfo.level}</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.xpPill}>
              <Text style={styles.xpPillText}>{formatXp(totalXp)} XP</Text>
            </View>
            <Pressable hitSlop={8} onPress={onOpenNotifications}>
              <MaterialIcons name="notifications" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
            <Pressable hitSlop={8} onPress={onOpenSettings}>
              <MaterialIcons name="settings" size={24} color={colors.onSurfaceVariant} />
            </Pressable>
          </View>
        </View>
      </BlurView>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </View>
  );
}

function GridBackground() {
  return (
    <View style={styles.bgWrap} pointerEvents="none">
      <LinearGradient
        colors={[`${colors.primaryAccent}1A`, 'transparent']}
        style={styles.bgTop}
      />
      <View style={styles.bgGlow} />
    </View>
  );
}

function ProfileHeader({
  haloSpin,
  name,
  bio,
}: {
  haloSpin: Animated.AnimatedInterpolation<string>;
  name: string;
  bio: string;
}) {
  return (
    <View style={styles.profileBlock}>
      <View style={styles.avatarSection}>
        <Animated.View
          style={[
            styles.avatarHalo,
            { transform: [{ rotate: haloSpin }] },
          ]}
        >
          <LinearGradient
            colors={[colors.primaryAccent, colors.tertiaryBright, colors.primaryAccent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarHaloGradient}
          />
        </Animated.View>
        <View style={styles.avatarRing}>
          <Avatar name={name} size={120} />
        </View>
        <View style={styles.eliteBadge}>
          <Text style={styles.eliteBadgeText}>ELITE</Text>
        </View>
      </View>

      <GradientText
        style={styles.userName}
        colors={[colors.primaryAccent, colors.tertiaryBright]}
      >
        {name}
      </GradientText>
      <Text style={styles.userRole}>{bio}</Text>
    </View>
  );
}

function StatsRow({
  totalXp,
  streakDays,
  lessonsCompleted,
}: {
  totalXp: number;
  streakDays: number;
  lessonsCompleted: number;
}) {
  return (
    <View style={styles.statsRow}>
      <StatBox
        icon="stars"
        iconColor={colors.tertiaryBright}
        label="Total XP"
        value={formatXp(totalXp)}
      />
      <StatBox
        icon="local-fire-department"
        iconColor="#ffb86b"
        label="Racha"
        value={`${streakDays} ${streakDays === 1 ? 'día' : 'días'}`}
      />
      <StatBox
        icon="menu-book"
        iconColor={colors.primaryAccent}
        label="Temas"
        value={String(lessonsCompleted)}
      />
    </View>
  );
}

function LevelProgressBlock({
  levelInfo,
  totalXp,
}: {
  levelInfo: ReturnType<typeof getLevelInfo>;
  totalXp: number;
}) {
  return (
    <BlurView intensity={30} tint="dark" style={styles.levelBlock}>
      <View style={styles.levelBlockHead}>
        <View>
          <Text style={styles.levelBlockLabel}>Progreso de nivel</Text>
          <Text style={styles.levelBlockTitle}>Nivel {levelInfo.level}</Text>
        </View>
        <View style={styles.levelBlockMetaWrap}>
          <Text style={styles.levelBlockNext}>
            {levelInfo.xpForNext} XP para el siguiente
          </Text>
          <Text style={styles.levelBlockTotal}>
            {formatXp(totalXp)} XP totales
          </Text>
        </View>
      </View>
      <View style={styles.levelTrack}>
        <LinearGradient
          colors={[colors.primaryAccent, '#a6c8ff', colors.tertiaryBright]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.levelFill, { width: `${levelInfo.pctInLevel}%` }]}
        />
      </View>
    </BlurView>
  );
}

function StatBox({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <BlurView intensity={30} tint="dark" style={styles.statBox}>
      <MaterialIcons name={icon} size={30} color={iconColor} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </BlurView>
  );
}

function SkillsSection({ progress }: { progress?: UserProgress | null }) {
  return (
    <View style={styles.skillsSection}>
      <Text style={styles.sectionTitle}>Trayectorias de Aprendizaje</Text>
      <View style={styles.skillsList}>
        {SKILLS.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            progress={progress}
          />
        ))}
      </View>
    </View>
  );
}

function SkillRow({
  skill,
  progress,
}: {
  skill: Skill;
  progress?: UserProgress | null;
}) {
  const pct = getCourseProgressPct(skill.id, progress);
  return (
    <View style={styles.skillRow}>
      <View style={styles.skillHeader}>
        <Text style={styles.skillTitle}>{skill.title}</Text>
        <Text style={styles.skillPercent}>{pct}%</Text>
      </View>
      <View style={styles.skillTrack}>
        <LinearGradient
          colors={[colors.primaryAccent, colors.tertiaryBright]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.skillFill, { width: `${pct}%` }]}
        />
      </View>
    </View>
  );
}

function AchievementsSection({
  achievements,
  onOpen,
}: {
  achievements: Achievement[];
  onOpen?: (id: string) => void;
}) {
  const unlocked = achievements.filter((a) => a.unlocked);
  return (
    <View style={styles.skillsSection}>
      <View style={styles.achievementsHeader}>
        <Text style={styles.sectionTitle}>Logros</Text>
        <Text style={styles.sectionAction}>
          {unlocked.length} de {achievements.length}
        </Text>
      </View>
      <View style={styles.achievementsGrid}>
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onPress={() => onOpen?.(achievement.id)}
          />
        ))}
      </View>
    </View>
  );
}

function AchievementCard({
  achievement,
  onPress,
}: {
  achievement: Achievement;
  onPress: () => void;
}) {
  const dimmed = !achievement.unlocked;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.achievementCardWrap,
        pressed && styles.cardPressed,
      ]}
    >
      <BlurView
        intensity={30}
        tint="dark"
        style={[
          styles.achievementCard,
          {
            borderLeftColor: dimmed ? `${colors.outline}40` : achievement.color,
            borderLeftWidth: 4,
          },
          dimmed && styles.achievementCardLocked,
        ]}
      >
        <View
          style={[
            styles.achievementIconWrap,
            {
              backgroundColor: dimmed
                ? 'rgba(148, 142, 160, 0.12)'
                : `${achievement.color}26`,
            },
          ]}
        >
          <MaterialIcons
            name={dimmed ? 'lock' : achievement.icon}
            size={26}
            color={dimmed ? colors.outline : achievement.color}
          />
        </View>
        <Text
          style={[
            styles.achievementTitle,
            dimmed && styles.achievementTitleLocked,
          ]}
        >
          {achievement.title}
        </Text>
        <Text style={styles.achievementCaption}>{achievement.caption}</Text>
        {dimmed && (
          <Text style={styles.achievementPct}>
            {Math.round(achievement.progress * 100)}%
          </Text>
        )}
      </BlurView>
    </Pressable>
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
  bgWrap: {
    ...StyleSheet.absoluteFill,
  },
  bgTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  bgGlow: {
    position: 'absolute',
    top: -40,
    left: '15%',
    right: '15%',
    height: 240,
    borderRadius: 200,
    backgroundColor: `${colors.primaryAccent}1F`,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.8)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.margin,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLevel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.tertiaryBright,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  xpPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(32, 29, 50, 0.7)',
    borderWidth: 1,
    borderColor: `${colors.outlineVariant}4D`,
  },
  xpPillText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: spacing.margin,
    gap: spacing.lg,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  profileBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarSection: {
    position: 'relative',
    width: 144,
    height: 144,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarHalo: {
    position: 'absolute',
    width: 144,
    height: 144,
    borderRadius: 72,
  },
  avatarHaloGradient: {
    flex: 1,
    borderRadius: 72,
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 4,
    borderColor: colors.background,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eliteBadge: {
    position: 'absolute',
    bottom: -6,
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  eliteBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#003544',
    letterSpacing: 2,
  },
  userName: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  userRole: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 18,
    color: colors.onSurfaceVariant,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    overflow: 'hidden',
  },
  levelBlock: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.12)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  levelBlockHead: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  levelBlockLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  levelBlockTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  levelBlockMetaWrap: {
    alignItems: 'flex-end',
    gap: 2,
  },
  levelBlockNext: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.tertiaryBright,
  },
  levelBlockTotal: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.outline,
  },
  levelTrack: {
    height: 10,
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 999,
  },
  statLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.onSurface,
    marginTop: 2,
  },
  skillsSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: colors.tertiaryBright,
    paddingHorizontal: spacing.xs,
    letterSpacing: -0.3,
  },
  skillsList: {
    gap: spacing.md,
  },
  skillRow: {
    gap: 6,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  skillTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  skillPercent: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.tertiaryBright,
  },
  skillTrack: {
    height: 12,
    width: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(32, 29, 50, 0.8)',
    padding: 2,
    overflow: 'hidden',
  },
  skillFill: {
    flex: 1,
    borderRadius: 999,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  sectionAction: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievementCardWrap: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  achievementCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  achievementCardLocked: {
    opacity: 0.7,
  },
  achievementTitleLocked: {
    color: colors.onSurfaceVariant,
  },
  achievementPct: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    color: colors.tertiaryBright,
    letterSpacing: 0.5,
  },
  achievementIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
    textAlign: 'center',
  },
  achievementCaption: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: `${colors.onSurfaceVariant}B3`,
    textAlign: 'center',
  },
});
