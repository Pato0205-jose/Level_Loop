import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { StorageKeys } from '../storage/keys';
import { getItem, setItem } from '../storage/storage';

/**
 * Cada evento de feedback de la app es una combinación de sonido + vibración.
 * Sonidos generados en runtime con Web Audio API (web) y haptics con expo-haptics
 * (iOS, Android y Safari en SDK 56).
 */
export type FeedbackEvent =
  | 'select'
  | 'correct'
  | 'wrong'
  | 'timeout'
  | 'lessonComplete'
  | 'streak'
  | 'levelUp';

export type FeedbackPrefs = {
  sound: boolean;
  haptics: boolean;
};

const DEFAULT_PREFS: FeedbackPrefs = {
  sound: true,
  haptics: true,
};

let cachedPrefs: FeedbackPrefs = { ...DEFAULT_PREFS };
let prefsLoaded = false;

export async function loadFeedbackPrefs(): Promise<FeedbackPrefs> {
  const stored = await getItem<FeedbackPrefs>(StorageKeys.FEEDBACK_PREFS);
  cachedPrefs = stored ?? { ...DEFAULT_PREFS };
  prefsLoaded = true;
  return cachedPrefs;
}

export function getFeedbackPrefs(): FeedbackPrefs {
  return cachedPrefs;
}

export async function setFeedbackPrefs(prefs: Partial<FeedbackPrefs>): Promise<FeedbackPrefs> {
  cachedPrefs = { ...cachedPrefs, ...prefs };
  await setItem(StorageKeys.FEEDBACK_PREFS, cachedPrefs);
  return cachedPrefs;
}

/** Dispara feedback para un evento. No bloquea: errores se ignoran. */
export function feedback(event: FeedbackEvent): void {
  if (!prefsLoaded) {
    void loadFeedbackPrefs();
  }
  const prefs = cachedPrefs;
  if (prefs.haptics) {
    void triggerHaptic(event);
  }
  if (prefs.sound) {
    void triggerSound(event);
  }
}

async function triggerHaptic(event: FeedbackEvent): Promise<void> {
  try {
    switch (event) {
      case 'select':
        await Haptics.selectionAsync();
        break;
      case 'correct':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'wrong':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'timeout':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'lessonComplete':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 180);
        break;
      case 'streak':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'levelUp':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setTimeout(() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, 140);
        setTimeout(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 320);
        break;
    }
  } catch {
    // Silenciar: haptics no soportados en este dispositivo.
  }
}

/**
 * Reproduce un sonido sintético corto para un evento.
 * En web usa AudioContext (no requiere assets); en nativo, los sonidos
 * reales requerirían archivos en `assets/sounds/` + expo-audio.
 * Por ahora en nativo el evento se siente sólo con haptics.
 */
async function triggerSound(event: FeedbackEvent): Promise<void> {
  if (Platform.OS !== 'web') {
    return;
  }
  try {
    playWebTone(EVENT_TONES[event]);
  } catch {
    // Silenciar: AudioContext puede fallar antes del primer gesto.
  }
}

type ToneStep = {
  /** Frecuencia en Hz */
  freq: number;
  /** Duración en ms */
  duration: number;
  /** Tipo de onda */
  shape?: OscillatorType;
  /** Volumen pico 0–1 */
  gain?: number;
  /** Delay relativo (desde el inicio del evento) en ms */
  delay?: number;
};

const EVENT_TONES: Record<FeedbackEvent, ToneStep[]> = {
  select: [{ freq: 660, duration: 60, shape: 'sine', gain: 0.06 }],
  correct: [
    { freq: 660, duration: 90, shape: 'triangle', gain: 0.14 },
    { freq: 880, duration: 140, shape: 'triangle', gain: 0.14, delay: 80 },
  ],
  wrong: [
    { freq: 220, duration: 140, shape: 'square', gain: 0.1 },
    { freq: 165, duration: 200, shape: 'square', gain: 0.1, delay: 130 },
  ],
  timeout: [
    { freq: 200, duration: 180, shape: 'sawtooth', gain: 0.08 },
    { freq: 150, duration: 220, shape: 'sawtooth', gain: 0.08, delay: 160 },
  ],
  lessonComplete: [
    { freq: 523, duration: 120, shape: 'triangle', gain: 0.12 },
    { freq: 659, duration: 120, shape: 'triangle', gain: 0.12, delay: 110 },
    { freq: 784, duration: 160, shape: 'triangle', gain: 0.14, delay: 220 },
    { freq: 1046, duration: 240, shape: 'triangle', gain: 0.16, delay: 360 },
  ],
  streak: [
    { freq: 740, duration: 80, shape: 'sine', gain: 0.12 },
    { freq: 988, duration: 120, shape: 'sine', gain: 0.14, delay: 70 },
  ],
  levelUp: [
    { freq: 523, duration: 90, shape: 'square', gain: 0.1 },
    { freq: 659, duration: 90, shape: 'square', gain: 0.1, delay: 80 },
    { freq: 784, duration: 90, shape: 'square', gain: 0.1, delay: 160 },
    { freq: 1046, duration: 200, shape: 'square', gain: 0.12, delay: 240 },
  ],
};

let webAudioCtx: AudioContext | null = null;

function getWebAudioCtx(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  if (webAudioCtx) return webAudioCtx;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  webAudioCtx = new Ctor();
  return webAudioCtx;
}

function playWebTone(steps: ToneStep[]): void {
  const ctx = getWebAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume();
  }
  const now = ctx.currentTime;
  for (const step of steps) {
    const startAt = now + (step.delay ?? 0) / 1000;
    const dur = step.duration / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step.shape ?? 'sine';
    osc.frequency.value = step.freq;
    const peak = step.gain ?? 0.12;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + dur + 0.02);
  }
}
