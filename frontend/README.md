# Expenses Mobile (PWA)

Frontend mobile-first en React + Vite + Tailwind + `vite-plugin-pwa`.

## Requisitos

- Node 20+
- Backend levantado en esta misma rama

## Variables

Crea `frontend/.env` (opcional):

```env
# URL backend para proxy de Vite en desarrollo
VITE_BACKEND_URL=http://localhost:5173

# Si queres llamar directo a otro origen en lugar de usar proxy:
# VITE_API_BASE_URL=http://localhost:5173

# Base path para build (lo calcula GitHub Actions automaticamente en deploy)
# VITE_BASE_PATH=/
```

Si no defines nada:

- `VITE_BACKEND_URL` usa `http://localhost:5173`
- `VITE_API_BASE_URL` queda vacio (usa mismo origen y proxy de Vite)

## Deploy en GitHub Pages

Hay un workflow en `/.github/workflows/deploy-frontend-pages.yml` que:

- Builda el proyecto de `frontend/`
- Calcula `VITE_BASE_PATH` automaticamente segun el repo
- Publica en GitHub Pages
- Copia `dist/index.html` a `dist/404.html` para soportar refresh de rutas SPA

Configuracion requerida en GitHub:

1. En `Settings > Pages`, selecciona `Source: GitHub Actions`.
2. En `Settings > Secrets and variables > Actions > Variables`, crea:
   - `VITE_API_BASE_URL` con la URL publica de tu backend (ej: `https://tu-backend.com`).

## Scripts

- `npm run dev` inicia frontend en `http://localhost:5174`
- `npm run build` compila produccion
- `npm run preview` sirve build en `http://localhost:4174`

## Flujo mobile implementado

- Login/Register (mismo formulario)
- Home con modo `Crear`/`Ver`
- Crear grupo
- Seleccion de tipo de gasto
- Listado de categorias/proveedores por tipo
- Crear categoria/proveedor
- Crear gasto
- Ver gastos (solo online, con filtros)
- Perfil basico placeholder

## Offline

- Offline mobile habilita **solo crear gastos**
- Crear grupo/categoria y modo Ver quedan deshabilitados offline
- Gastos creados offline se guardan en cola local y se sincronizan automaticamente al reconectar
