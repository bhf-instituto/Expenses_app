# Expenses Frontend

Frontend React + Vite + PWA para gestion de gastos con modo offline:

- auth: `register`, `login`, `logout`, `health/me`
- grupos (`sets`)
- gastos por grupo
- cola offline para crear/editar/eliminar gastos
- sincronizacion delta (`updated_at` + `deleted_expenses`)
- almacenamiento local con IndexedDB

## Ejecutar

```bash
npm install
npm run dev
```

## Publicar Dist En Rama Separada

La rama de codigo es `frontend` y la rama de build es `frontend-dist`.

```bash
npm run dist
```

Este comando:
- genera `dist`
- copia el contenido de `dist` a `frontend-dist`
- no pisa archivos de tu rama actual porque usa un `git worktree` temporal

Opcional:

```bash
DIST_PUSH=true npm run dist
```

Para cambiar la rama de destino:

```bash
DIST_BRANCH=mi-rama-dist npm run dist
```

## Variables de entorno

Crear `.env` usando `.env.example`:

```bash
VITE_API_BASE_URL=/api
VITE_AUTH_REGISTER_PATH=/auth/register
VITE_AUTH_LOGIN_PATH=/auth/login
VITE_AUTH_LOGOUT_PATH=/auth/logout
VITE_AUTH_ME_PATH=/health/me
VITE_HEALTH_PATH=/health/me
VITE_SETS_PATH=/sets
VITE_EXPENSES_PATH=/expenses
```

El backend responde errores en `data.message`; el frontend ya lo interpreta.

En desarrollo, `/api` usa proxy de Vite al backend remoto y evita errores de CORS desde `localhost:5173`.
