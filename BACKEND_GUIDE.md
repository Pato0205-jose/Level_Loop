# Backend guide (Level Loop)

Este documento esta basado en el frontend actual de Level Loop y en una estrategia de migracion gradual.
Objetivo: pasar de almacenamiento local (AsyncStorage) a backend real sin romper la app.

## 1) Estado actual del frontend

Hoy la app guarda todo localmente en AsyncStorage a traves de servicios en `src/services`.
Dominios detectados:

- Auth: register, login, current user, update profile, onboarding flag, password reset mock.
- Progress: xp total, streak, progreso por tema, resultado de ejercicios.
- Achievements: logros desbloqueados por usuario.
- Notifications: lista local (mock), leidas/no leidas, limpiar.
- Feedback/push: mostly cliente (haptics y reminders locales).

## 2) Backend recomendado (simple + gratis)

Recomendacion: Firebase.

- Firebase Auth: email/password.
- Firestore: datos de usuario y progreso.
- Cloud Functions (opcional al inicio): logica server-side para leaderboard/cron.
- Firebase Hosting/Functions HTTP (opcional): si luego quieres endpoints REST dedicados.

Por que para este proyecto:

- Te evita mantener servidor propio desde el dia 1.
- Tiene free tier util para proyecto privado/familiar.
- Encaja con React Native + Expo.

## 3) Modelo de datos (Firestore)

Colecciones sugeridas:

1. `users/{uid}`
- name: string
- email: string
- bio: string
- dailyGoalMin: number
- interests: string[]
- onboardingDone: boolean
- createdAt: timestamp
- updatedAt: timestamp

2. `progress/{uid}`
- totalXp: number
- streakDays: number
- longestStreak: number
- lastActiveDate: string (YYYY-MM-DD)
- topics: map
  - topics.{topicId}.completed: boolean
  - topics.{topicId}.completedAt: number|null
  - topics.{topicId}.bestScore: number
  - topics.{topicId}.totalXp: number
  - topics.{topicId}.attempts: number
  - topics.{topicId}.lastPlayedAt: number|null
- updatedAt: timestamp

3. `achievements/{uid}`
- unlockedMap: map<achievementId, epochMs>
- updatedAt: timestamp

## 2) Backend recomendado con Neon

Recomendacion: Neon como base de datos Postgres + una API ligera propia.

- Neon: base de datos Postgres administrada.
- API: Hono, Express o Fastify en Node.js.
- ORM: Prisma o Drizzle.
- Auth: JWT con password hash, o un proveedor aparte si quieres evitar construir auth desde cero.

Por que esta ruta encaja mejor si ya elegiste Neon:

- Neon cubre bien la capa de datos y suele ser mas facil de mantener que montar infraestructura propia.
- Te deja tener control del backend sin depender de Firestore.
- Puedes empezar pequeno y seguir escalando sin rehacer el frontend.

## 3) Stack minimo recomendado

Opcion mas simple para empezar:

1. API en Node.js con Hono o Express.
2. Prisma con Neon Postgres.
3. JWT para sesiones.
4. bcrypt para contraseñas.

Si quieres evitar hacer auth desde cero, puedes combinar Neon con un proveedor de autenticacion aparte, pero la base de datos seguiria siendo Neon.

## 4) Modelo de datos (Postgres)

Tablas sugeridas:

1. `users`
- id: text o uuid
- email: text unique
- password_hash: text
- name: text
- bio: text
- daily_goal_min: int
- interests: text[]
- onboarding_done: boolean
- created_at: timestamptz
- updated_at: timestamptz

2. `progress`
- user_id: fk -> users.id
- total_xp: int
- streak_days: int
- longest_streak: int
- last_active_date: date o text YYYY-MM-DD
- updated_at: timestamptz

3. `progress_topics`
- id: uuid
- user_id: fk -> users.id
- topic_id: text
- completed: boolean
- completed_at: timestamptz null
- best_score: int
- total_xp: int
- attempts: int
- last_played_at: timestamptz null

4. `achievements`
- id: uuid
- user_id: fk -> users.id
- achievement_id: text
- unlocked_at: timestamptz

5. `notifications`
- id: uuid
- user_id: fk -> users.id
- type: text
- title: text
- message: text
- icon: text
- color: text
- created_at: timestamptz
- read: boolean

6. `refresh_tokens` o `sessions` (si no usas JWT stateless puro)
- opcional segun tu estrategia de auth.

## 5) Mapeo 1:1 de servicios actuales -> backend

### Auth (`src/services/auth.ts`)

- `register` -> `POST /auth/register`
- `login` -> `POST /auth/login`
- `getCurrentUser` -> `GET /me`
- `updateCurrentUser` -> `PATCH /me`
- `requestPasswordReset` -> `POST /auth/password-reset`
- `isOnboardingDone`/`setOnboardingDone` -> campo `onboarding_done` en `users`

### Progress (`src/services/progress.ts`)

- `getProgress(userId)` -> `GET /progress/me`
- `saveProgress(userId, progress)` -> `PUT /progress/me`
- `recordExerciseResult` -> idealmente `POST /progress/exercise-result`

### Achievements (`src/services/achievements.ts`)

- `getUnlockedMap`/`setUnlockedMap` -> `GET /achievements/me` y `PUT /achievements/me`
- `syncAchievements` -> endpoint que recibe progreso y devuelve logros nuevos

### Notifications (`src/services/notifications.ts`)

- `getNotifications` -> `GET /notifications`
- `markAsRead` -> `PATCH /notifications/:id`
- `markAllAsRead` -> `POST /notifications/mark-all`
- `clearNotifications` -> `DELETE /notifications`

## 6) Plan por fases con Neon

### Fase 1

- Crear Neon Postgres.
- Crear API mínima con auth y perfil.
- Conectar el frontend a endpoints reales sin cambiar pantallas.

Criterio de salida:

- Registro/login reales.
- Perfil y onboarding persistentes.
- El usuario queda guardado en Neon.

### Fase 2

- Migrar progreso, logros y notificaciones.
- Reemplazar el fallback local por persistencia remota real.

### Fase 3

- Leaderboard real.
- Reglas de negocio en backend.
- Tareas programadas o cron para notificaciones y rachas.

## 7) Checklist tecnico inicial

1. Crear proyecto Neon.
2. Crear base Postgres.
3. Elegir stack de API (Hono/Express/Fastify).
4. Generar schema con Prisma o Drizzle.
5. Implementar auth.
6. Conectar `src/services/auth.ts` a la API.
7. Conectar `src/services/progress.ts` a la API.
8. Probar flujo completo: register -> onboarding -> ejercicio -> reopen app.
- Conserva una bandera de modo (`local` vs `remote`) durante transicion.
- Si hay error de red, muestra mensaje amigable y no crashear.
- Evita cambiar la UI; enfocate en capa de servicios.

## 9) Que hacemos en el siguiente paso

Siguiente paso recomendado:

- Definir si quieres auth propia con JWT o auth externa, y luego implementar la Fase 1 con Neon y una API minima.
