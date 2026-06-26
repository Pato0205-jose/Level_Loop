import type { MaterialIcons } from '@expo/vector-icons';

import {
  buildDynamicRoadmap,
  COURSE_ROADMAPS,
  getCourseProgressPct,
} from './roadmaps';
import { colors } from './theme';
import {
  countCompletedTopics,
  getLevelInfo,
  type UserProgress,
} from '../services/progress';

export type Achievement = {
  id: string;
  title: string;
  caption: string;
  description: string;
  requirement: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  unlocked: boolean;
  /** 0..1 */
  progress: number;
  unlockedAt?: number;
  reward: string;
};

type Evaluation = { progress: number; unlocked: boolean };

type AchievementDef = Omit<Achievement, 'unlocked' | 'progress' | 'unlockedAt'> & {
  evaluate: (progress: UserProgress | null | undefined) => Evaluation;
};

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    id: 'launch',
    title: 'Despegue',
    caption: 'Primer ejercicio',
    description:
      'Completaste tu primer ejercicio en Level Loop. Aquí empieza tu trayectoria.',
    requirement: 'Completar 1 lección o ejercicio.',
    icon: 'rocket-launch',
    color: colors.tertiaryBright,
    reward: '+50 XP',
    evaluate: (p) => {
      const done = countCompletedTopics(p);
      return { progress: done > 0 ? 1 : 0, unlocked: done >= 1 };
    },
  },
  {
    id: 'first-steps',
    title: 'Primeros Pasos',
    caption: '5 temas dominados',
    description:
      'Completaste 5 temas distintos. Tu base se está consolidando.',
    requirement: 'Completar 5 temas.',
    icon: 'directions-walk',
    color: '#9bd0ff',
    reward: '+100 XP',
    evaluate: (p) => {
      const done = countCompletedTopics(p);
      return { progress: clamp01(done / 5), unlocked: done >= 5 };
    },
  },
  {
    id: 'xp-500',
    title: 'XP Hunter',
    caption: '500 XP totales',
    description: 'Acumulaste tus primeros 500 puntos de experiencia.',
    requirement: 'Reunir 500 XP totales.',
    icon: 'bolt',
    color: '#ffd166',
    reward: '+badge XP Hunter',
    evaluate: (p) => {
      const xp = p?.totalXp ?? 0;
      return { progress: clamp01(xp / 500), unlocked: xp >= 500 };
    },
  },
  {
    id: 'xp-2000',
    title: 'XP Élite',
    caption: '2 000 XP totales',
    description: 'Reúne 2 000 XP para entrar al club élite.',
    requirement: 'Acumular 2 000 XP totales.',
    icon: 'stars',
    color: colors.tertiaryBright,
    reward: '+300 XP + badge "Élite"',
    evaluate: (p) => {
      const xp = p?.totalXp ?? 0;
      return { progress: clamp01(xp / 2000), unlocked: xp >= 2000 };
    },
  },
  {
    id: 'level-5',
    title: 'Cadete',
    caption: 'Nivel 5 alcanzado',
    description: 'Llegaste al nivel 5. ¡Ya no eres novata!',
    requirement: 'Alcanzar el nivel 5.',
    icon: 'military-tech',
    color: '#b5e0ff',
    reward: 'Insignia de cadete',
    evaluate: (p) => {
      const lvl = getLevelInfo(p?.totalXp ?? 0).level;
      return { progress: clamp01(lvl / 5), unlocked: lvl >= 5 };
    },
  },
  {
    id: 'level-10',
    title: 'Piloto',
    caption: 'Nivel 10 alcanzado',
    description: 'Has llegado a doble dígito. La constancia te lleva al éxito.',
    requirement: 'Alcanzar el nivel 10.',
    icon: 'workspace-premium',
    color: '#ffb86b',
    reward: 'Insignia de piloto',
    evaluate: (p) => {
      const lvl = getLevelInfo(p?.totalXp ?? 0).level;
      return { progress: clamp01(lvl / 10), unlocked: lvl >= 10 };
    },
  },
  {
    id: 'streak-3',
    title: 'Tres en raya',
    caption: '3 días seguidos',
    description: 'Estudiaste 3 días consecutivos. Sigues construyendo el hábito.',
    requirement: 'Conectar y practicar 3 días seguidos.',
    icon: 'whatshot',
    color: '#ffb4ab',
    reward: '+60 XP',
    evaluate: (p) => {
      const streak = p?.longestStreak ?? p?.streakDays ?? 0;
      return { progress: clamp01(streak / 3), unlocked: streak >= 3 };
    },
  },
  {
    id: 'streak-7',
    title: 'Racha de 7',
    caption: 'Una semana consecutiva',
    description:
      'Estudiaste 7 días seguidos sin romper la racha. La constancia es tu mejor aliada.',
    requirement: 'Conectar y practicar 7 días seguidos.',
    icon: 'local-fire-department',
    color: '#ffb4ab',
    reward: '+100 XP',
    evaluate: (p) => {
      const streak = p?.longestStreak ?? p?.streakDays ?? 0;
      return { progress: clamp01(streak / 7), unlocked: streak >= 7 };
    },
  },
  {
    id: 'streak-30',
    title: 'Racha de 30',
    caption: 'Un mes imparable',
    description:
      'Logra 30 días seguidos de práctica. Es el siguiente nivel de disciplina.',
    requirement: 'Conectar y practicar 30 días seguidos.',
    icon: 'whatshot',
    color: '#ff9d80',
    reward: '+500 XP + badge "Constancia"',
    evaluate: (p) => {
      const streak = p?.longestStreak ?? p?.streakDays ?? 0;
      return { progress: clamp01(streak / 30), unlocked: streak >= 30 };
    },
  },
  {
    id: 'code',
    title: 'Code Master',
    caption: 'Curso de Programación',
    description:
      'Terminaste todos los temas del curso de Programación. Tu disciplina al teclado es élite.',
    requirement: 'Completar el 100% del curso de Programación.',
    icon: 'terminal',
    color: colors.primaryAccent,
    reward: '+300 XP + badge "Code Master"',
    evaluate: (p) => {
      const pct = getCourseProgressPct('code', p);
      return { progress: clamp01(pct / 100), unlocked: pct >= 100 };
    },
  },
  {
    id: 'einstein',
    title: 'Einstein',
    caption: 'Curso de Física',
    description:
      'Completaste todos los temas de Física. Tu intuición para las leyes naturales destaca.',
    requirement: 'Completar el 100% del curso de Física.',
    icon: 'lightbulb',
    color: colors.secondary,
    reward: '+200 XP',
    evaluate: (p) => {
      const pct = getCourseProgressPct('physics', p);
      return { progress: clamp01(pct / 100), unlocked: pct >= 100 };
    },
  },
  {
    id: 'polyglot',
    title: 'Políglota',
    caption: 'Inglés módulo 3',
    description:
      'Termina los primeros tres módulos del curso de Inglés. La comunicación abre todas las puertas.',
    requirement: 'Completar los módulos 1, 2 y 3 de Inglés.',
    icon: 'translate',
    color: '#00c1ed',
    reward: '+250 XP',
    evaluate: (p) => {
      const roadmap = buildDynamicRoadmap('english', p);
      const totalDone = roadmap.modules
        .slice(0, 3)
        .reduce(
          (s, m) =>
            s + m.nodes.filter((n) => n.status === 'completed').length,
          0,
        );
      const totalNodes = roadmap.modules
        .slice(0, 3)
        .reduce((s, m) => s + m.nodes.length, 0);
      return {
        progress: clamp01(totalDone / Math.max(1, totalNodes)),
        unlocked: totalNodes > 0 && totalDone >= totalNodes,
      };
    },
  },
  {
    id: 'mathlete',
    title: 'Mathlete',
    caption: 'Maestro del álgebra',
    description:
      'Completa el módulo de Álgebra básica en Matemáticas. ¡Eres un atleta del álgebra!',
    requirement: 'Completar el módulo "Álgebra básica" del curso de Matemáticas.',
    icon: 'functions',
    color: colors.tertiaryBright,
    reward: '+300 XP',
    evaluate: (p) => {
      const roadmap = buildDynamicRoadmap('math', p);
      const algebra = roadmap.modules.find((m) => m.id === 'm3');
      if (!algebra) return { progress: 0, unlocked: false };
      const done = algebra.nodes.filter((n) => n.status === 'completed').length;
      return {
        progress: clamp01(done / algebra.nodes.length),
        unlocked: done >= algebra.nodes.length,
      };
    },
  },
  {
    id: 'all-courses',
    title: 'Multiverso',
    caption: 'Todos los cursos al 50%',
    description:
      'Avanza al menos 50% en cada curso disponible. La curiosidad es tu superpoder.',
    requirement: 'Alcanzar 50% en los 4 cursos.',
    icon: 'auto-awesome',
    color: '#c1a9ff',
    reward: '+400 XP',
    evaluate: (p) => {
      const courses = Object.keys(COURSE_ROADMAPS);
      const pcts = courses.map((c) => getCourseProgressPct(c, p));
      const avgTowards50 =
        pcts.reduce((s, pct) => s + Math.min(pct, 50), 0) / (courses.length * 50);
      const allAt50 = pcts.every((pct) => pct >= 50);
      return { progress: clamp01(avgTowards50), unlocked: allAt50 };
    },
  },
];

/**
 * Devuelve la lista de logros evaluados a partir del progreso del usuario.
 * Si el logro ya estaba marcado como desbloqueado en `previouslyUnlocked`,
 * se conserva la marca de desbloqueado y la fecha `unlockedAt`.
 */
export function evaluateAchievements(
  progress: UserProgress | null | undefined,
  previouslyUnlocked: Record<string, number> = {},
): Achievement[] {
  return ACHIEVEMENT_DEFS.map((def) => {
    const evalRes = def.evaluate(progress);
    const prevAt = previouslyUnlocked[def.id];
    const unlocked = evalRes.unlocked || prevAt !== undefined;
    const unlockedAt = prevAt ?? (evalRes.unlocked ? Date.now() : undefined);
    return {
      id: def.id,
      title: def.title,
      caption: def.caption,
      description: def.description,
      requirement: def.requirement,
      icon: def.icon,
      color: def.color,
      reward: def.reward,
      unlocked,
      progress: unlocked ? 1 : clamp01(evalRes.progress),
      unlockedAt,
    };
  });
}

export function evaluateAchievement(
  id: string,
  progress: UserProgress | null | undefined,
  previouslyUnlocked: Record<string, number> = {},
): Achievement | undefined {
  return evaluateAchievements(progress, previouslyUnlocked).find(
    (a) => a.id === id,
  );
}

/** Lista plana de definiciones (sin evaluación) por si la necesitas. */
export const ACHIEVEMENTS: Achievement[] = ACHIEVEMENT_DEFS.map((def) => ({
  id: def.id,
  title: def.title,
  caption: def.caption,
  description: def.description,
  requirement: def.requirement,
  icon: def.icon,
  color: def.color,
  reward: def.reward,
  unlocked: false,
  progress: 0,
}));

export function getAchievement(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

export function getUnlockedCount(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlocked).length;
}
