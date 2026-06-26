import type { MaterialIcons } from '@expo/vector-icons';
import { getFirebaseAuth, getFirestoreDb } from './firebase';
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

import { StorageKeys } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';
import { apiFetch, USE_BACKEND } from './api';

export type NotificationType =
  | 'welcome'
  | 'streak'
  | 'achievement'
  | 'lesson'
  | 'system';

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  createdAt: number;
  read: boolean;
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const NOTIFICATIONS_COLLECTION = 'notifications';
const ITEMS_SUBCOLLECTION = 'items';

async function getCurrentUid(): Promise<string | null> {
  if (USE_BACKEND) {
    return getItem<string>(StorageKeys.CURRENT_USER_ID);
  }
  try {
    return getFirebaseAuth().currentUser?.uid ?? null;
  } catch {
    return null;
  }
}

function notificationsCollectionRef(uid: string) {
  return collection(
    getFirestoreDb(),
    NOTIFICATIONS_COLLECTION,
    uid,
    ITEMS_SUBCOLLECTION,
  );
}

function notificationDocRef(uid: string, id: string) {
  return doc(
    getFirestoreDb(),
    NOTIFICATIONS_COLLECTION,
    uid,
    ITEMS_SUBCOLLECTION,
    id,
  );
}

function defaultNotifications(now: number): AppNotification[] {
  return [
    {
      id: 'n_welcome',
      type: 'welcome',
      title: '¡Bienvenido a Level Loop!',
      message:
        'Empieza con la primera lección de tu materia favorita. Suma XP y desbloquea logros.',
      icon: 'celebration',
      color: '#cfbdff',
      createdAt: now - 5 * MINUTE,
      read: false,
    },
    {
      id: 'n_streak',
      type: 'streak',
      title: 'Tu racha de 7 días sigue activa',
      message:
        'Practica al menos una lección hoy para mantener tu racha encendida.',
      icon: 'local-fire-department',
      color: '#ffb4ab',
      createdAt: now - 3 * HOUR,
      read: false,
    },
    {
      id: 'n_lesson_math',
      type: 'lesson',
      title: 'Nueva lección recomendada',
      message:
        'Empieza "Simplificar fracciones" — repaso rápido de 4 minutos en Matemáticas.',
      icon: 'menu-book',
      color: '#51d5ff',
      createdAt: now - 1 * DAY,
      read: true,
    },
    {
      id: 'n_achievement',
      type: 'achievement',
      title: '¡Logro desbloqueado!',
      message: 'Conseguiste "Despegue" por completar tu primera misión.',
      icon: 'emoji-events',
      color: '#cfbdff',
      createdAt: now - 2 * DAY,
      read: true,
    },
    {
      id: 'n_system',
      type: 'system',
      title: 'Nuevos contenidos disponibles',
      message:
        'Agregamos nuevas lecciones de Inglés. Échales un vistazo desde Explorar.',
      icon: 'system-update',
      color: '#51d5ff',
      createdAt: now - 4 * DAY,
      read: true,
    },
  ];
}

export async function getNotifications(): Promise<AppNotification[]> {
  if (USE_BACKEND) {
    try {
      const res = await apiFetch('/notifications');
      if (res.ok) {
        const payload = (await res.json()) as { notifications: AppNotification[] };
        await setItem(StorageKeys.NOTIFICATIONS, payload.notifications);
        return payload.notifications;
      }
    } catch {
      // Fallback local
    }
  }

  const uid = await getCurrentUid();

  if (uid) {
    try {
      const q = query(notificationsCollectionRef(uid), orderBy('createdAt', 'desc'));
      let snap = await getDocs(q);

      if (snap.empty) {
        const initial = defaultNotifications(Date.now());
        const batch = writeBatch(getFirestoreDb());
        for (const item of initial) {
          batch.set(notificationDocRef(uid, item.id), item);
        }
        await batch.commit();
        await setItem(StorageKeys.NOTIFICATIONS, initial);
        return initial;
      }

      const remoteList = snap.docs.map((d) => {
        const data = d.data() as AppNotification;
        return {
          ...data,
          id: data.id || d.id,
        };
      });
      await setItem(StorageKeys.NOTIFICATIONS, remoteList);
      return remoteList;
    } catch {
      // Fallback local
    }
  }

  let list = await getItem<AppNotification[]>(StorageKeys.NOTIFICATIONS);
  if (!list) {
    list = defaultNotifications(Date.now());
    await setItem(StorageKeys.NOTIFICATIONS, list);
  }
  return [...list].sort((a, b) => b.createdAt - a.createdAt);
}

export async function getUnreadCount(): Promise<number> {
  const list = await getNotifications();
  return list.filter((n) => !n.read).length;
}

export async function markAsRead(id: string): Promise<void> {
  if (USE_BACKEND) {
    try {
      await apiFetch(`/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true }),
      });
    } catch {
      // Fallback local
    }
  }

  const uid = await getCurrentUid();
  if (uid) {
    try {
      await updateDoc(notificationDocRef(uid, id), { read: true });
    } catch {
      // Fallback local
    }
  }

  const list = (await getItem<AppNotification[]>(StorageKeys.NOTIFICATIONS)) ?? [];
  const next = list.map((n) => (n.id === id ? { ...n, read: true } : n));
  await setItem(StorageKeys.NOTIFICATIONS, next);
}

export async function markAllAsRead(): Promise<void> {
  if (USE_BACKEND) {
    try {
      await apiFetch('/notifications/mark-all', { method: 'POST' });
    } catch {
      // Fallback local
    }
  }

  const uid = await getCurrentUid();
  if (uid) {
    try {
      const snap = await getDocs(notificationsCollectionRef(uid));
      if (!snap.empty) {
        const batch = writeBatch(getFirestoreDb());
        snap.docs.forEach((d) => {
          batch.update(d.ref, { read: true });
        });
        await batch.commit();
      }
    } catch {
      // Fallback local
    }
  }

  const list = (await getItem<AppNotification[]>(StorageKeys.NOTIFICATIONS)) ?? [];
  const next = list.map((n) => ({ ...n, read: true }));
  await setItem(StorageKeys.NOTIFICATIONS, next);
}

export async function clearNotifications(): Promise<void> {
  if (USE_BACKEND) {
    try {
      await apiFetch('/notifications', { method: 'DELETE' });
    } catch {
      // Fallback local
    }
  }

  const uid = await getCurrentUid();
  if (uid) {
    try {
      const snap = await getDocs(notificationsCollectionRef(uid));
      if (!snap.empty) {
        const batch = writeBatch(getFirestoreDb());
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
      }
    } catch {
      // Fallback local
    }
  }

  await setItem(StorageKeys.NOTIFICATIONS, []);
}

export function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ts);
  if (diff < MINUTE) return 'Hace un momento';
  if (diff < HOUR) return `Hace ${Math.floor(diff / MINUTE)} min`;
  if (diff < DAY) return `Hace ${Math.floor(diff / HOUR)} h`;
  const days = Math.floor(diff / DAY);
  if (days < 7) return `Hace ${days} d`;
  return new Date(ts).toLocaleDateString('es-MX');
}
