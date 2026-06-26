/**
 * Recordatorios push diarios (Expo SDK 56 — expo-notifications).
 *
 * Esta implementación corre SOLO en iOS/Android. Para web, Metro
 * reemplaza este módulo por `pushReminders.web.ts` automáticamente.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import { StorageKeys } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';

const DEFAULT_HOUR = 19;
const DEFAULT_MINUTE = 30;
const CHANNEL_ID = 'streak-reminders';
const REMINDER_IDENTIFIER = 'levelloop-daily-streak';

const TITLES = [
  '¡Tu racha te está esperando!',
  'Mantén la llama encendida',
  '5 minutos hoy = +1 día de racha',
  'Tu cerebro pide otra dosis',
];

const BODIES = [
  'Completa al menos una lección hoy para no perder tu racha.',
  'Solo necesitas un minijuego para sumar XP y subir de nivel.',
  '¿Listo para sorprenderte con lo que has avanzado? Toca aquí.',
  'Una lección rápida y vuelves más fuerte mañana.',
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Configura el handler global de notificaciones (mostrar en foreground)
 * y crea el canal de Android. Idempotente.
 */
export async function setupPushReminders(): Promise<void> {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Recordatorios de racha',
        importance: Notifications.AndroidImportance.DEFAULT,
        lightColor: '#cfbdff',
        vibrationPattern: [0, 250, 250, 250],
      });
    }
  } catch (e) {
    console.warn('[pushReminders] setup falló:', e);
  }
}

/**
 * Solicita permisos si no se ha preguntado antes. Devuelve `true` si el
 * usuario los concedió (o ya estaban concedidos).
 */
export async function ensurePushPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;

    const prompted = await getItem<boolean>(StorageKeys.PUSH_PERMISSION_PROMPTED);
    if (prompted && !current.canAskAgain) return false;

    const next = await Notifications.requestPermissionsAsync();
    await setItem(StorageKeys.PUSH_PERMISSION_PROMPTED, true);
    return next.granted;
  } catch (e) {
    console.warn('[pushReminders] permiso falló:', e);
    return false;
  }
}

/**
 * Programa la notificación diaria. Cancela previas para evitar duplicados.
 */
export async function scheduleDailyStreakReminder(
  hour: number = DEFAULT_HOUR,
  minute: number = DEFAULT_MINUTE,
): Promise<boolean> {
  try {
    await cancelStreakReminder();
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: pickRandom(TITLES),
        body: pickRandom(BODIES),
        sound: 'default',
        data: { kind: 'streak-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      },
    });
    await setItem(
      StorageKeys.PUSH_REMINDER_TIME,
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    );
    return true;
  } catch (e) {
    console.warn('[pushReminders] schedule falló:', e);
    return false;
  }
}

export async function cancelStreakReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  } catch {
    // ignore: puede no existir aún
  }
}

/**
 * Atajo para llamar desde App.tsx al iniciar la sesión:
 *  - setup global
 *  - permisos (si faltan)
 *  - schedule del recordatorio diario por defecto
 */
export async function initStreakReminders(): Promise<void> {
  await setupPushReminders();
  const granted = await ensurePushPermission();
  if (!granted) return;

  const saved = await getItem<string>(StorageKeys.PUSH_REMINDER_TIME);
  let h = DEFAULT_HOUR;
  let m = DEFAULT_MINUTE;
  if (saved && /^\d{2}:\d{2}$/.test(saved)) {
    const [hh, mm] = saved.split(':').map((n) => parseInt(n, 10));
    if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
      h = hh;
      m = mm;
    }
  }
  await scheduleDailyStreakReminder(h, m);
}

export const REMINDER_DEFAULTS = {
  hour: DEFAULT_HOUR,
  minute: DEFAULT_MINUTE,
} as const;
