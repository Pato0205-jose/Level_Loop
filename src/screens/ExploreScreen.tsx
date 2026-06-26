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
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomNav, bottomNavHeight, type MainTab } from '../components/BottomNav';
import { androidTextInputProps } from '../components/GlassPanel';
import { colors, spacing } from '../constants/theme';
import { getAllLessons, type Lesson } from '../constants/lessons';
import { getCourseProgressPct } from '../constants/roadmaps';
import { isTopicCompleted, type UserProgress } from '../services/progress';
import type { Course } from './DashboardScreen';

type Props = {
  progress?: UserProgress | null;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onOpenLesson?: (lesson: Lesson) => void;
  onSelectCourse?: (course: Course) => void;
};

type Category = 'todo' | 'math' | 'physics' | 'code' | 'english';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'todo', label: 'Todo' },
  { id: 'math', label: 'Matemáticas' },
  { id: 'physics', label: 'Física' },
  { id: 'code', label: 'Programación' },
  { id: 'english', label: 'Inglés' },
];

const COURSE_META: Record<
  string,
  {
    title: string;
    level: Course['level'];
    icon: keyof typeof MaterialIcons.glyphMap;
    accent: string;
    gradient: readonly [string, string];
    tagline: string;
  }
> = {
  math: {
    title: 'Matemáticas',
    level: 'Intermedio',
    icon: 'calculate',
    accent: colors.tertiaryBright,
    gradient: ['rgba(81, 213, 255, 0.35)', 'rgba(81, 213, 255, 0.05)'],
    tagline: 'Lógica y números desde lo esencial.',
  },
  physics: {
    title: 'Física',
    level: 'Avanzado',
    icon: 'science',
    accent: colors.primaryAccent,
    gradient: ['rgba(207, 189, 255, 0.35)', 'rgba(80, 21, 189, 0.1)'],
    tagline: 'Movimiento, fuerza y energía.',
  },
  code: {
    title: 'Programación',
    level: 'Iniciado',
    icon: 'code',
    accent: colors.secondaryContainer,
    gradient: ['rgba(49, 146, 253, 0.35)', 'rgba(49, 146, 253, 0.05)'],
    tagline: 'Web y JavaScript paso a paso.',
  },
  english: {
    title: 'Inglés',
    level: 'Maestro',
    icon: 'translate',
    accent: '#00c1ed',
    gradient: ['rgba(0, 193, 237, 0.3)', 'rgba(0, 75, 94, 0.1)'],
    tagline: 'Saludos, verbos y vocabulario base.',
  },
};

const COURSE_ORDER: Array<keyof typeof COURSE_META> = [
  'math',
  'physics',
  'code',
  'english',
];

type CourseSummary = {
  course: Course;
  meta: (typeof COURSE_META)[string];
  progress: number;
  totalLessons: number;
  totalMin: number;
};

export function ExploreScreen({
  progress,
  activeTab,
  onTabChange,
  onOpenLesson,
  onSelectCourse,
}: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('todo');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const allLessons = useMemo(() => getAllLessons(), []);

  const courseSummaries: CourseSummary[] = useMemo(() => {
    return COURSE_ORDER.map((id) => {
      const meta = COURSE_META[id];
      const pct = getCourseProgressPct(id, progress);
      const lessonsOfCourse = allLessons.filter((l) => l.courseId === id);
      const totalMin = lessonsOfCourse.reduce(
        (sum, l) => sum + l.estimatedMin,
        0,
      );
      const course: Course = {
        id,
        title: meta.title,
        level: meta.level,
        icon: meta.icon,
        accent: meta.accent,
        gradient: meta.gradient,
      };
      return {
        course,
        meta,
        progress: pct,
        totalLessons: lessonsOfCourse.length,
        totalMin,
      };
    });
  }, [allLessons, progress]);

  const recommendedCourse = useMemo(() => {
    return (
      [...courseSummaries].sort((a, b) => a.progress - b.progress)[0] ??
      courseSummaries[0]
    );
  }, [courseSummaries]);

  const recommendedLessons = useMemo(() => {
    const pool =
      activeCategory === 'todo'
        ? allLessons
        : allLessons.filter((l) => l.courseId === activeCategory);
    const picks = [
      'simplify',
      'speed',
      'flex',
      'howareyou',
      'order',
      'force',
      'js-vars',
      'numbers',
    ];
    return picks
      .map((id) => pool.find((l) => l.topicId === id))
      .filter((l): l is Lesson => !!l)
      .slice(0, 6);
  }, [allLessons, activeCategory]);

  const searchActive = search.trim().length > 0;
  const query = search.trim().toLowerCase();

  const searchedCourses = useMemo(() => {
    if (!searchActive) return [];
    return courseSummaries.filter((s) =>
      s.meta.title.toLowerCase().includes(query),
    );
  }, [searchActive, courseSummaries, query]);

  const searchedLessons = useMemo(() => {
    if (!searchActive) return [];
    return allLessons.filter(
      (l) =>
        l.title.toLowerCase().includes(query) ||
        l.summary.toLowerCase().includes(query),
    );
  }, [searchActive, allLessons, query]);

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  return (
    <View style={styles.root}>
      <TechnicalPattern />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 64 + spacing.md,
            paddingBottom: insets.bottom + bottomNavHeight + spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBar,
              searchFocused && styles.searchBarFocused,
            ]}
          >
            <MaterialIcons
              name="search"
              size={22}
              color={searchFocused ? colors.tertiaryBright : colors.outline}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar cursos, lecciones, temas..."
              placeholderTextColor={`${colors.outline}99`}
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              {...androidTextInputProps}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={colors.outline} />
              </Pressable>
            )}
          </View>
        </View>

        {searchActive ? (
          <SearchResults
            courses={searchedCourses}
            lessons={searchedLessons}
            query={search}
            completedTopicIds={Object.entries(progress?.topics ?? {})
              .filter(([, t]) => t.completed)
              .map(([id]) => id)}
            onSelectCourse={onSelectCourse}
            onOpenLesson={onOpenLesson}
          />
        ) : (
          <>
            <RecommendedHero
              summary={recommendedCourse}
              onPress={() =>
                recommendedCourse && onSelectCourse?.(recommendedCourse.course)
              }
            />

            <Section
              title="Materias"
              subtitle={`${courseSummaries.length} cursos disponibles`}
            >
              <View style={styles.coursesList}>
                {courseSummaries.map((summary) => (
                  <CourseCatalogRow
                    key={summary.course.id}
                    summary={summary}
                    onPress={() => onSelectCourse?.(summary.course)}
                  />
                ))}
              </View>
            </Section>

            <Section
              title="Lecciones recomendadas"
              subtitle="Repasos cortos para hacer ahora"
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
              >
                {CATEGORIES.map((cat) => {
                  const active = cat.id === activeCategory;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setActiveCategory(cat.id)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {recommendedLessons.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>
                    No hay lecciones destacadas en esta categoría.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.featuredRow}
                >
                  {recommendedLessons.map((lesson) => (
                    <FeaturedLessonCard
                      key={lesson.topicId}
                      lesson={lesson}
                      completed={isTopicCompleted(progress, lesson.topicId)}
                      onPress={() => onOpenLesson?.(lesson)}
                    />
                  ))}
                </ScrollView>
              )}
            </Section>
          </>
        )}
      </ScrollView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[styles.header, { paddingTop: insets.top, height: insets.top + 64 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarRing} />
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={styles.avatarDot} />
          </View>
          <Text style={styles.headerTitle}>Explorar</Text>
          <View style={{ width: 40 }} />
        </View>
      </BlurView>

      <BottomNav activeTab={activeTab} onTabChange={onTabChange} />
    </View>
  );
}

function TechnicalPattern() {
  return (
    <View style={styles.bg} pointerEvents="none">
      <View style={styles.bgGlow} />
    </View>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {children}
    </View>
  );
}

function RecommendedHero({
  summary,
  onPress,
}: {
  summary: CourseSummary | undefined;
  onPress: () => void;
}) {
  if (!summary) return null;
  const { course, meta, progress, totalLessons, totalMin } = summary;
  return (
    <View style={styles.heroWrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View
          style={[styles.heroCard, { borderColor: `${course.accent}40` }]}
        >
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View
              style={[
                styles.heroKicker,
                { backgroundColor: `${course.accent}33` },
              ]}
            >
              <MaterialIcons
                name="auto-awesome"
                size={12}
                color={course.accent}
              />
              <Text style={[styles.heroKickerText, { color: course.accent }]}>
                Recomendado para ti
              </Text>
            </View>
            <View style={styles.heroBody}>
              <View
                style={[
                  styles.heroIcon,
                  {
                    borderColor: `${course.accent}66`,
                  },
                ]}
              >
                <MaterialIcons
                  name={course.icon}
                  size={36}
                  color={course.accent}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.heroTitle}>{course.title}</Text>
                <Text style={styles.heroTagline} numberOfLines={2}>
                  {meta.tagline}
                </Text>
              </View>
            </View>
            <View style={styles.heroMetaRow}>
              <HeroMeta
                icon="menu-book"
                value={`${totalLessons}`}
                label="lecciones"
              />
              <View style={styles.heroMetaDot} />
              <HeroMeta
                icon="schedule"
                value={`${totalMin}`}
                label="min totales"
              />
              <View style={styles.heroMetaDot} />
              <HeroMeta icon="trending-up" value={`${progress}%`} label="" />
            </View>
            <View style={styles.heroCta}>
              <Text style={[styles.heroCtaText, { color: course.accent }]}>
                Ver curso completo
              </Text>
              <MaterialIcons
                name="arrow-forward"
                size={18}
                color={course.accent}
              />
            </View>
          </View>
        </View>
      </Pressable>
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
      {label.length > 0 && <Text style={styles.heroMetaLabel}>{label}</Text>}
    </View>
  );
}

function CourseCatalogRow({
  summary,
  onPress,
}: {
  summary: CourseSummary;
  onPress: () => void;
}) {
  const { course, meta, totalLessons, totalMin, progress } = summary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <BlurView intensity={30} tint="dark" style={styles.courseRow}>
        <View style={styles.courseThumb}>
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialIcons name={course.icon} size={36} color={course.accent} />
        </View>
        <View style={styles.courseBody}>
          <View style={styles.courseTopRow}>
            <Text style={styles.courseTitle} numberOfLines={1}>
              {course.title}
            </Text>
            <View
              style={[
                styles.courseLevelBadge,
                { borderColor: `${course.accent}66` },
              ]}
            >
              <Text style={[styles.courseLevelText, { color: course.accent }]}>
                {course.level}
              </Text>
            </View>
          </View>
          <Text style={styles.courseTagline} numberOfLines={2}>
            {meta.tagline}
          </Text>
          <View style={styles.courseMetaRow}>
            <View style={styles.courseMetaItem}>
              <MaterialIcons name="menu-book" size={13} color={colors.outline} />
              <Text style={styles.courseMetaText}>{totalLessons} lecciones</Text>
            </View>
            <View style={styles.courseMetaDot} />
            <View style={styles.courseMetaItem}>
              <MaterialIcons name="schedule" size={13} color={colors.outline} />
              <Text style={styles.courseMetaText}>{totalMin} min</Text>
            </View>
            <View style={styles.courseMetaDot} />
            <View style={styles.courseMetaItem}>
              <MaterialIcons
                name="trending-up"
                size={13}
                color={course.accent}
              />
              <Text style={[styles.courseMetaText, { color: course.accent }]}>
                {progress}%
              </Text>
            </View>
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

function FeaturedLessonCard({
  lesson,
  completed,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
}) {
  const meta = COURSE_META[lesson.courseId];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <BlurView intensity={30} tint="dark" style={styles.featuredCard}>
        <View style={styles.featuredThumb}>
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialIcons name={lesson.icon} size={46} color={meta.accent} />
          <View
            style={[
              styles.featuredBadge,
              {
                backgroundColor: `${meta.accent}33`,
                borderColor: `${meta.accent}4D`,
              },
            ]}
          >
            <Text style={[styles.featuredBadgeText, { color: meta.accent }]}>
              {meta.title}
            </Text>
          </View>
          {completed && (
            <View style={styles.featuredCheck}>
              <MaterialIcons
                name="check"
                size={14}
                color="#001f28"
              />
            </View>
          )}
        </View>
        <View style={styles.featuredBody}>
          <Text style={styles.featuredTitle} numberOfLines={2}>
            {lesson.title}
          </Text>
          <Text style={styles.featuredSummary} numberOfLines={2}>
            {lesson.summary}
          </Text>
          <View style={styles.featuredMeta}>
            <MaterialIcons name="schedule" size={14} color={colors.outline} />
            <Text style={styles.featuredMetaText}>{lesson.estimatedMin} min</Text>
            {completed && (
              <>
                <View style={styles.featuredMetaDot} />
                <Text
                  style={[
                    styles.featuredMetaText,
                    { color: colors.tertiaryBright },
                  ]}
                >
                  Dominado
                </Text>
              </>
            )}
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}

function SearchResults({
  courses,
  lessons,
  query,
  completedTopicIds,
  onSelectCourse,
  onOpenLesson,
}: {
  courses: CourseSummary[];
  lessons: Lesson[];
  query: string;
  completedTopicIds: string[];
  onSelectCourse?: (course: Course) => void;
  onOpenLesson?: (lesson: Lesson) => void;
}) {
  const totalResults = courses.length + lessons.length;
  if (totalResults === 0) {
    return (
      <View style={styles.searchEmpty}>
        <MaterialIcons name="search-off" size={42} color={colors.outline} />
        <Text style={styles.searchEmptyTitle}>Sin resultados</Text>
        <Text style={styles.searchEmptyText}>
          No encontramos nada para “{query.trim()}”. Prueba con otra palabra.
        </Text>
      </View>
    );
  }
  return (
    <>
      {courses.length > 0 && (
        <Section
          title="Cursos"
          subtitle={`${courses.length} ${courses.length === 1 ? 'resultado' : 'resultados'}`}
        >
          <View style={styles.coursesList}>
            {courses.map((summary) => (
              <CourseCatalogRow
                key={summary.course.id}
                summary={summary}
                onPress={() => onSelectCourse?.(summary.course)}
              />
            ))}
          </View>
        </Section>
      )}
      {lessons.length > 0 && (
        <Section
          title="Lecciones"
          subtitle={`${lessons.length} ${lessons.length === 1 ? 'resultado' : 'resultados'}`}
        >
          <View style={styles.searchLessonList}>
            {lessons.map((lesson) => (
              <SearchLessonRow
                key={lesson.topicId}
                lesson={lesson}
                completed={completedTopicIds.includes(lesson.topicId)}
                onPress={() => onOpenLesson?.(lesson)}
              />
            ))}
          </View>
        </Section>
      )}
    </>
  );
}

function SearchLessonRow({
  lesson,
  completed,
  onPress,
}: {
  lesson: Lesson;
  completed: boolean;
  onPress: () => void;
}) {
  const meta = COURSE_META[lesson.courseId];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
    >
      <BlurView intensity={30} tint="dark" style={styles.searchLessonRow}>
        <View style={styles.searchLessonThumb}>
          <LinearGradient
            colors={meta.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialIcons name={lesson.icon} size={26} color={meta.accent} />
          {completed && (
            <View style={styles.searchLessonCheck}>
              <MaterialIcons name="check" size={12} color="#001f28" />
            </View>
          )}
        </View>
        <View style={styles.searchLessonBody}>
          <Text style={[styles.searchLessonCourse, { color: meta.accent }]}>
            {meta.title}
          </Text>
          <Text style={styles.searchLessonTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={styles.searchLessonSummary} numberOfLines={2}>
            {lesson.summary}
          </Text>
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  bg: {
    ...StyleSheet.absoluteFill,
  },
  bgGlow: {
    position: 'absolute',
    top: -120,
    left: '20%',
    right: '20%',
    height: 280,
    borderRadius: 200,
    backgroundColor: `${colors.tertiaryBright}10`,
  },
  scrollContent: {
    gap: spacing.md,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(19, 17, 37, 0.7)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    gap: spacing.base,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  avatarRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    padding: 2,
  },
  avatarDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.tertiaryBright,
    borderWidth: 2,
    borderColor: colors.background,
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.primaryAccent,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
  },
  searchBarFocused: {
    borderColor: `${colors.tertiaryBright}80`,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: colors.onSurface,
    paddingVertical: 4,
    outlineStyle: 'none' as never,
  },
  heroWrap: {
    paddingHorizontal: spacing.md,
  },
  heroCard: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 220,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19, 17, 37, 0.35)',
  },
  heroContent: {
    gap: spacing.sm,
  },
  heroKicker: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroKickerText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.base,
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
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: -0.4,
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
    marginLeft: 2,
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.6,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  heroCtaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  categoriesRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.base,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.4)',
  },
  chipActive: {
    borderColor: `${colors.tertiaryBright}66`,
    backgroundColor: `${colors.tertiaryBright}1A`,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  chipText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    letterSpacing: 0.5,
  },
  chipTextActive: {
    color: colors.tertiaryBright,
    fontFamily: 'Poppins_600SemiBold',
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.outline,
  },
  coursesList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  courseThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseBody: {
    flex: 1,
    gap: 4,
  },
  courseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  courseTitle: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 17,
    color: colors.onSurface,
  },
  courseLevelBadge: {
    paddingHorizontal: spacing.base + 2,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  courseLevelText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  courseTagline: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.onSurfaceVariant,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  courseMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseMetaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
    color: colors.outline,
    letterSpacing: 0.3,
  },
  courseMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.5,
    marginHorizontal: 1,
  },
  featuredRow: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  featuredCard: {
    width: 248,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  featuredThumb: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.base + 2,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  featuredBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  featuredBody: {
    padding: spacing.md,
    gap: 4,
  },
  featuredTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    lineHeight: 21,
    color: colors.onSurface,
  },
  featuredSummary: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: `${colors.onSurfaceVariant}B3`,
    marginBottom: spacing.base,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featuredMetaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.outline,
  },
  featuredMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.5,
    marginHorizontal: 2,
  },
  featuredCheck: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiaryBright,
    borderWidth: 1.5,
    borderColor: '#001f28',
  },
  searchLessonCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.tertiaryBright,
    borderWidth: 1,
    borderColor: '#001f28',
  },
  searchLessonList: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchLessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(207, 189, 255, 0.1)',
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
  },
  searchLessonThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLessonBody: {
    flex: 1,
    gap: 2,
  },
  searchLessonCourse: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  searchLessonTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: colors.onSurface,
  },
  searchLessonSummary: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: colors.onSurfaceVariant,
  },
  searchEmpty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg + spacing.md,
    paddingHorizontal: spacing.md,
  },
  searchEmptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
  },
  searchEmptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.outline,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});
