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
import { useEffect, useMemo, useRef } from 'react';
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
import {
  buildDynamicRoadmap,
  type RoadmapModule,
  type RoadmapNode,
} from '../constants/roadmaps';
import type { UserProgress } from '../services/progress';

type Props = {
  courseId?: string;
  progress?: UserProgress | null;
  onBack: () => void;
  /** Llamado por el FAB "Continuar última lección" (va directo al ejercicio). */
  onSelectTopic?: (node: RoadmapNode) => void;
  /** Llamado al tocar un nodo del roadmap (abre la lección teórica). */
  onSelectLesson?: (topicId: string, topicTitle: string) => void;
};

export function CourseRoadmapScreen({
  courseId,
  progress,
  onBack,
  onSelectTopic,
  onSelectLesson,
}: Props) {
  const insets = useSafeAreaInsets();
  const roadmap = useMemo(
    () => buildDynamicRoadmap(courseId, progress),
    [courseId, progress],
  );

  const activeNode = useMemo(() => {
    for (const m of roadmap.modules) {
      const n = m.nodes.find((node) => node.status === 'active');
      if (n) return n;
    }
    return undefined;
  }, [roadmap]);

  const handleNodePress = (node: RoadmapNode) => {
    if (node.status === 'locked') return;
    onSelectLesson?.(node.id, node.title);
  };

  const handleContinue = () => {
    if (activeNode) onSelectTopic?.(activeNode);
  };

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return <View style={styles.root} />;
  }

  const headerHeight = 96;
  const headerTopPad = insets.top;

  return (
    <View style={styles.root}>
      <TechnicalGrid />
      <View style={styles.bgGlowTop} pointerEvents="none" />
      <View style={styles.bgGlowBottom} pointerEvents="none" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerTopPad + headerHeight + spacing.md,
            paddingBottom: insets.bottom + 140,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.roadmap}>
          <RoadmapLine />
          {roadmap.modules.map((module, idx) => (
            <ModuleBlock
              key={module.id}
              module={module}
              isFirst={idx === 0}
              onSelectTopic={handleNodePress}
            />
          ))}
          <RoadmapEnd progress={roadmap.progress} />
        </View>
      </ScrollView>

      <BlurView
        intensity={50}
        tint="dark"
        style={[
          styles.header,
          {
            paddingTop: headerTopPad,
            height: headerTopPad + headerHeight,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
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
            <Text style={styles.headerTitle} numberOfLines={1}>
              {roadmap.title}
            </Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>
              {roadmap.progress}% completado
            </Text>
          </View>
        </View>
        <View style={styles.headerProgressTrack}>
          <View
            style={[
              styles.headerProgressFill,
              { width: `${roadmap.progress}%` },
            ]}
          />
        </View>
      </BlurView>

      <View
        style={[styles.fabWrap, { bottom: insets.bottom + spacing.md + 16 }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleContinue}
          disabled={!activeNode}
          style={({ pressed }) => [
            styles.fab,
            !activeNode && styles.fabDisabled,
            pressed && styles.fabPressed,
          ]}
        >
          <LinearGradient
            colors={[colors.primaryContainer, colors.secondaryContainer]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.fabIconWrap}>
            <MaterialIcons name="play-arrow" size={22} color="#ffffff" />
          </View>
          <Text style={styles.fabText}>Practicar tema actual</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TechnicalGrid() {
  return (
    <View style={styles.gridBg} pointerEvents="none">
      {Array.from({ length: 16 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={[styles.gridLineH, { top: i * 40 + 40 }]}
        />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <View
          key={`v-${i}`}
          style={[styles.gridLineV, { left: i * 40 + 40 }]}
        />
      ))}
    </View>
  );
}

function RoadmapLine() {
  return (
    <View style={styles.roadmapLineWrap} pointerEvents="none">
      <LinearGradient
        colors={[
          colors.tertiaryBright,
          colors.secondaryContainer,
          colors.tertiaryBright,
          'rgba(81, 213, 255, 0)',
        ]}
        locations={[0, 0.4, 0.85, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.roadmapLine}
      />
    </View>
  );
}

function RoadmapEnd({ progress }: { progress: number }) {
  const completed = progress >= 100;
  return (
    <View style={styles.endWrap}>
      <View style={styles.endDivider}>
        <View style={styles.endDividerLine} />
        <Text style={styles.endDividerLabel}>FIN DEL RECORRIDO</Text>
        <View style={styles.endDividerLine} />
      </View>

      <View style={styles.endNodeWrap}>
        <View style={styles.endHaloOuter} pointerEvents="none" />
        <View
          style={[
            styles.endNode,
            completed && styles.endNodeCompleted,
          ]}
        >
          <LinearGradient
            colors={
              completed
                ? [colors.primaryAccent, colors.tertiaryBright]
                : [
                    `${colors.primaryContainer}66`,
                    `${colors.secondaryContainer}33`,
                  ]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <MaterialIcons
            name="emoji-events"
            size={48}
            color={completed ? '#001f28' : colors.primaryAccent}
          />
        </View>
      </View>

      <View style={styles.endLabelWrap}>
        <Text style={styles.endLabel}>Meta del curso</Text>
        <Text style={styles.endHint}>
          {completed
            ? '¡Curso dominado!'
            : 'Completa todos los módulos para conquistarlo'}
        </Text>
      </View>
    </View>
  );
}

function ModuleBlock({
  module,
  isFirst,
  onSelectTopic,
}: {
  module: RoadmapModule;
  isFirst: boolean;
  onSelectTopic: (node: RoadmapNode) => void;
}) {
  return (
    <View style={[styles.moduleBlock, !isFirst && { marginTop: spacing.lg }]}>
      <View style={styles.moduleDivider}>
        <View style={styles.dividerLine} />
        <Text style={styles.moduleLabel}>
          {module.label} — {module.subtitle}
        </Text>
        <View style={styles.dividerLine} />
      </View>
      <View style={styles.nodesGroup}>
        {module.nodes.map((node) => (
          <RoadmapNodeView
            key={node.id}
            node={node}
            onPress={() => onSelectTopic(node)}
          />
        ))}
      </View>
    </View>
  );
}

function RoadmapNodeView({
  node,
  onPress,
}: {
  node: RoadmapNode;
  onPress: () => void;
}) {
  const pressable = node.status !== 'locked';
  const content =
    node.status === 'active' ? (
      <ActiveNode node={node} />
    ) : (
      <StaticNode node={node} />
    );
  if (!pressable) return content;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.nodePressable,
        pressed && styles.nodePressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

function ActiveNode({ node }: { node: RoadmapNode }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.42],
  });
  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  return (
    <View style={styles.nodeWrap}>
      <View style={styles.nodeRingWrap}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeHalo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />
        <BlurView intensity={30} tint="dark" style={styles.activeNode}>
          <MaterialIcons name={node.icon} size={42} color="#a6c8ff" />
        </BlurView>
      </View>
      <View style={styles.nodeLabelWrap}>
        <Text style={[styles.nodeTitle, styles.nodeTitleActive]} numberOfLines={2}>
          {node.title}
        </Text>
        <View style={[styles.nodeBadge, styles.nodeBadgeActive]}>
          <Text style={[styles.nodeBadgeText, styles.nodeBadgeTextActive]}>
            Actual
          </Text>
        </View>
      </View>
    </View>
  );
}

function StaticNode({ node }: { node: RoadmapNode }) {
  const isCompleted = node.status === 'completed';
  const isLocked = node.status === 'locked';

  const iconName: keyof typeof MaterialIcons.glyphMap = isCompleted
    ? 'check-circle'
    : node.icon;

  return (
    <View
      style={[
        styles.nodeWrap,
        isLocked && (node.dim ? styles.nodeDim : styles.nodeMuted),
      ]}
    >
      <View style={styles.nodeRingWrap}>
        <BlurView
          intensity={25}
          tint="dark"
          style={[
            styles.staticNode,
            isCompleted && styles.staticNodeCompleted,
            isLocked && styles.staticNodeLocked,
          ]}
        >
          <MaterialIcons
            name={iconName}
            size={isCompleted ? 32 : 28}
            color={
              isCompleted
                ? colors.tertiaryBright
                : node.dim
                  ? `${colors.outline}66`
                  : colors.outline
            }
          />
        </BlurView>
      </View>
      <View style={styles.nodeLabelWrap}>
        <Text
          style={[
            styles.nodeTitle,
            isLocked && styles.nodeTitleLocked,
            node.dim && styles.nodeTitleDim,
          ]}
          numberOfLines={2}
        >
          {node.title}
        </Text>
        {isCompleted && (
          <View style={[styles.nodeBadge, styles.nodeBadgeCompleted]}>
            <Text style={[styles.nodeBadgeText, styles.nodeBadgeTextCompleted]}>
              Completado
            </Text>
          </View>
        )}
        {isLocked && !node.dim && (
          <View style={[styles.nodeBadge, styles.nodeBadgeLocked]}>
            <Text style={[styles.nodeBadgeText, styles.nodeBadgeTextLocked]}>
              Bloqueado
            </Text>
          </View>
        )}
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
  gridBg: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(148, 142, 160, 0.05)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(148, 142, 160, 0.05)',
  },
  bgGlowTop: {
    position: 'absolute',
    top: '20%',
    left: -80,
    width: 256,
    height: 256,
    borderRadius: 200,
    backgroundColor: `${colors.primaryContainer}1A`,
  },
  bgGlowBottom: {
    position: 'absolute',
    bottom: '20%',
    right: -80,
    width: 256,
    height: 256,
    borderRadius: 200,
    backgroundColor: `${colors.secondaryContainer}1A`,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: spacing.md,
    justifyContent: 'flex-end',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.outlineVariant}33`,
    backgroundColor: 'rgba(19, 17, 37, 0.8)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 24,
    color: colors.onSurface,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(166, 200, 255, 0.3)',
    backgroundColor: 'rgba(49, 146, 253, 0.2)',
  },
  progressBadgeText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    color: '#a6c8ff',
    letterSpacing: 0.4,
  },
  headerProgressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainerHighest,
    overflow: 'hidden',
  },
  headerProgressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#a6c8ff',
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.lg,
  },
  roadmap: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    position: 'relative',
  },
  roadmapLineWrap: {
    position: 'absolute',
    top: 0,
    bottom: 220,
    left: '50%',
    marginLeft: -2,
    width: 4,
    zIndex: 0,
  },
  roadmapLine: {
    flex: 1,
    borderRadius: 2,
    opacity: 0.45,
  },
  moduleBlock: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 1,
  },
  moduleDivider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${colors.outlineVariant}4D`,
  },
  moduleLabel: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.outline,
    textTransform: 'uppercase',
    textAlign: 'center',
    flexShrink: 1,
  },
  endWrap: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg + spacing.md,
    zIndex: 1,
  },
  endDivider: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  endDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: `${colors.primaryAccent}33`,
  },
  endDividerLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 3,
    color: colors.primaryAccent,
    textTransform: 'uppercase',
  },
  endNodeWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  endHaloOuter: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: `${colors.primaryAccent}10`,
  },
  endNode: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: `${colors.primaryAccent}80`,
    overflow: 'hidden',
    shadowColor: colors.primaryAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  endNodeCompleted: {
    borderColor: colors.primaryAccent,
  },
  endLabelWrap: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
  },
  endLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 22,
    color: colors.onSurface,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  endHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 18,
  },
  nodesGroup: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.lg + spacing.sm,
    marginTop: spacing.sm,
  },
  nodeWrap: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1,
  },
  nodePressable: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  nodePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  nodeMuted: {
    opacity: 0.6,
  },
  nodeDim: {
    opacity: 0.4,
  },
  nodeRingWrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeHalo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 80,
    backgroundColor: '#a6c8ff',
  },
  activeNode: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#a6c8ff',
    backgroundColor: 'rgba(49, 146, 253, 0.18)',
    overflow: 'hidden',
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
  },
  staticNode: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(32, 29, 50, 0.4)',
  },
  staticNodeCompleted: {
    borderColor: colors.tertiaryBright,
    shadowColor: colors.tertiaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  staticNodeLocked: {
    borderColor: `${colors.outline}33`,
    backgroundColor: 'rgba(42, 39, 61, 0.4)',
  },
  nodeLabelWrap: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },
  nodeTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 22,
    lineHeight: 26,
    color: colors.onSurface,
    textAlign: 'center',
  },
  nodeTitleActive: {
    fontFamily: 'Poppins_700Bold',
  },
  nodeTitleLocked: {
    color: colors.onSurfaceVariant,
  },
  nodeTitleDim: {
    color: `${colors.onSurfaceVariant}66`,
  },
  nodeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  nodeBadgeActive: {
    backgroundColor: '#3192fd',
    borderColor: 'rgba(166, 200, 255, 0.5)',
    shadowColor: '#a6c8ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  nodeBadgeCompleted: {
    backgroundColor: `${colors.tertiaryBright}1A`,
    borderColor: `${colors.tertiaryBright}33`,
  },
  nodeBadgeLocked: {
    backgroundColor: colors.surfaceContainerHighest,
    borderColor: 'transparent',
  },
  nodeBadgeText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  nodeBadgeTextActive: {
    color: '#001c3b',
  },
  nodeBadgeTextCompleted: {
    color: colors.tertiaryBright,
  },
  nodeBadgeTextLocked: {
    color: `${colors.onSurfaceVariant}80`,
  },
  fabWrap: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 60,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.primaryContainer,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  fabPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.97 }],
  },
  fabDisabled: {
    opacity: 0.4,
  },
  fabIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  fabText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
    color: '#ffffff',
    paddingRight: 4,
  },
  pressed: {
    opacity: 0.7,
  },
});
