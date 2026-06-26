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
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useEffect, useState } from 'react';

import { BottomNav, bottomNavHeight, type MainTab } from '../components/BottomNav';
import { colors, spacing } from '../constants/theme';
import { getCourseProgressPct } from '../constants/roadmaps';
import { getUnreadCount } from '../services/notifications';
import type { PublicUser } from '../services/auth';
import {
  countCompletedTopics,
  getLevelInfo,
  type UserProgress,
} from '../services/progress';

type Props = {
  user?: PublicUser | null;
  progress?: UserProgress | null;
  onLogout?: () => void;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onSelectCourse?: (course: Course) => void;
  onOpenNotifications?: () => void;
};

export type Course = {
  id: string;
  title: string;
  level: 'Intermedio' | 'Avanzado' | 'Iniciado' | 'Maestro';
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
  gradient: readonly [string, string];
};

const COURSES: Course[] = [
  {
    id: 'math',
    title: 'Matemáticas',
    level: 'Intermedio',
    icon: 'calculate',
    accent: colors.tertiaryBright,
    gradient: ['rgba(81, 213, 255, 0.35)', 'rgba(81, 213, 255, 0.05)'],
  },
  {
    id: 'physics',
    title: 'Física',
    level: 'Avanzado',
    icon: 'science',
    accent: colors.primaryAccent,
    gradient: ['rgba(207, 189, 255, 0.35)', 'rgba(80, 21, 189, 0.1)'],
  },
  {
    id: 'code',
    title: 'Programación',
    level: 'Iniciado',
    icon: 'code',
    accent: colors.secondaryContainer,
    gradient: ['rgba(49, 146, 253, 0.35)', 'rgba(49, 146, 253, 0.05)'],
  },
  {
    id: 'english',
    title: 'Inglés',
    level: 'Maestro',
    icon: 'translate',
    accent: '#00c1ed',
    gradient: ['rgba(0, 193, 237, 0.3)', 'rgba(0, 75, 94, 0.1)'],
  },
];

export function DashboardScreen({
  user,
  progress,
  onLogout,
  activeTab,
  onTabChange,
  onSelectCourse,
  onOpenNotifications,
}: Props) {
  const insets = useSafeAreaInsets();
  const [unread, setUnread] = useState(0);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    let cancelled = false;
    getUnreadCount().then((n) => {
      if (!cancelled) setUnread(n);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const totalXp = progress?.totalXp ?? 0;
  const level = getLevelInfo(totalXp);
  const xpCurrent = level.intoLevelXp;
  const xpTotal = level.xpPerLevel;
  const xpPercent = level.pctInLevel;
  const streakDays = progress?.streakDays ?? 0;
  const lessonsCompleted = countCompletedTopics(progress);
  const greetingName = user?.name?.split(' ')[0] ?? 'Cadete';

  const headerHeight = 64;

  return (
    <View style={styles.root}>
      <GridBackground />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + headerHeight + spacing.md,
            paddingBottom: insets.bottom + bottomNavHeight + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LevelCard
          greetingName={greetingName}
          level={level.level}
          xpCurrent={xpCurrent}
          xpTotal={xpTotal}
          xpPercent={xpPercent}
          totalXp={totalXp}
        />
        <StatsGrid
          streakDays={streakDays}
          lessonsCompleted={lessonsCompleted}
          totalXp={totalXp}
        />
        <CoursesSection progress={progress} onSelectCourse={onSelectCourse} />
      </ScrollView>

      <BlurView intensity={40} tint="dark" style={[styles.header, { paddingTop: insets.top, height: insets.top + headerHeight }]}>
        <View style={styles.headerRow}>
          <Pressable style={styles.headerLeft} onPress={onLogout}>
            <MaterialIcons name="grid-view" size={26} color={colors.tertiaryBright} />
            <Text style={styles.headerTitle}>Level Loop</Text>
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable hitSlop={10} onPress={onOpenNotifications} style={styles.bellWrap}>
              <MaterialIcons name="notifications" size={26} color={colors.tertiaryBright} />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unread > 9 ? '9+' : unread}
                  </Text>
                </View>
              )}
            </Pressable>
            <View style={styles.avatar}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.avatarImg}
                contentFit="cover"
              />
            </View>
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
      <View style={styles.bgGlow} />
    </View>
  );
}

const RANK_TIERS: { min: number; label: string }[] = [
  { min: 0, label: 'Cadete Novato' },
  { min: 3, label: 'Aprendiz Estelar' },
  { min: 7, label: 'Explorador' },
  { min: 12, label: 'Comandante' },
  { min: 20, label: 'Maestro Galáctico' },
];

function getRankLabel(level: number): string {
  let label = RANK_TIERS[0].label;
  for (const tier of RANK_TIERS) {
    if (level >= tier.min) label = tier.label;
  }
  return label;
}

function LevelCard({
  greetingName,
  level,
  xpCurrent,
  xpTotal,
  xpPercent,
  totalXp,
}: {
  greetingName: string;
  level: number;
  xpCurrent: number;
  xpTotal: number;
  xpPercent: number;
  totalXp: number;
}) {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.card, styles.cardNeon]}>
      <View style={styles.levelHeader}>
        <View>
          <Text style={styles.levelGreeting}>Hola, {greetingName}</Text>
          <Text style={styles.levelTitle}>Nivel {level}</Text>
          <Text style={styles.levelSubtitle}>{getRankLabel(level)}</Text>
        </View>
        <View style={styles.medalBox}>
          <MaterialIcons name="military-tech" size={26} color={colors.primaryAccent} />
        </View>
      </View>

      <View style={styles.xpBlock}>
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>
            {totalXp.toLocaleString()} XP totales
          </Text>
          <Text style={styles.xpValue}>
            {xpCurrent} / {xpTotal} XP
          </Text>
        </View>
        <View style={styles.xpTrack}>
          <LinearGradient
            colors={[colors.primaryAccent, '#a6c8ff', colors.tertiaryBright]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.xpFill, { width: `${xpPercent}%` }]}
          />
        </View>
      </View>
    </BlurView>
  );
}

function StatsGrid({
  streakDays,
  lessonsCompleted,
  totalXp,
}: {
  streakDays: number;
  lessonsCompleted: number;
  totalXp: number;
}) {
  return (
    <View style={styles.statsGrid}>
      <StatTile
        icon="local-fire-department"
        iconColor="#ffb86b"
        value={String(streakDays)}
        label={streakDays === 1 ? 'Día de racha' : 'Días de racha'}
      />
      <StatTile
        icon="menu-book"
        iconColor={colors.tertiaryBright}
        value={String(lessonsCompleted)}
        label={lessonsCompleted === 1 ? 'Tema dominado' : 'Temas dominados'}
      />
      <StatTile
        icon="bolt"
        iconColor={colors.primaryAccent}
        value={totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}k` : String(totalXp)}
        label="XP totales"
      />
    </View>
  );
}

function StatTile({
  icon,
  iconColor,
  value,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <BlurView intensity={30} tint="dark" style={[styles.card, styles.statTile]}>
      <MaterialIcons name={icon} size={26} color={iconColor} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </BlurView>
  );
}

function CoursesSection({
  progress,
  onSelectCourse,
}: {
  progress?: UserProgress | null;
  onSelectCourse?: (course: Course) => void;
}) {
  return (
    <View style={styles.coursesSection}>
      <View style={styles.coursesHeader}>
        <Text style={styles.coursesTitle}>Materias disponibles</Text>
        <Text style={styles.coursesAction}>Ver todas</Text>
      </View>

      <View style={styles.coursesList}>
        {COURSES.map((course) => (
          <CourseRow
            key={course.id}
            course={course}
            progress={progress}
            onPress={onSelectCourse ? () => onSelectCourse(course) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

function CourseRow({
  course,
  progress,
  onPress,
}: {
  course: Course;
  progress?: UserProgress | null;
  onPress?: () => void;
}) {
  const pct = getCourseProgressPct(course.id, progress);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <BlurView intensity={30} tint="dark" style={[styles.card, styles.courseRow]}>
        <View style={styles.courseThumb}>
          <LinearGradient
            colors={course.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialIcons name={course.icon} size={40} color={course.accent} />
          <LinearGradient
            colors={['transparent', 'rgba(28, 25, 46, 0.9)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.courseThumbFade}
          />
        </View>

        <View style={styles.courseBody}>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {course.title}
          </Text>
          <View style={styles.courseLevelRow}>
            <View style={[styles.courseDot, { backgroundColor: course.accent }]} />
            <Text style={[styles.courseLevel, { color: course.accent }]}>
              {pct}% completado
            </Text>
          </View>
          <View style={styles.courseProgressTrack}>
            <View
              style={[
                styles.courseProgressFill,
                { width: `${pct}%`, backgroundColor: course.accent },
              ]}
            />
          </View>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={26}
          color={colors.outlineVariant}
          style={styles.courseChevron}
        />
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
  bgGlow: {
    position: 'absolute',
    top: -120,
    left: '15%',
    right: '15%',
    height: 320,
    borderRadius: 200,
    backgroundColor: `${colors.tertiaryBright}14`,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.6)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.tertiaryBright,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(81, 213, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${colors.tertiaryBright}4D`,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.15)',
    backgroundColor: 'rgba(42, 39, 61, 0.25)',
    overflow: 'hidden',
  },
  cardNeon: {
    padding: spacing.md,
    gap: spacing.md,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  levelGreeting: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.outline,
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  levelTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 24,
    lineHeight: 31,
    color: colors.onSurface,
  },
  bellWrap: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#ffb4ab',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  bellBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    color: '#7a1a14',
    letterSpacing: 0,
  },
  levelSubtitle: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.tertiaryBright,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  medalBox: {
    backgroundColor: `${colors.primaryContainer}33`,
    borderRadius: 12,
    padding: 8,
  },
  xpBlock: {
    gap: 8,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  xpValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: colors.onSurface,
  },
  xpTrack: {
    height: 12,
    width: '100%',
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 999,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.onSurface,
    marginTop: 2,
  },
  statLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  coursesSection: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  coursesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coursesTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  coursesAction: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    color: colors.tertiaryBright,
  },
  coursesList: {
    gap: spacing.md,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 112,
  },
  courseThumb: {
    width: '32%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  courseThumbFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '60%',
  },
  courseBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    gap: 6,
  },
  courseTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.onSurface,
    flexShrink: 1,
  },
  courseLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  courseLevel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  courseProgressTrack: {
    height: 4,
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
    marginTop: 4,
  },
  courseProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  courseChevron: {
    marginRight: spacing.md,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
