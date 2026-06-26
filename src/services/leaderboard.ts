import { getLevelInfo, type UserProgress } from './progress';
import { apiFetch, USE_BACKEND } from './api';

export type LeaderboardScope = 'weekly' | 'global' | 'friends';

export type LeaderEntry = {
  id: string;
  rank: number;
  name: string;
  level: number;
  totalXp: number;
  weeklyXp: number;
  isYou: boolean;
};

export type LeaderboardData = {
  scope: LeaderboardScope;
  /** Lista completa ordenada (incluye al usuario en su posición real). */
  rows: LeaderEntry[];
  /** Acceso rápido al podio. */
  top3: LeaderEntry[];
  /** Entrada del usuario actual. */
  you: LeaderEntry;
  /** Día de la semana que vence el reto semanal. */
  weeklyResetLabel?: string;
};

const OPPONENT_POOL: Array<{ name: string; seed: number }> = [
  { name: 'Evelyn Grey', seed: 11 },
  { name: 'Marco V.', seed: 23 },
  { name: 'Sasha K.', seed: 47 },
  { name: 'Leon Hart', seed: 65 },
  { name: 'Jade Smith', seed: 71 },
  { name: 'Oliver Reid', seed: 88 },
  { name: 'Sofia Diaz', seed: 91 },
  { name: 'Mia Chen', seed: 102 },
  { name: 'Noah Park', seed: 117 },
  { name: 'Lucas Rojo', seed: 134 },
  { name: 'Aria Black', seed: 150 },
  { name: 'Kai Tanaka', seed: 168 },
  { name: 'Camila Soto', seed: 187 },
  { name: 'Theo Vega', seed: 201 },
  { name: 'Nuria Lima', seed: 222 },
  { name: 'Mateo Cruz', seed: 244 },
  { name: 'Ivy Wood', seed: 263 },
  { name: 'Hugo Mendes', seed: 287 },
  { name: 'Zara Khan', seed: 305 },
  { name: 'Renata Vio', seed: 326 },
  { name: 'Dario Bell', seed: 348 },
  { name: 'Lia Park', seed: 369 },
  { name: 'Ethan Liu', seed: 392 },
  { name: 'Bruno Caro', seed: 411 },
  { name: 'Nina Esposito', seed: 437 },
  { name: 'Yuki Hoshi', seed: 459 },
  { name: 'Alex Nguyen', seed: 478 },
  { name: 'Ruby Storm', seed: 502 },
  { name: 'Diego Rivera', seed: 525 },
  { name: 'Karen Bay', seed: 549 },
  { name: 'Pablo Vega', seed: 572 },
  { name: 'Selene Vox', seed: 596 },
  { name: 'Marcos Quiñones', seed: 620 },
  { name: 'Frida Loop', seed: 644 },
  { name: 'Antonio Saiz', seed: 668 },
  { name: 'Sara Bonet', seed: 691 },
  { name: 'Iván Codex', seed: 715 },
  { name: 'Lara Mira', seed: 739 },
  { name: 'Jorge Lan', seed: 762 },
  { name: 'Beatriz Vai', seed: 785 },
];

const FRIEND_NAMES = new Set([
  'Marco V.',
  'Sasha K.',
  'Jade Smith',
  'Noah Park',
  'Sofia Diaz',
  'Camila Soto',
  'Lia Park',
  'Iván Codex',
  'Renata Vio',
]);

/** Random determinista (de 0 a 1) a partir de seed + offset. */
function det(seed: number, offset: number): number {
  const s = (seed * 9301 + offset * 49297) % 233280;
  return s / 233280;
}

function generateOpponents(scope: LeaderboardScope): LeaderEntry[] {
  const pool = scope === 'friends'
    ? OPPONENT_POOL.filter((o) => FRIEND_NAMES.has(o.name))
    : OPPONENT_POOL;

  return pool.map((opp, i) => {
    const baseTotal =
      scope === 'global'
        ? 8_000 + Math.floor(det(opp.seed, 1) * 60_000)
        : scope === 'weekly'
          ? 800 + Math.floor(det(opp.seed, 2) * 8_000)
          : 2_000 + Math.floor(det(opp.seed, 3) * 12_000);
    const weeklyShare = 0.15 + det(opp.seed, 4) * 0.35;
    const weeklyXp = Math.floor(baseTotal * weeklyShare);
    const totalXp =
      scope === 'weekly'
        ? Math.floor(baseTotal / weeklyShare)
        : baseTotal;
    return {
      id: `op-${i}`,
      rank: 0,
      name: opp.name,
      level: getLevelInfo(totalXp).level,
      totalXp,
      weeklyXp,
      isYou: false,
    };
  });
}

function makeUserEntry(
  userName: string,
  totalXp: number,
  weeklyXp: number,
): LeaderEntry {
  return {
    id: 'you',
    rank: 0,
    name: userName,
    level: getLevelInfo(totalXp).level,
    totalXp,
    weeklyXp,
    isYou: true,
  };
}

/** Aproximación: 35% del XP total como XP de esta semana (estable y simple). */
export function estimateWeeklyXp(totalXp: number): number {
  return Math.floor(totalXp * 0.35);
}

function nextSundayLabel(): string {
  const today = new Date();
  const day = today.getDay(); // 0 = domingo
  const remaining = day === 0 ? 7 : 7 - day;
  return `Termina en ${remaining} ${remaining === 1 ? 'día' : 'días'}`;
}

export function buildLeaderboard(
  scope: LeaderboardScope,
  userName: string,
  progress: UserProgress | null | undefined,
): LeaderboardData {
  const totalXp = progress?.totalXp ?? 0;
  const weeklyXp = estimateWeeklyXp(totalXp);
  const user = makeUserEntry(userName, totalXp, weeklyXp);

  const all = [...generateOpponents(scope), user];

  const sortKey = scope === 'weekly' ? 'weeklyXp' : 'totalXp';
  all.sort((a, b) => b[sortKey] - a[sortKey]);
  all.forEach((entry, i) => {
    entry.rank = i + 1;
  });

  const you = all.find((e) => e.isYou)!;
  const top3 = all.slice(0, 3);

  return {
    scope,
    rows: all,
    top3,
    you,
    weeklyResetLabel: scope === 'weekly' ? nextSundayLabel() : undefined,
  };
}

export async function fetchLeaderboard(
  scope: LeaderboardScope,
  userName: string,
  progress: UserProgress | null | undefined,
): Promise<LeaderboardData> {
  if (USE_BACKEND) {
    try {
      const res = await apiFetch(`/leaderboard?scope=${scope}`);
      if (res.ok) {
        return (await res.json()) as LeaderboardData;
      }
    } catch {
      // Fallback local si no hay red.
    }
  }

  return buildLeaderboard(scope, userName, progress);
}
