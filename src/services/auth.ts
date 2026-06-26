import { StorageKeys } from '../storage/keys';
import { getItem, removeItem, setItem } from '../storage/storage';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { getFirebaseAuth, getFirestoreDb } from './firebase';
import {
  AUTH_TIMEOUT_MS,
  buildApiUrl,
  ensureApiReady,
  formatBackendConnectionError,
  USE_BACKEND as USE_BACKEND_AUTH,
} from '../config/backend';
import { getAuthToken } from './api';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export type UserAccount = {
  id: string;
  email: string;
  /** Compatibilidad con modo local legado. */
  password?: string;
  name: string;
  bio: string;
  dailyGoalMin: number;
  interests: string[];
  createdAt: number;
};

export type PublicUser = Omit<UserAccount, 'password'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return 'El email es obligatorio.';
  if (!EMAIL_RE.test(v)) return 'El formato del email no es válido.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'La contraseña es obligatoria.';
  if (password.length < 8) return 'Usa al menos 8 caracteres.';
  return null;
}

export function validateName(name: string): string | null {
  const v = name.trim();
  if (!v) return 'El nombre es obligatorio.';
  if (v.length < 2) return 'Usa al menos 2 caracteres.';
  return null;
}

function toPublic(user: UserAccount): PublicUser {
  const { password: _password, ...rest } = user;
  return rest;
}

type UserDoc = {
  email: string;
  name: string;
  bio: string;
  dailyGoalMin: number;
  interests: string[];
  createdAt: number;
  updatedAt: number;
  onboardingDone?: boolean;
};

const USERS_COLLECTION = 'users';
const AUTH_TOKEN_KEY = '@levelloop/authToken';

type BackendUser = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  dailyGoalMin: number;
  interests: string[];
  onboardingDone?: boolean;
  createdAt: string;
};

function usersRef(uid: string) {
  return doc(getFirestoreDb(), USERS_COLLECTION, uid);
}

function toPublicFromDoc(uid: string, data: Partial<UserDoc> | undefined): PublicUser {
  return {
    id: uid,
    email: data?.email ?? '',
    name: data?.name ?? 'Cadete',
    bio: data?.bio ?? '',
    dailyGoalMin: data?.dailyGoalMin ?? 10,
    interests: data?.interests ?? [],
    createdAt: data?.createdAt ?? Date.now(),
  };
}

function mapAuthError(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.startsWith('[firebase]')) {
    return err.message;
  }
  const code = (err as AuthError | undefined)?.code;
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese email.';
    case 'auth/invalid-email':
      return 'El formato del email no es válido.';
    case 'auth/user-not-found':
      return 'No encontramos una cuenta con ese email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Contraseña incorrecta.';
    case 'auth/network-request-failed':
      return 'No hay conexión a internet. Intenta de nuevo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
    default:
      return fallback;
  }
}

function toPublicFromBackend(user: BackendUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? 'Cadete',
    bio: user.bio ?? '',
    dailyGoalMin: user.dailyGoalMin,
    interests: user.interests ?? [],
    createdAt: Number.isFinite(Date.parse(user.createdAt))
      ? Date.parse(user.createdAt)
      : Date.now(),
  };
}

async function backendFetch(
  path: string,
  init: RequestInit = {},
  timeoutMs = AUTH_TIMEOUT_MS,
): Promise<Response> {
  await ensureApiReady();
  return fetchWithTimeout(buildApiUrl(path), init, timeoutMs);
}

const BACKEND_ERROR_ES: Record<string, string> = {
  'Email already in use': 'Ya existe una cuenta con ese email.',
  'Invalid email or password': 'Email o contraseña incorrectos.',
  'Invalid request body': 'Datos inválidos. Revisa el formulario.',
  'Invalid verification code': 'Ingresa un código de 6 dígitos.',
  'Invalid or expired verification code': 'Código inválido o expirado.',
  'Missing authorization token': 'Sesión expirada. Inicia sesión de nuevo.',
  'Invalid token': 'Sesión expirada. Inicia sesión de nuevo.',
  'Invalid or expired reset token': 'Código inválido o expirado.',
  'User not found': 'No encontramos tu cuenta.',
  'Email verification required. Use /auth/login/request-code first.':
    'Se requiere verificación por correo.',
  'Email verification required. Use /auth/register/request-code first.':
    'Se requiere verificación por correo.',
  'No se pudo enviar el correo.':
    'No se pudo enviar el correo. Verifica el email e intenta de nuevo.',
};

async function parseBackendError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) {
      const msg = body.error;
      if (msg.includes('testing emails') || msg.includes('verify a domain')) {
        return 'En modo prueba solo se pueden enviar correos a la cuenta verificada en Resend.';
      }
      return BACKEND_ERROR_ES[msg] ?? msg;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

async function setAuthSession(userId: string, token: string): Promise<void> {
  await setItem(StorageKeys.CURRENT_USER_ID, userId);
  await setItem(AUTH_TOKEN_KEY, token);
}

let authHydrationPromise: Promise<void> | null = null;

async function waitForAuthHydration(): Promise<void> {
  if (authHydrationPromise) {
    return authHydrationPromise;
  }
  let auth;
  try {
    auth = getFirebaseAuth();
  } catch {
    authHydrationPromise = Promise.resolve();
    return authHydrationPromise;
  }
  authHydrationPromise = new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
  return authHydrationPromise;
}

async function getOrCreateUserDoc(uid: string, email: string): Promise<PublicUser> {
  const ref = usersRef(uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return toPublicFromDoc(uid, snap.data() as Partial<UserDoc>);
  }

  const createdAt = Date.now();
  const bootstrap: UserDoc = {
    email,
    name: email.split('@')[0] || 'Cadete',
    bio: '',
    dailyGoalMin: 10,
    interests: [],
    createdAt,
    updatedAt: createdAt,
    onboardingDone: false,
  };
  await setDoc(ref, bootstrap);
  return toPublicFromDoc(uid, bootstrap);
}

export async function requestRegisterCode(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; devCode?: string }> {
  const nameErr = validateName(input.name);
  if (nameErr) return { ok: false, error: nameErr };
  const emailErr = validateEmail(input.email);
  if (emailErr) return { ok: false, error: emailErr };
  const passErr = validatePassword(input.password);
  if (passErr) return { ok: false, error: passErr };

  const email = input.email.trim().toLowerCase();

  if (USE_BACKEND_AUTH) {
    try {
      const res = await backendFetch('/auth/register/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: input.name.trim(),
          email,
          password: input.password,
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          error: await parseBackendError(res, 'No se pudo enviar el código.'),
        };
      }

      const body = (await res.json()) as { devCode?: string };
      return { ok: true, devCode: body.devCode };
    } catch (err) {
      return { ok: false, error: formatBackendConnectionError(err) };
    }
  }

  return { ok: false, error: 'Registro con código solo disponible con backend.' };
}

export async function verifyRegisterCode(input: {
  email: string;
  code: string;
}): Promise<{ user?: PublicUser; error?: string }> {
  const emailErr = validateEmail(input.email);
  if (emailErr) return { error: emailErr };
  if (!/^\d{6}$/.test(input.code.trim())) {
    return { error: 'Ingresa un código de 6 dígitos.' };
  }

  const email = input.email.trim().toLowerCase();

  if (USE_BACKEND_AUTH) {
    try {
      const res = await backendFetch('/auth/register/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: input.code.trim(),
        }),
      });

      if (!res.ok) {
        return {
          error: await parseBackendError(res, 'No se pudo crear la cuenta.'),
        };
      }

      const payload = (await res.json()) as { user: BackendUser; token: string };
      const user = toPublicFromBackend(payload.user);
      await setAuthSession(user.id, payload.token);
      return { user };
    } catch (err) {
      return { error: formatBackendConnectionError(err) };
    }
  }

  return { error: 'Registro con código solo disponible con backend.' };
}

/** @deprecated Usa requestRegisterCode + verifyRegisterCode */
export async function register(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user?: PublicUser; error?: string }> {
  const sent = await requestRegisterCode(input);
  if (!sent.ok) return { error: sent.error };
  return { error: 'Revisa tu correo e ingresa el código de verificación.' };
}

export async function requestLoginCode(input: {
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; devCode?: string }> {
  const emailErr = validateEmail(input.email);
  if (emailErr) return { ok: false, error: emailErr };
  const passErr = validatePassword(input.password);
  if (passErr) return { ok: false, error: passErr };

  const email = input.email.trim().toLowerCase();

  if (USE_BACKEND_AUTH) {
    try {
      const res = await backendFetch('/auth/login/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password: input.password,
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          error: await parseBackendError(res, 'No se pudo enviar el código.'),
        };
      }

      const body = (await res.json()) as { devCode?: string };
      return { ok: true, devCode: body.devCode };
    } catch (err) {
      return { ok: false, error: formatBackendConnectionError(err) };
    }
  }

  return { ok: false, error: 'Inicio de sesión con código solo disponible con backend.' };
}

export async function verifyLoginCode(input: {
  email: string;
  code: string;
}): Promise<{ user?: PublicUser; error?: string }> {
  const emailErr = validateEmail(input.email);
  if (emailErr) return { error: emailErr };
  if (!/^\d{6}$/.test(input.code.trim())) {
    return { error: 'Ingresa un código de 6 dígitos.' };
  }

  const email = input.email.trim().toLowerCase();

  if (USE_BACKEND_AUTH) {
    try {
      const res = await backendFetch('/auth/login/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: input.code.trim(),
        }),
      });

      if (!res.ok) {
        return {
          error: await parseBackendError(res, 'No se pudo iniciar sesión.'),
        };
      }

      const payload = (await res.json()) as { user: BackendUser; token: string };
      const user = toPublicFromBackend(payload.user);
      await setAuthSession(user.id, payload.token);
      return { user };
    } catch (err) {
      return { error: formatBackendConnectionError(err) };
    }
  }

  return { error: 'Inicio de sesión con código solo disponible con backend.' };
}

/** @deprecated Usa requestLoginCode + verifyLoginCode */
export async function login(input: {
  email: string;
  password: string;
}): Promise<{ user?: PublicUser; error?: string }> {
  const sent = await requestLoginCode(input);
  if (!sent.ok) return { error: sent.error };
  return { error: 'Revisa tu correo e ingresa el código de verificación.' };
}

export async function logout(): Promise<void> {
  if (USE_BACKEND_AUTH) {
    await removeItem(AUTH_TOKEN_KEY);
    await removeItem(StorageKeys.CURRENT_USER_ID);
    return;
  }

  try {
    await signOut(getFirebaseAuth());
  } catch {
    // Si Firebase no esta configurado, limpiamos estado local y continuamos.
  }
  await removeItem(StorageKeys.CURRENT_USER_ID);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  if (USE_BACKEND_AUTH) {
    const token = await getAuthToken();
    if (!token) {
      return null;
    }

    try {
      const res = await backendFetch('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          await removeItem(AUTH_TOKEN_KEY);
          await removeItem(StorageKeys.CURRENT_USER_ID);
        }
        return null;
      }

      const payload = (await res.json()) as { user: BackendUser };
      const user = toPublicFromBackend(payload.user);
      await setItem(StorageKeys.CURRENT_USER_ID, user.id);
      return user;
    } catch {
      return null;
    }
  }

  await waitForAuthHydration();
  try {
    const auth = getFirebaseAuth();
    const current = auth.currentUser;
    if (!current?.uid || !current.email) {
      return null;
    }
    const user = await getOrCreateUserDoc(current.uid, current.email);
    await setItem(StorageKeys.CURRENT_USER_ID, current.uid);
    return user;
  } catch {
    return null;
  }
}

export async function updateCurrentUser(
  updates: Partial<Omit<UserAccount, 'id' | 'email' | 'password' | 'createdAt'>>,
): Promise<PublicUser | null> {
  if (USE_BACKEND_AUTH) {
    const token = await getAuthToken();
    if (!token) return null;

    try {
      const res = await backendFetch('/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...(updates.name !== undefined ? { name: updates.name } : {}),
          ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
          ...(updates.dailyGoalMin !== undefined ? { dailyGoalMin: updates.dailyGoalMin } : {}),
          ...(updates.interests !== undefined ? { interests: updates.interests } : {}),
        }),
      });

      if (!res.ok) {
        return null;
      }

      const payload = (await res.json()) as { user: BackendUser };
      return toPublicFromBackend(payload.user);
    } catch {
      return null;
    }
  }

  await waitForAuthHydration();
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  if (!current?.uid || !current.email) return null;

  const ref = usersRef(current.uid);
  const snap = await getDoc(ref);
  const prev = toPublicFromDoc(current.uid, snap.data() as Partial<UserDoc> | undefined);
  const now = Date.now();
  const nextDoc: UserDoc = {
    email: prev.email || current.email,
    name: updates.name ?? prev.name,
    bio: updates.bio ?? prev.bio,
    dailyGoalMin: updates.dailyGoalMin ?? prev.dailyGoalMin,
    interests: updates.interests ?? prev.interests,
    createdAt: prev.createdAt,
    updatedAt: now,
    onboardingDone:
      (snap.data() as Partial<UserDoc> | undefined)?.onboardingDone ?? false,
  };

  await setDoc(ref, nextDoc, { merge: true });
  return toPublicFromDoc(current.uid, nextDoc);
}

export async function requestPasswordReset(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  const emailErr = validateEmail(email);
  if (emailErr) return { ok: false, error: emailErr };

  if (USE_BACKEND_AUTH) {
    try {
      const res = await backendFetch('/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!res.ok) {
        return {
          ok: false,
          error: await parseBackendError(res, 'No se pudo enviar el código de verificación.'),
        };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el backend.' };
    }
  }

  try {
    await sendPasswordResetEmail(getFirebaseAuth(), email.trim().toLowerCase());
    return { ok: true };
  } catch (err) {
    if ((err as AuthError | undefined)?.code === 'auth/user-not-found') {
      return { ok: false, error: 'No hay cuenta asociada a ese email.' };
    }
    return {
      ok: false,
      error: mapAuthError(err, 'No se pudo enviar el correo de recuperación.'),
    };
  }
}

export async function confirmPasswordReset(input: {
  email: string;
  code: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const emailErr = validateEmail(input.email);
  if (emailErr) return { ok: false, error: emailErr };
  const passErr = validatePassword(input.password);
  if (passErr) return { ok: false, error: passErr };
  if (!/^\d{6}$/.test(input.code.trim())) {
    return { ok: false, error: 'Ingresa un código de 6 dígitos.' };
  }

  if (USE_BACKEND_AUTH) {
    try {
      const res = await backendFetch('/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: input.email.trim().toLowerCase(),
          code: input.code.trim(),
          password: input.password,
        }),
      });

      if (!res.ok) {
        return {
          ok: false,
          error: await parseBackendError(res, 'No se pudo restablecer la contraseña.'),
        };
      }

      return { ok: true };
    } catch {
      return { ok: false, error: 'No se pudo conectar con el backend.' };
    }
  }

  return { ok: false, error: 'Recuperación de contraseña no disponible sin backend.' };
}

export async function isOnboardingDone(): Promise<boolean> {
  if (USE_BACKEND_AUTH) {
    const token = await getAuthToken();
    if (!token) {
      return (await getItem<boolean>(StorageKeys.ONBOARDING_DONE)) === true;
    }

    try {
      const res = await backendFetch('/auth/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        return (await getItem<boolean>(StorageKeys.ONBOARDING_DONE)) === true;
      }
      const payload = (await res.json()) as { user: BackendUser };
      return payload.user.onboardingDone === true;
    } catch {
      return (await getItem<boolean>(StorageKeys.ONBOARDING_DONE)) === true;
    }
  }

  await waitForAuthHydration();
  try {
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return (await getItem<boolean>(StorageKeys.ONBOARDING_DONE)) === true;
    }
    const snap = await getDoc(usersRef(uid));
    return (snap.data() as Partial<UserDoc> | undefined)?.onboardingDone === true;
  } catch {
    return (await getItem<boolean>(StorageKeys.ONBOARDING_DONE)) === true;
  }
}

export async function setOnboardingDone(done: boolean): Promise<void> {
  if (USE_BACKEND_AUTH) {
    const token = await getAuthToken();
    if (token) {
      try {
        await backendFetch('/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ onboardingDone: done }),
        });
      } catch {
        // Si falla red/API, mantenemos fallback local para no bloquear UX.
      }
    }
    await setItem(StorageKeys.ONBOARDING_DONE, done);
    return;
  }

  await waitForAuthHydration();
  try {
    const auth = getFirebaseAuth();
    const uid = auth.currentUser?.uid;
    if (uid) {
      await setDoc(
        usersRef(uid),
        {
          onboardingDone: done,
          updatedAt: Date.now(),
        },
        { merge: true },
      );
    }
  } catch {
    // Fallback local si Firebase no esta configurado.
  }
  await setItem(StorageKeys.ONBOARDING_DONE, done);
}
