# Frontend Mobile - Documentacion Tecnica

Fecha de actualizacion: 2026-03-05

## 1) Objetivo y alcance

Frontend mobile orientado a operacion rapida en telefono:
- autenticacion
- seleccion de grupos
- alta de gastos
- vista de gastos con filtros
- vista de ingresos
- perfil e invitaciones
- soporte offline para cache + cola de acciones de gasto

Este documento refleja el estado actual implementado.

## 2) Stack

- React 19 + Vite 7
- react-router-dom 7
- Tailwind CSS 3
- PWA (`vite-plugin-pwa`)
- persistencia local en localStorage
- HTTP con `fetch` + `credentials: 'include'`

## 3) Variables de entorno

Archivo base: `frontend/.env.example`

- `VITE_BACKEND_URL` (proxy dev)
- `VITE_API_BASE_URL` (opcional, base API explicita)
- `VITE_BASE_PATH` (deploy en subruta)

## 4) iOS, PWA y pantalla completa

Metas iOS configuradas en `frontend/index.html`:
- `viewport-fit=cover`
- `apple-mobile-web-app-capable`
- `apple-mobile-web-app-status-bar-style`
- `apple-mobile-web-app-title`

Ajustes CSS aplicados:
- safe area top/bottom con `env(safe-area-inset-*)` (`.safe-top` y `.safe-bottom`)
- anti-zoom en inputs (`font-size >= 16px` en iOS)
- cobertura completa vertical en iPhone:
  - `-webkit-fill-available` para `html/body/#root` y `.app-shell`
  - fallback `100dvh/100vh`
  - fondo oscuro base para evitar franja blanca inferior

## 5) Arquitectura

Entrada:
- `frontend/src/main.jsx`

Raiz:
- `frontend/src/App.jsx`
  - `AuthProvider`
  - `ExpenseSyncProvider`
  - `BrowserRouter`

Providers:
- `AuthContext`
  - sesion (`user`)
  - estado de conectividad (`isOnline`)
  - restore de sesion online/offline
  - carga/aplica perfil de color por usuario
- `ExpenseSyncContext`
  - contador de pendientes
  - cola offline
  - sincronizacion automatica al volver online

## 6) Rutas mobile

- `/auth`
- `/` y `/groups`
- `/profile`
- `/sets/new`
- `/sets/:setId/types`
- `/sets/:setId/categories/:typeKey`
- `/sets/:setId/categories/:typeKey/new`
- `/sets/:setId/categories/:typeKey/:categoryId/expense/new`
- `/sets/:setId/view`
- `/sets/:setId/incomes`

Regla responsive:
- en desktop (`>= lg`) `/` y `/groups` van a dashboard desktop.
- en mobile se mantiene este flujo.

## 7) API utilizada

### Auth/health
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /health/me`

### Perfil de color
- `GET /auth/color-profile`
- `PUT /auth/color-profile`

### Grupos
- `GET /sets`
- `GET /sets/:setId`
- `GET /sets/:setId/users`
- `POST /sets`

### Categorias
- `GET /sets/:setId/categories`
- `POST /sets/:setId/categories`

### Gastos
- `POST /sets/:setId/expenses`
- `GET /sets/:setId/expenses`

### Ingresos
- `GET /sets/:setId/incomes`
- `POST /sets/:setId/incomes` (solo admin)

### Invitaciones
- `POST /invite/:setId`
- `POST /invite`

## 8) Persistencia local y claves

Cache por usuario (scope):
- `expenses_mobile_user_v1`
- `expenses_mobile_sets_v1`
- `expenses_mobile_categories_v1`
- `expenses_mobile_set_users_v1`
- `expenses_mobile_expenses_v1`
- `expenses_mobile_incomes_v1`
- `expenses_mobile_ui_color_settings_v1`

Cola offline:
- `expenses_mobile_offline_actions_v1`

Favoritos:
- `expenses_mobile_favorite_groups_v1`
- `expenses_mobile_startup_group_v1`
- `expenses_mobile_favorite_categories_v1`

## 9) UX y layout mobile

Base:
- `app-shell` con alto completo de viewport
- scroll global bloqueado
- scroll solo en contenedores internos

Componentes clave:
- `MobileHeader`
- `BottomActionBar`
- `ModeToggle` (Crear / Ver / Ingresos)
- `ListCardButton`
- `SingleChoiceButtons`

## 10) Pantallas y comportamientos

### 10.1 Auth
- login/register en formulario unico
- estado visual adaptado a mobile
- layout centrado

### 10.2 Home / Groups
- lista de grupos
- toggle de modo:
  - `Crear`
  - `Ver`
  - `Ingresos`
- al tocar grupo:
  - en `Crear`: abre seleccion de tipo
  - en `Ver`: abre `ViewExpensesPage`
  - en `Ingresos`: abre `IncomesPage`
- si offline, se fuerza modo `Crear`.

### 10.3 Crear gasto
- formulario por tipo/categoria
- monto con formateo automatico
- fecha, forma de pago, usuario creador, descripcion opcional
- online: crea en API
- offline: encola accion para sync posterior

### 10.4 Ver gastos (`/sets/:setId/view`)
- filtros colapsables
- total filtrado
- listado en cards
- paginacion mobile simplificada:
  - `<< < [pagina actual] > >>`
- configuracion actual:
  - hasta 30 gastos por pagina
  - contenedor fijo con scroll interno
- colores en badges segun perfil de color activo

### 10.5 Ingresos mobile (`/sets/:setId/incomes`)
- cards de ingresos (no tabla)
- muestra:
  - tipo
  - monto
  - fecha
- boton inferior fijo para crear ingreso
- formulario de alta (solo admin y online)
- importante:
  - en mobile no hay editar/eliminar ingreso
- paginacion igual a gastos:
  - `<< < [pagina actual] > >>`
  - hasta 30 ingresos por pagina
  - contenedor fijo con scroll interno

### 10.6 Perfil (`/profile`)
- datos de usuario
- estado online/offline
- invitaciones (crear/aceptar)
- colores:
  - el perfil de color se consume tambien en mobile
  - la edicion de colores se realiza desde desktop

## 11) Perfil de color compartido (desktop + mobile)

El perfil de color se persiste por usuario en backend (`user_color_profiles`) y se cachea localmente.

Se aplica en mobile para:
- bg de botones de seleccion en formularios de creacion/filtro
- badges de `expense_type` y `payment_method` en vista de gastos
- badges de tipo en vista de ingresos

Series de analitica (`gasto/ingreso/saldo`) se usan en desktop, pero el perfil compartido se mantiene unificado.

## 12) Offline: reglas actuales

- Creacion de gasto offline: si
- Cola + sincronizacion automatica: si
- Vista de gastos offline: no (solo online)
- Vista de ingresos offline:
  - puede mostrar cache existente si ya fue cargado previamente
  - alta de ingresos offline: no

## 13) Notas de mantenimiento

- Si se agregan tipos o metodos de pago:
  - actualizar constantes/catalogos
  - actualizar mapeo de colores en `uiColorSettings.js`
  - actualizar docs funcionales y reglas
- Si se cambia contrato de ingresos:
  - actualizar `IncomesPage`
  - actualizar `apiClient`
  - actualizar esta documentacion

## 14) Resumen

El mobile actual cubre flujo productivo real de carga de gastos, consulta de gastos, consulta/carga de ingresos y gestion de grupos/invitaciones, con persistencia local por usuario y sincronizacion de acciones offline.
