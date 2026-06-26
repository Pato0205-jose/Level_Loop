import type { MaterialIcons } from '@expo/vector-icons';

import type { UserProgress } from '../services/progress';

export type NodeStatus = 'completed' | 'active' | 'locked';

export type RoadmapNode = {
  id: string;
  title: string;
  status: NodeStatus;
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Reduce aún más la opacidad para nodos finales bloqueados. */
  dim?: boolean;
};

export type RoadmapModule = {
  id: string;
  /** Etiqueta superior del separador ("MÓDULO 1"). */
  label: string;
  /** Subtítulo descriptivo del módulo ("Aritmética básica"). */
  subtitle: string;
  nodes: RoadmapNode[];
};

export type CourseRoadmap = {
  id: string;
  title: string;
  objective: string;
  /** Porcentaje 0–100 mostrado en el header. */
  progress: number;
  modules: RoadmapModule[];
};

/**
 * Estructura base de los cursos. Los `status` están en valores por defecto;
 * el helper `buildDynamicRoadmap` deriva el estado real a partir del progreso
 * del usuario.
 */
export const COURSE_ROADMAPS: Record<string, CourseRoadmap> = {
  math: {
    id: 'math',
    title: 'Matemáticas',
    objective: 'Resolver operaciones y lógica básica.',
    progress: 0,
    modules: [
      {
        id: 'm1',
        label: 'Módulo 1',
        subtitle: 'Aritmética básica',
        nodes: [
          { id: 'sum', title: 'Suma', status: 'active', icon: 'add' },
          { id: 'sub', title: 'Resta', status: 'locked', icon: 'remove' },
          { id: 'mul', title: 'Multiplicación', status: 'locked', icon: 'close' },
          { id: 'div', title: 'División', status: 'locked', icon: 'horizontal-rule' },
          { id: 'order', title: 'Jerarquía de operaciones', status: 'locked', icon: 'rule' },
        ],
      },
      {
        id: 'm2',
        label: 'Módulo 2',
        subtitle: 'Fracciones',
        nodes: [
          { id: 'simplify', title: 'Simplificar', status: 'locked', icon: 'percent' },
          { id: 'frac-sum', title: 'Suma de fracciones', status: 'locked', icon: 'add' },
          { id: 'frac-mul', title: 'Multiplicación de fracciones', status: 'locked', icon: 'close' },
        ],
      },
      {
        id: 'm3',
        label: 'Módulo 3',
        subtitle: 'Álgebra básica',
        nodes: [
          { id: 'vars', title: 'Variables', status: 'locked', icon: 'code' },
          { id: 'isolate', title: 'Despeje simple', status: 'locked', icon: 'tune' },
          { id: 'linear', title: 'Ecuaciones lineales', status: 'locked', icon: 'functions' },
        ],
      },
    ],
  },
  physics: {
    id: 'physics',
    title: 'Física',
    objective: 'Entender conceptos básicos.',
    progress: 0,
    modules: [
      {
        id: 'm1',
        label: 'Módulo 1',
        subtitle: 'Movimiento',
        nodes: [
          { id: 'speed', title: 'Velocidad', status: 'active', icon: 'speed' },
          { id: 'distance', title: 'Distancia', status: 'locked', icon: 'straighten' },
          { id: 'time', title: 'Tiempo', status: 'locked', icon: 'schedule' },
        ],
      },
      {
        id: 'm2',
        label: 'Módulo 2',
        subtitle: 'Fuerza',
        nodes: [
          { id: 'mass', title: 'Masa', status: 'locked', icon: 'fitness-center' },
          { id: 'force', title: 'Fuerza', status: 'locked', icon: 'bolt' },
          { id: 'accel', title: 'Aceleración', status: 'locked', icon: 'trending-up' },
        ],
      },
      {
        id: 'm3',
        label: 'Módulo 3',
        subtitle: 'Energía',
        nodes: [
          { id: 'kinetic', title: 'Energía cinética', status: 'locked', icon: 'directions-run' },
          { id: 'potential', title: 'Energía potencial', status: 'locked', icon: 'battery-charging-full' },
        ],
      },
    ],
  },
  code: {
    id: 'code',
    title: 'Programación',
    objective: 'Introducción al desarrollo web.',
    progress: 0,
    modules: [
      {
        id: 'm1',
        label: 'Módulo 1',
        subtitle: 'HTML',
        nodes: [
          { id: 'tags', title: 'Etiquetas', status: 'active', icon: 'tag' },
          { id: 'titles', title: 'Títulos', status: 'locked', icon: 'title' },
          { id: 'paragraphs', title: 'Párrafos', status: 'locked', icon: 'subject' },
          { id: 'images', title: 'Imágenes', status: 'locked', icon: 'image' },
          { id: 'links', title: 'Links', status: 'locked', icon: 'link' },
        ],
      },
      {
        id: 'm2',
        label: 'Módulo 2',
        subtitle: 'CSS',
        nodes: [
          { id: 'colors', title: 'Colores', status: 'locked', icon: 'palette' },
          { id: 'margins', title: 'Márgenes', status: 'locked', icon: 'border-style' },
          { id: 'flex', title: 'Flexbox básico', status: 'locked', icon: 'dashboard' },
        ],
      },
      {
        id: 'm3',
        label: 'Módulo 3',
        subtitle: 'JavaScript básico',
        nodes: [
          { id: 'js-vars', title: 'Variables', status: 'locked', icon: 'code' },
          { id: 'conds', title: 'Condiciones', status: 'locked', icon: 'alt-route' },
          { id: 'funcs', title: 'Funciones simples', status: 'locked', icon: 'functions' },
        ],
      },
    ],
  },
  english: {
    id: 'english',
    title: 'Inglés',
    objective: 'Vocabulario y gramática básica.',
    progress: 0,
    modules: [
      {
        id: 'm1',
        label: 'Módulo 1',
        subtitle: 'Saludos',
        nodes: [
          { id: 'hello', title: 'Hello', status: 'active', icon: 'waving-hand' },
          { id: 'bye', title: 'Goodbye', status: 'locked', icon: 'logout' },
          { id: 'howareyou', title: 'How are you?', status: 'locked', icon: 'chat' },
        ],
      },
      {
        id: 'm2',
        label: 'Módulo 2',
        subtitle: 'Verb to be',
        nodes: [
          { id: 'i-am', title: 'I am', status: 'locked', icon: 'person' },
          { id: 'you-are', title: 'You are', status: 'locked', icon: 'people' },
          { id: 'he-is', title: 'He is', status: 'locked', icon: 'face' },
        ],
      },
      {
        id: 'm3',
        label: 'Módulo 3',
        subtitle: 'Vocabulario diario',
        nodes: [
          { id: 'en-colors', title: 'Colores', status: 'locked', icon: 'palette' },
          { id: 'numbers', title: 'Números', status: 'locked', icon: 'pin' },
          { id: 'objects', title: 'Objetos', status: 'locked', icon: 'category' },
        ],
      },
    ],
  },
};

export function getCourseRoadmap(courseId: string | undefined): CourseRoadmap {
  if (courseId && COURSE_ROADMAPS[courseId]) {
    return COURSE_ROADMAPS[courseId];
  }
  return COURSE_ROADMAPS.math;
}

/**
 * Devuelve el roadmap del curso con los estados de cada nodo derivados del
 * progreso real del usuario:
 * - completed → si el tema está marcado como completo en el storage
 * - active → primer nodo (en orden) que no esté completado
 * - locked → cualquier nodo posterior al activo
 *
 * También calcula `progress` (% real de nodos completados) y `dim` para los
 * nodos que están demasiado lejos del activo.
 */
export function buildDynamicRoadmap(
  courseId: string | undefined,
  progress?: UserProgress | null,
): CourseRoadmap {
  const base = getCourseRoadmap(courseId);
  let foundActive = false;
  let activeModuleIdx = -1;

  const modulesWithStatus = base.modules.map((module, modIdx) => {
    const nodes = module.nodes.map((node) => {
      const topicProgress = progress?.topics?.[node.id];
      if (topicProgress?.completed) {
        return { ...node, status: 'completed' as const };
      }
      if (!foundActive) {
        foundActive = true;
        activeModuleIdx = modIdx;
        return { ...node, status: 'active' as const };
      }
      return { ...node, status: 'locked' as const };
    });
    return { ...module, nodes };
  });

  // Si todo está completado no hay módulo activo: usamos el último como referencia.
  if (!foundActive) {
    activeModuleIdx = modulesWithStatus.length - 1;
  }

  const finalModules: RoadmapModule[] = modulesWithStatus.map((module, modIdx) => ({
    ...module,
    nodes: module.nodes.map((node) => ({
      ...node,
      dim:
        node.status === 'locked' &&
        (activeModuleIdx < 0 || modIdx > activeModuleIdx + 1),
    })),
  }));

  const totalNodes = finalModules.reduce((sum, m) => sum + m.nodes.length, 0);
  const doneNodes = finalModules.reduce(
    (sum, m) => sum + m.nodes.filter((n) => n.status === 'completed').length,
    0,
  );
  const pct = totalNodes > 0 ? Math.round((doneNodes / totalNodes) * 100) : 0;

  return {
    ...base,
    progress: pct,
    modules: finalModules,
  };
}

/** Atajo: % de progreso del curso a partir del progreso del usuario. */
export function getCourseProgressPct(
  courseId: string | undefined,
  progress?: UserProgress | null,
): number {
  return buildDynamicRoadmap(courseId, progress).progress;
}

/**
 * Devuelve el siguiente nodo del roadmap después de `currentTopicId`,
 * recorriendo los módulos en orden. Si no hay siguiente (último tema),
 * devuelve `null`.
 */
export function getNextTopic(
  courseId: string | undefined,
  currentTopicId: string,
): RoadmapNode | null {
  const roadmap = getCourseRoadmap(courseId);
  const flat = roadmap.modules.flatMap((m) => m.nodes);
  const idx = flat.findIndex((n) => n.id === currentTopicId);
  if (idx === -1 || idx >= flat.length - 1) return null;
  return flat[idx + 1];
}
