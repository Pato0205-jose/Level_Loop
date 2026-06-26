# Level Loop

App de aprendizaje (Expo 56 + React Native) con backend Express, Prisma y PostgreSQL (Neon).

## Requisitos

- Node.js 20+
- Android Studio (para APK / emulador)
- Cuenta Neon (Postgres) y opcional Resend (emails)

## Configuración rápida

```powershell
# 1. Dependencias
npm install
cd backend && npm install && cd ..

# 2. Variables de entorno
copy .env.example .env
copy backend\.env.example backend\.env
# Edita backend\.env (DATABASE_URL, JWT_SECRET, RESEND_API_KEY)

# 3. Base de datos
cd backend
npm run prisma:migrate
npm run seed
npm run dev

# 4. App en Android (otra terminal, USB conectado)
cd ..
npm run sync-ip
npm run android:connect
npx expo run:android
```

## Scripts útiles

| Comando | Descripción |
|---------|-------------|
| `npm run sync-ip` | Actualiza la IP LAN en `.env` |
| `npm run android:connect` | `adb reverse` + firewall |
| `npm run android` | Conecta + compila + instala |
| `cd backend && npm run dev` | API en puerto 3000 |

## Git — no romper la versión anterior

Usa ramas para cada cambio; **no trabajes directo en `main`** si quieres poder volver atrás:

```powershell
git checkout main
git pull
git checkout -b feature/mi-cambio

# ... editas, pruebas ...

git add .
git commit -m "Describe el cambio"
git push -u origin feature/mi-cambio
```

- **`main`** — versión estable que funciona.
- **`feature/*`** — cambios nuevos; si algo falla, vuelves a `main`.
- **Tags** — marcas versiones que sabes que funcionan:
  ```powershell
  git tag v1.0.0
  git push origin v1.0.0
  ```
- **Recuperar una versión anterior:**
  ```powershell
  git checkout v1.0.0
  # o
  git checkout main
  git reset --hard origin/main   # solo si quieres descartar cambios locales
  ```

## Seguridad

- **Nunca** subas `.env` ni `backend/.env` (ya están en `.gitignore`).
- Rota claves si alguna se expuso en chat o logs.

## Repositorio

https://github.com/Pato0205-jose/Level_Loop.git
