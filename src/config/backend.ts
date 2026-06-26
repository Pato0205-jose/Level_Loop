import { Platform } from 'react-native';

import { fetchWithTimeout } from '../utils/fetchWithTimeout';

/** Timeout para login/registro (Neon puede tardar en arrancar). */
export const AUTH_TIMEOUT_MS = 20_000;

/** Timeout general para el resto de endpoints. */
export const API_TIMEOUT_MS = 12_000;

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

function getConfiguredBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://127.0.0.1:3000';
}

/** URL del .env (puede no ser alcanzable desde el celular). */
export const API_BASE_URL = getConfiguredBaseUrl();

export const USE_BACKEND =
  (process.env.EXPO_PUBLIC_AUTH_PROVIDER || 'backend') === 'backend';

let activeBaseUrl: string | null = null;
let resolveInFlight: Promise<string> | null = null;

function getCandidateUrls(): string[] {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const candidates: string[] = [];

  // Con USB + adb reverse, localhost en el teléfono llega al PC.
  if (Platform.OS === 'android' && isDev) {
    candidates.push('http://127.0.0.1:3000');
  }

  if (envUrl) {
    candidates.push(normalizeBaseUrl(envUrl));
  }

  if (Platform.OS === 'android') {
    candidates.push('http://10.0.2.2:3000');
  }

  if (Platform.OS !== 'android') {
    candidates.push('http://127.0.0.1:3000');
  }

  return [...new Set(candidates)];
}

async function probeHealth(base: string, timeoutMs: number): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${base}/health`,
      { method: 'GET' },
      timeoutMs,
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Detecta la primera URL del backend que responda (LAN, adb reverse, emulador). */
export async function resolveWorkingApiBaseUrl(force = false): Promise<string> {
  if (activeBaseUrl && !force) {
    return activeBaseUrl;
  }

  if (resolveInFlight && !force) {
    return resolveInFlight;
  }

  resolveInFlight = (async () => {
    for (const base of getCandidateUrls()) {
      if (await probeHealth(base, 4500)) {
        activeBaseUrl = base;
        if (isDev) {
          console.log(`[backend] conectado → ${base}`);
        }
        return base;
      }
    }

    activeBaseUrl = getConfiguredBaseUrl();
    if (isDev) {
      console.warn(`[backend] sin respuesta; fallback → ${activeBaseUrl}`);
    }
    return activeBaseUrl;
  })();

  try {
    return await resolveInFlight;
  } finally {
    resolveInFlight = null;
  }
}

export async function ensureApiReady(): Promise<string> {
  return resolveWorkingApiBaseUrl();
}

export function getActiveApiBaseUrl(): string {
  return activeBaseUrl ?? getConfiguredBaseUrl();
}

export function buildApiUrl(path: string, base?: string): string {
  const root = base ?? getActiveApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${root}${normalized}`;
}

/** @deprecated Usa buildApiUrl tras ensureApiReady() */
export function apiUrl(path: string): string {
  return buildApiUrl(path);
}

export function formatBackendConnectionError(err: unknown, target?: string): string {
  const url = target ?? getActiveApiBaseUrl();
  if (err instanceof Error && err.name === 'AbortError') {
    return `El servidor no respondió a tiempo (${url}). ¿Backend encendido?`;
  }
  if (err instanceof TypeError) {
    return `No se pudo conectar con ${url}. USB: npm run android:connect. Wi‑Fi: misma red + npm run sync-ip.`;
  }
  return `No se pudo conectar con el backend (${url}).`;
}

export async function checkBackendHealth(
  timeoutMs = 6_000,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const base = await resolveWorkingApiBaseUrl(true);

  try {
    const res = await fetchWithTimeout(
      `${base}/health`,
      { method: 'GET' },
      timeoutMs,
    );
    if (!res.ok) {
      return {
        ok: false,
        error: `Backend respondió HTTP ${res.status} (${base})`,
      };
    }
    return { ok: true, url: base };
  } catch (err) {
    return { ok: false, error: formatBackendConnectionError(err, base) };
  }
}
