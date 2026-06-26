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
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../constants/theme';
import { LESSONS, type Lesson } from '../constants/lessons';
import {
  getCourseRoadmap,
  type RoadmapModule,
} from '../constants/roadmaps';
import {
  isTopicCompleted,
  type UserProgress,
} from '../services/progress';

type Props = {
  courseId?: string;
  progress?: UserProgress | null;
  onBack: () => void;
  onOpenLesson?: (lesson: Lesson) => void;
};

type CoursePalette = {
  accent: string;
  gradient: readonly [string, string];
  icon: keyof typeof MaterialIcons.glyphMap;
  tagline: string;
};

const COURSE_META: Record<string, CoursePalette> = {
  math: {
    accent: colors.tertiaryBright,
    gradient: ['rgba(81, 213, 255, 0.4)', 'rgba(81, 213, 255, 0.05)'],
    icon: 'calculate',
    tagline: 'Lógica y números desde lo esencial.',
  },
  physics: {
    accent: colors.primaryAccent,
    gradient: ['rgba(207, 189, 255, 0.4)', 'rgba(80, 21, 189, 0.1)'],
    icon: 'science',
    tagline: 'Movimiento, fuerza y energía.',
  },
  code: {
    accent: colors.secondaryContainer,
    gradient: ['rgba(49, 146, 253, 0.4)', 'rgba(49, 146, 253, 0.05)'],
    icon: 'code',
    tagline: 'Web y JavaScript paso a paso.',
  },
  english: {
    accent: '#00c1ed',
    gradient: ['rgba(0, 193, 237, 0.4)', 'rgba(0, 75, 94, 0.1)'],
    icon: 'translate',
    tagline: 'Saludos, verbos y vocabulario base.',
  },
};

const FALLBACK_PALETTE: CoursePalette = {
  accent: colors.primaryAccent,
  gradient: ['rgba(207, 189, 255, 0.4)', 'rgba(80, 21, 189, 0.1)'],
  icon: 'menu-book',
  tagline: 'Biblioteca de lecciones.',
};

type ModuleWithLessons = RoadmapModule & { lessons: Lesson[] };

export function CourseLessonsScreen({
  courseId,
  progress,
  onBack,
  onOpenLesson,
}: Props) {
  const insets = useSafeAreaInsets();
  const roadmap = useMemo(() => getCourseRoadmap(courseId), [courseId]);
  const palette = useMemo<CoursePalette>(
    () => COURSE_META[roadmap.id] ?? FALLBACK_PALETTE,
    [roadmap.id],
  );

  const modules: ModuleWithLessons[] = useMemo(() => {
    return roadmap.modules.map((module) => ({
      ...module,
      lessons: module.nodes
        .map((node) => LESSONS[node.id])
        .filter((lesson): lesson is Lesson => !!lesson),
    }));
  }, [roadmap]);

  const totalLessons = useMemo(
    () => modules.reduce((sum, m) => sum + m.lessons.length, 0),
    [modules],
  );
  const totalMin = useMemo(
    () =>
      modules.reduce(
        (sum, m) => sum + m.lessons.reduce((s, l) => s + l.estimatedMin, 0),
        0,
      ),
    [modules],
  );
  const completedCount = useMemo(() => {
    if (!progress) return 0;
    return modules.reduce(
      (sum, m) =>
        sum +
        m.lessons.filter((l) => isTopicCompleted(progress, l.topicId)).length,
      0,
    );
  }, [modules, progress]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const headerHeight = 64;

  return (
    <View style={styles.root}>
      <BackgroundDecor accent={palette.accent} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + headerHeight + spacing.md,
            paddingBottom: insets.bottom + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CourseHero
          title={roadmap.title}
          tagline={palette.tagline}
          icon={palette.icon}
          accent={palette.accent}
          gradient={palette.gradient}
          totalLessons={totalLessons}
          totalMin={totalMin}
          completedLessons={completedCount}
        />

        <View style={styles.modulesList}>
          {modules.map((module, idx) => (
            <ModuleBlock
              key={module.id}
              module={module}
              moduleIndex={idx + 1}
              palette={palette}
              progress={progress}
              onOpenLesson={onOpenLesson}
            />
          ))}
        </View>
      </ScrollView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[
          styles.header,
          { paddingTop: insets.top, height: insets.top + headerHeight },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            hitSlop={10}
            style={({ pressed }) => [pressed && styles.pressedSoft]}
          >
            <MaterialIcons
              name="arrow-back"
              size={26}
              color={colors.primaryAccent}
            />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {roadmap.title}
          </Text>
          <View style={{ width: 26 }} />
        </View>
      </BlurView>
    </View>
  );
}

function CourseHero({
  title,
  tagline,
  icon,
  accent,
  gradient,
  totalLessons,
  totalMin,
  completedLessons,
}: {
  title: string;
  tagline: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accent: string;
  gradient: readonly [string, string];
  totalLessons: number;
  totalMin: number;
  completedLessons: number;
}) {
  return (
    <View style={[styles.hero, { borderColor: `${accent}40` }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <View
          style={[styles.heroBadge, { backgroundColor: `${accent}26` }]}
        >
          <MaterialIcons name="auto-stories" size={12} color={accent} />
          <Text style={[styles.heroBadgeText, { color: accent }]}>
            Biblioteca de lecciones
          </Text>
        </View>
        <View style={styles.heroBody}>
          <View
            style={[styles.heroIcon, { borderColor: `${accent}66` }]}
          >
            <MaterialIcons name={icon} size={36} color={accent} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroTagline} numberOfLines={2}>
              {tagline}
            </Text>
          </View>
        </View>
        <View style={styles.heroMetaRow}>
          <HeroMeta
            icon="menu-book"
            value={`${totalLessons}`}
            label={totalLessons === 1 ? 'lección' : 'lecciones'}
          />
          <View style={styles.heroMetaDot} />
          <HeroMeta
            icon="schedule"
            value={`${totalMin}`}
            label="min totales"
          />
          {completedLessons > 0 && (
            <>
              <View style={styles.heroMetaDot} />
              <HeroMeta
                icon="check-circle"
                value={`${completedLessons}`}
                label={completedLessons === 1 ? 'dominado' : 'dominados'}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

function HeroMeta({
  icon,
  value,
  label,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.heroMetaItem}>
      <MaterialIcons name={icon} size={14} color={colors.outline} />
      <Text style={styles.heroMetaValue}>{value}</Text>
      <Text style={styles.heroMetaLabel}>{label}</Text>
    </View>
  );
}

function ModuleBlock({
  module,
  moduleIndex,
  palette,
  progress,
  onOpenLesson,
}: {
  module: ModuleWithLessons;
  moduleIndex: number;
  palette: CoursePalette;
  progress?: UserProgress | null;
  onOpenLesson?: (lesson: Lesson) => void;
}) {
  if (module.lessons.length === 0) return null;
  return (
    <View style={styles.moduleBlock}>
      <View style={styles.moduleHeader}>
        <View
          style={[
            styles.moduleNumber,
            { borderColor: `${palette.accent}66` },
          ]}
        >
          <Text style={[styles.moduleNumberText, { color: palette.accent }]}>
            {moduleIndex.toString().padStart(2, '0')}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.moduleLabel, { color: palette.accent }]}>
            {module.label}
          </Text>
          <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
        </View>
      </View>
      <View style={styles.lessonList}>
        {module.lessons.map((lesson, idx) => (
          <LessonCard
            key={lesson.topicId}
            lesson={lesson}
            position={idx + 1}
            total={module.lessons.length}
            accent={palette.accent}
            completed={isTopicCompleted(progress, lesson.topicId)}
            onPress={() => onOpenLesson?.(lesson)}
          />
        ))}
      </View>
    </View>
  );
}

function LessonCard({
  lesson,
  position,
  total,
  accent,
  completed,
  onPress,
}: {
  lesson: Lesson;
  position: number;
  total: number;
  accent: string;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressedSoft]}
    >
      <BlurView
        intensity={30}
        tint="dark"
        style={[
          styles.lessonCard,
          completed && {
            borderColor: `${colors.tertiaryBright}55`,
          },
        ]}
      >
        <View
          style={[
            styles.lessonIcon,
            { borderColor: completed ? colors.tertiaryBright : `${accent}66` },
          ]}
        >
          <MaterialIcons
            name={completed ? 'check-circle' : lesson.icon}
            size={26}
            color={completed ? colors.tertiaryBright : accent}
          />
        </View>
        <View style={styles.lessonBody}>
          <Text style={styles.lessonStep}>
            Lección {position} de {total}
          </Text>
          <Text style={styles.lessonTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={styles.lessonSummary} numberOfLines={2}>
            {lesson.summary}
          </Text>
          <View style={styles.lessonMeta}>
            <MaterialIcons name="schedule" size={12} color={colors.outline} />
            <Text style={styles.lessonMetaText}>{lesson.estimatedMin} min</Text>
            <View style={styles.lessonMetaDot} />
            <Text style={styles.lessonMetaText}>
              {lesson.concepts.length} conceptos
            </Text>
            {lesson.formula && (
              <>
                <View style={styles.lessonMetaDot} />
                <View style={styles.lessonMetaItem}>
                  <MaterialIcons
                    name="functions"
                    size={12}
                    color={colors.outline}
                  />
                  <Text style={styles.lessonMetaText}>fórmula</Text>
                </View>
              </>
            )}
            {completed && (
              <>
                <View style={styles.lessonMetaDot} />
                <Text
                  style={[
                    styles.lessonMetaText,
                    { color: colors.tertiaryBright },
                  ]}
                >
                  Dominado
                </Text>
              </>
            )}
          </View>
        </View>
        <MaterialIcons
          name="chevron-right"
          size={22}
          color={colors.outlineVariant}
        />
      </BlurView>
    </Pressable>
  );
}

function BackgroundDecor({ accent }: { accent: string }) {
  return (
    <>
      <View
        style={[styles.bgGlowTop, { backgroundColor: `${accent}1A` }]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.bgGlowBottom,
          { backgroundColor: `${colors.primaryContainer}14` },
        ]}
        pointerEvents="none"
      />
    </>
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
  bgGlowTop: {
    position: 'absolute',
    top: '8%',
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 200,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: '8%',
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 200,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.75)',
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
  hero: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 210,
    padding: spacing.md,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19, 17, 37, 0.35)',
  },
  heroContent: {
    gap: spacing.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(19, 17, 37, 0.45)',
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 26,
    color: colors.onSurface,
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  heroTagline: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.onSurfaceVariant,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    flexWrap: 'wrap',
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaValue: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: colors.onSurface,
  },
  heroMetaLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: colors.outline,
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.6,
  },
  modulesList: {
    gap: spacing.lg,
  },
  moduleBlock: {
    gap: spacing.sm,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    marginBottom: 2,
  },
  moduleNumber: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(19, 17, 37, 0.45)',
  },
  moduleNumberText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  moduleLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  moduleSubtitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.onSurface,
    letterSpacing: -0.2,
    marginTop: 1,
  },
  lessonList: {
    gap: spacing.sm,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
  },
  lessonIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(19, 17, 37, 0.45)',
  },
  lessonBody: {
    flex: 1,
    gap: 2,
  },
  lessonStep: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
    letterSpacing: 1.6,
    color: colors.outline,
    textTransform: 'uppercase',
  },
  lessonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
  },
  lessonSummary: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.onSurfaceVariant,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  lessonMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lessonMetaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 0.3,
  },
  lessonMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.5,
    marginHorizontal: 1,
  },
  pressedSoft: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
