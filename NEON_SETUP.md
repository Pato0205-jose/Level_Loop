# Neon setup rapido para Level Loop

Esta guia reemplaza el camino de Firebase si Level Loop va a usar Neon como base de datos y Node.js como backend.

## 1) Crear cuenta y proyecto

1. Entra a neon.tech.
2. Crea una cuenta o inicia sesion.
3. Crea un nuevo project para Level Loop.
4. Elige la region mas cercana a ti o a tus usuarios.

## 2) Obtener la cadena de conexion

1. En el proyecto, abre la seccion de connection details.
2. Copia el connection string de Postgres.
3. Guarda esa cadena en una variable local segura.

Ejemplo de variable de entorno:

```txt
DATABASE_URL=postgresql://usuario:password@host/db?sslmode=require
```

## 3) Elegir el backend en Node.js

Necesitas una API entre la app Expo y Neon.

Recomendacion simple para empezar:

1. Node.js.
2. Express o Hono.
3. Prisma o Drizzle.
4. JWT para autenticacion.

Si quieres velocidad de desarrollo, Express + Prisma es la opcion mas directa.

## 4) Tablas iniciales sugeridas

1. users
2. progress
3. progress_topics
4. achievements
5. notifications

## 5) Orden recomendado de implementacion

Despues de crear Neon, conecta primero lo minimo para que Level Loop ya pueda guardar usuarios y perfil:

1. register.
2. login.
3. me / current user.
4. update profile.
5. onboarding_done.

Cuando eso funcione, sigue con:

1. progress.
2. achievements.
3. notifications.

## 6) Siguiente paso tecnico

Lo ideal ahora es usar el starter Node.js que ya quedó en `backend/` y completar estas piezas:

1. `src/server` o una carpeta `backend` separada.
2. Configuracion de `DATABASE_URL`.
3. Prisma schema para `users`, `progress` y `achievements`.
4. Endpoints REST para auth y perfil.
5. Conexion del frontend Expo a esa API.

Cuando eso funcione, seguimos con progress, achievements y notifications.
