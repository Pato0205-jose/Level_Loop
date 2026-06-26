import { getItem } from '../storage/storage';
import {
  API_TIMEOUT_MS,
  USE_BACKEND,
  buildApiUrl,
  ensureApiReady,
  getActiveApiBaseUrl,
} from '../config/backend';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export {
  API_BASE_URL,
  USE_BACKEND,
  apiUrl,
} from '../config/backend';

const AUTH_TOKEN_KEY = '@levelloop/authToken';

export async function getAuthToken(): Promise<string | null> {
  return getItem<string>(AUTH_TOKEN_KEY);
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs = API_TIMEOUT_MS,
): Promise<Response> {
  await ensureApiReady();

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = await getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetchWithTimeout(buildApiUrl(path), { ...init, headers }, timeoutMs);
}

export function getResolvedApiBaseUrl(): string {
  return getActiveApiBaseUrl();
}
