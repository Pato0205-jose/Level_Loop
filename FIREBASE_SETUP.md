# Firebase setup rapido (Fase 1)

Nota: esta guia solo aplica si decides volver a Firebase. Si tu base de datos sera Neon, usa [NEON_SETUP.md](NEON_SETUP.md) y [BACKEND_GUIDE.md](BACKEND_GUIDE.md).

## 1) Crear proyecto

1. Entra a Firebase Console.
2. Crea proyecto nuevo (ejemplo: level-loop).
3. Agrega app Web (si, aunque uses Expo) para obtener config SDK.

## 2) Activar servicios

1. Authentication -> Sign-in method -> habilita Email/Password.
2. Firestore Database -> Create database (Production mode).

## 3) Variables de entorno

1. Duplica `.env.example` como `.env.local`.
2. Llena los valores con tu config de Firebase.
3. Reinicia Metro/Expo despues de cambiar env vars.

## 4) Reglas iniciales Firestore

Pega estas reglas en Firestore Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }

    match /users/{uid} {
      allow read, write: if isOwner(uid);
    }

    match /progress/{uid} {
      allow read, write: if isOwner(uid);
    }

    match /achievements/{uid} {
      allow read, write: if isOwner(uid);
    }

    match /notifications/{uid}/items/{id} {
      allow read, write: if isOwner(uid);
    }
  }
}
```

## 5) Probar Fase 1 actual

Con lo implementado en esta iteracion ya debes poder:

1. Registrar cuenta real con email/password.
2. Iniciar sesion real.
3. Cargar usuario actual desde Firebase.
4. Guardar edicion de perfil en Firestore.
5. Guardar bandera de onboarding en Firestore.
6. Guardar/cargar progreso principal en Firestore.
7. Sincronizar logros en Firestore.
8. Cargar y actualizar notificaciones desde Firestore.

Si sale error de config, revisa primero `.env.local`.

## 6) Comandos de prueba local

1. Instalar dependencias (si hace falta): `npm install`
2. Iniciar en web: `npm run web`
3. Iniciar en Expo nativo: `npm run start`

Tip: despues de cambiar `.env.local`, reinicia el bundler para que tome las nuevas variables.
