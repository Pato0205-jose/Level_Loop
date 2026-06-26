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
import {
  getLesson,
  type Lesson,
  type LessonExample,
  type LessonSection,
  type WorkedExample,
} from '../constants/lessons';
import { hasExercises } from '../constants/exercises';

type Props = {
  topicId: string;
  onBack: () => void;
  onPractice?: (topicId: string, topicTitle: string) => void;
};

const COURSE_PALETTE: Record<
  Lesson['courseId'],
  { gradient: readonly [string, string]; accent: string; label: string }
> = {
  math: {
    gradient: ['rgba(81, 213, 255, 0.45)', 'rgba(81, 213, 255, 0.05)'],
    accent: colors.tertiaryBright,
    label: 'Matemáticas',
  },
  physics: {
    gradient: ['rgba(207, 189, 255, 0.45)', 'rgba(80, 21, 189, 0.1)'],
    accent: colors.primaryAccent,
    label: 'Física',
  },
  code: {
    gradient: ['rgba(49, 146, 253, 0.45)', 'rgba(49, 146, 253, 0.05)'],
    accent: colors.secondaryContainer,
    label: 'Programación',
  },
  english: {
    gradient: ['rgba(0, 193, 237, 0.4)', 'rgba(0, 75, 94, 0.1)'],
    accent: '#00c1ed',
    label: 'Inglés',
  },
};

export function LessonScreen({ topicId, onBack, onPractice }: Props) {
  const insets = useSafeAreaInsets();
  const lesson = useMemo(() => getLesson(topicId), [topicId]);
  const palette = lesson ? COURSE_PALETTE[lesson.courseId] : null;
  const canPractice = lesson ? hasExercises(lesson.topicId) : false;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  if (!lesson || !palette) {
    return (
      <View style={styles.root}>
        <BackgroundDecor />
        <View style={[styles.empty, { paddingTop: insets.top + 80 }]}>
          <Text style={styles.emptyTitle}>Lección no encontrada</Text>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressedSoft]}
          >
            <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
            <Text style={styles.backBtnText}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackgroundDecor />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 64 + spacing.md,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.hero, { borderColor: `${palette.accent}40` }]}>
          <LinearGradient
            colors={palette.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View
              style={[styles.heroBadge, { backgroundColor: `${palette.accent}33` }]}
            >
              <Text style={[styles.heroBadgeText, { color: palette.accent }]}>
                {palette.label}
              </Text>
            </View>
            <View
              style={[
                styles.heroIcon,
                {
                  borderColor: `${palette.accent}66`,
                  backgroundColor: 'rgba(19, 17, 37, 0.45)',
                },
              ]}
            >
              <MaterialIcons name={lesson.icon} size={42} color={palette.accent} />
            </View>
            <Text style={styles.heroTitle}>{lesson.title}</Text>
            <Text style={styles.heroSummary}>{lesson.summary}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaItem}>
                <MaterialIcons name="schedule" size={14} color={colors.outline} />
                <Text style={styles.heroMetaText}>{lesson.estimatedMin} min</Text>
              </View>
              <View style={styles.heroMetaDot} />
              <View style={styles.heroMetaItem}>
                <MaterialIcons
                  name="menu-book"
                  size={14}
                  color={colors.outline}
                />
                <Text style={styles.heroMetaText}>Lección teórica</Text>
              </View>
            </View>
          </View>
        </View>

        {lesson.formula && (
          <View
            style={[
              styles.formulaCard,
              { borderColor: `${palette.accent}66` },
            ]}
          >
            <Text style={[styles.formulaKicker, { color: palette.accent }]}>
              Fórmula principal
            </Text>
            <Text style={styles.formulaText}>{lesson.formula}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conceptos clave</Text>
          <View style={styles.conceptsList}>
            {lesson.concepts.map((concept, i) => (
              <ConceptItem
                key={i}
                index={i + 1}
                text={concept}
                accent={palette.accent}
              />
            ))}
          </View>
        </View>

        {lesson.sections && lesson.sections.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profundiza</Text>
            <View style={styles.sectionsList}>
              {lesson.sections.map((sec, i) => (
                <SectionCard
                  key={i}
                  section={sec}
                  accent={palette.accent}
                />
              ))}
            </View>
          </View>
        )}

        {lesson.examples && lesson.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ejemplos</Text>
            <View style={styles.examplesList}>
              {lesson.examples.map((ex, i) => (
                <ExampleCard
                  key={i}
                  example={ex}
                  accent={palette.accent}
                />
              ))}
            </View>
          </View>
        )}

        {lesson.workedExamples && lesson.workedExamples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ejercicio resuelto</Text>
            <View style={styles.examplesList}>
              {lesson.workedExamples.map((we, i) => (
                <WorkedCard
                  key={i}
                  worked={we}
                  accent={palette.accent}
                />
              ))}
            </View>
          </View>
        )}

        {lesson.commonMistakes && lesson.commonMistakes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Errores comunes</Text>
            <View style={styles.mistakesList}>
              {lesson.commonMistakes.map((m, i) => (
                <View key={i} style={styles.mistakeItem}>
                  <MaterialIcons
                    name="error-outline"
                    size={18}
                    color="#ffb86b"
                    style={styles.mistakeIcon}
                  />
                  <Text style={styles.mistakeText}>{m}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {lesson.recap && lesson.recap.length > 0 && (
          <View
            style={[
              styles.recapCard,
              { borderColor: `${palette.accent}55` },
            ]}
          >
            <View style={styles.recapHeader}>
              <MaterialIcons
                name="bookmark"
                size={20}
                color={palette.accent}
              />
              <Text style={[styles.recapTitle, { color: palette.accent }]}>
                Resumen
              </Text>
            </View>
            <View style={styles.recapList}>
              {lesson.recap.map((r, i) => (
                <View key={i} style={styles.recapRow}>
                  <View
                    style={[
                      styles.recapBullet,
                      { backgroundColor: palette.accent },
                    ]}
                  />
                  <Text style={styles.recapText}>{r}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {lesson.quizPrep && (
          <View
            style={[
              styles.quizPrepCard,
              { borderColor: `${palette.accent}66` },
            ]}
          >
            <MaterialIcons
              name="quiz"
              size={22}
              color={palette.accent}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.quizPrepText}>{lesson.quizPrep}</Text>
          </View>
        )}

        {lesson.tip && (
          <BlurView intensity={30} tint="dark" style={styles.tipCard}>
            <View
              style={[
                styles.tipIconWrap,
                { backgroundColor: `${colors.primaryAccent}26` },
              ]}
            >
              <MaterialIcons
                name="lightbulb"
                size={20}
                color={colors.primaryAccent}
              />
            </View>
            <View style={styles.tipBody}>
              <Text style={styles.tipKicker}>Tip</Text>
              <Text style={styles.tipText}>{lesson.tip}</Text>
            </View>
          </BlurView>
        )}
      </ScrollView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[styles.header, { paddingTop: insets.top, height: insets.top + 64 }]}
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
            Lección
          </Text>
          <View style={{ width: 26 }} />
        </View>
      </BlurView>

      {canPractice && (
        <View
          style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => onPractice?.(lesson.topicId, lesson.title)}
            style={({ pressed }) => [styles.cta, pressed && styles.pressedSoft]}
          >
            <LinearGradient
              colors={[colors.primaryContainer, colors.secondaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <MaterialIcons name="play-arrow" size={22} color="#ffffff" />
            <Text style={styles.ctaText}>Practicar ejercicios</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ConceptItem({
  index,
  text,
  accent,
}: {
  index: number;
  text: string;
  accent: string;
}) {
  return (
    <View style={styles.conceptItem}>
      <View style={[styles.conceptBullet, { borderColor: `${accent}66` }]}>
        <Text style={[styles.conceptBulletText, { color: accent }]}>{index}</Text>
      </View>
      <Text style={styles.conceptText}>{text}</Text>
    </View>
  );
}

function ExampleCard({
  example,
  accent,
}: {
  example: LessonExample;
  accent: string;
}) {
  return (
    <View style={[styles.exampleCard, { borderColor: `${accent}33` }]}>
      <Text style={[styles.exampleExpression, { color: accent }]}>
        {example.expression}
      </Text>
      {example.note && <Text style={styles.exampleNote}>{example.note}</Text>}
    </View>
  );
}

function SectionCard({
  section,
  accent,
}: {
  section: LessonSection;
  accent: string;
}) {
  return (
    <BlurView
      intensity={28}
      tint="dark"
      style={[styles.sectionCard, { borderColor: `${accent}33` }]}
    >
      <Text style={[styles.sectionCardTitle, { color: accent }]}>
        {section.title}
      </Text>
      <Text style={styles.sectionCardBody}>{section.body}</Text>
      {section.bullets && section.bullets.length > 0 && (
        <View style={styles.sectionBulletList}>
          {section.bullets.map((b, i) => (
            <View key={i} style={styles.sectionBulletRow}>
              <View
                style={[styles.sectionBulletDot, { backgroundColor: accent }]}
              />
              <Text style={styles.sectionBulletText}>{b}</Text>
            </View>
          ))}
        </View>
      )}
    </BlurView>
  );
}

function WorkedCard({
  worked,
  accent,
}: {
  worked: WorkedExample;
  accent: string;
}) {
  return (
    <BlurView
      intensity={28}
      tint="dark"
      style={[styles.workedCard, { borderColor: `${accent}55` }]}
    >
      <View style={styles.workedHeader}>
        <MaterialIcons name="play-arrow" size={18} color={accent} />
        <Text style={[styles.workedTitle, { color: accent }]}>
          {worked.title}
        </Text>
      </View>
      <View style={styles.workedSteps}>
        {worked.steps.map((step, i) => (
          <View key={i} style={styles.workedStepRow}>
            <View
              style={[
                styles.workedStepBadge,
                { backgroundColor: `${accent}33` },
              ]}
            >
              <Text style={[styles.workedStepBadgeText, { color: accent }]}>
                {i + 1}
              </Text>
            </View>
            <Text style={styles.workedStepText}>{step}</Text>
          </View>
        ))}
      </View>
    </BlurView>
  );
}

function BackgroundDecor() {
  return (
    <>
      <View style={styles.bgGlowTop} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />
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
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: colors.onSurface,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  bgGlowTop: {
    position: 'absolute',
    top: '15%',
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: `${colors.primaryContainer}1A`,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: '15%',
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 200,
    backgroundColor: `${colors.secondaryContainer}1A`,
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
    backgroundColor: 'rgba(19, 17, 37, 0.75)',
    overflow: 'hidden',
  },
  headerRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: colors.onSurface,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.lg,
    paddingTop: spacing.md + 4,
    gap: spacing.sm,
  },
  heroContent: {
    gap: spacing.sm,
  },
  heroBadge: {
    alignSelf: 'flex-start',
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
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 28,
    color: colors.onSurface,
    letterSpacing: -0.4,
    lineHeight: 32,
  },
  heroSummary: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  heroMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroMetaText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: colors.outline,
    letterSpacing: 0.4,
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.outline,
    opacity: 0.6,
  },
  formulaCard: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    alignItems: 'center',
    gap: 6,
  },
  formulaKicker: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  formulaText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: 1.5,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: colors.onSurface,
    letterSpacing: -0.2,
  },
  conceptsList: {
    gap: spacing.sm,
  },
  conceptItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(148, 142, 160, 0.15)',
    backgroundColor: 'rgba(32, 29, 50, 0.45)',
  },
  conceptBullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: 'rgba(19, 17, 37, 0.45)',
    marginTop: 1,
  },
  conceptBulletText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  conceptText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 15,
    lineHeight: 22,
    color: colors.onSurface,
  },
  examplesList: {
    gap: spacing.sm,
  },
  exampleCard: {
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    gap: 6,
  },
  exampleExpression: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    letterSpacing: 0.3,
    lineHeight: 24,
  },
  exampleNote: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${colors.primaryAccent}40`,
    backgroundColor: 'rgba(80, 21, 189, 0.18)',
    overflow: 'hidden',
  },
  tipIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBody: {
    flex: 1,
    gap: 2,
  },
  tipKicker: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.primaryAccent,
  },
  tipText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  ctaText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  pressedSoft: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  sectionsList: {
    gap: spacing.sm,
  },
  sectionCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(32, 29, 50, 0.5)',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  sectionCardTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    letterSpacing: -0.2,
  },
  sectionCardBody: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    lineHeight: 21,
    color: colors.onSurface,
  },
  sectionBulletList: {
    gap: 6,
    marginTop: 4,
  },
  sectionBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  sectionBulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  sectionBulletText: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurfaceVariant,
  },
  workedCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    overflow: 'hidden',
    gap: spacing.sm,
  },
  workedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workedTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  workedSteps: {
    gap: spacing.sm,
  },
  workedStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  workedStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  workedStepBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },
  workedStepText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
  mistakesList: {
    gap: spacing.xs,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 107, 0.35)',
    backgroundColor: 'rgba(255, 184, 107, 0.08)',
  },
  mistakeIcon: {
    marginTop: 1,
  },
  mistakeText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 13,
    lineHeight: 19,
    color: colors.onSurface,
  },
  recapCard: {
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(32, 29, 50, 0.55)',
    gap: spacing.sm,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recapTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  recapList: {
    gap: 6,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  recapBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  recapText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
  quizPrepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: 'rgba(80, 21, 189, 0.18)',
  },
  quizPrepText: {
    flex: 1,
    fontFamily: 'Poppins_500Medium',
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurface,
  },
});
