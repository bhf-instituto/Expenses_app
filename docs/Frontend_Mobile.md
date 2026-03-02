# Frontend Mobile - Documentacion Tecnica

Fecha de actualizacion: 2026-03-02

## 1) Objetivo y alcance

Este documento describe en detalle el frontend mobile del proyecto de gastos.

Alcance actual:
- Aplicacion React + Vite + PWA orientada a uso mobile.
- Flujo principal de alta rapida de gastos.
- Soporte offline para creacion de gastos (cola local + sincronizacion automatica al reconectar).
- Modo VER solo online.
- Gestion de invitaciones a grupos desde perfil.

Fuera de alcance por ahora:
- Dashboard desktop completo (tablas avanzadas, graficos, etc.).
- Funcionalidades desktop especificas.

## 2) Stack y herramientas

- Runtime/UI: React 19
- Routing: react-router-dom 7
- Build tool: Vite 7
- PWA: vite-plugin-pwa
- Estilos: Tailwind CSS 3 + CSS utilitario propio
- Persistencia local: localStorage
- Transporte HTTP: fetch con `credentials: 'include'`

Archivo clave de configuracion PWA y proxy:
- `frontend/vite.config.js`

## 3) Ejecucion local

Desde `frontend/`:

```bash
npm install
npm run dev
```

Scripts disponibles:
- `npm run dev` -> levanta Vite en puerto 5174
- `npm run build` -> build de produccion
- `npm run preview` -> preview en puerto 4174
- `npm run lint` -> linting ESLint

## 4) Variables de entorno

Archivo de referencia:
- `frontend/.env.example`

Variables:
- `VITE_BACKEND_URL` (usada por el proxy de Vite en desarrollo)
- `VITE_API_BASE_URL` (opcional, para forzar base absoluta en el cliente)
- `VITE_BASE_PATH` (opcional, base path para deploy en subruta como GitHub Pages)

Comportamiento:
- Si `VITE_API_BASE_URL` no esta definida, el cliente usa `window.location.origin`.
- En desarrollo, el proxy de Vite redirige rutas API (`/auth`, `/health`, `/sets`, `/invite`, etc.) al backend.
- `VITE_BASE_PATH` se usa para construir `base` de Vite y `start_url`/`scope` del manifest PWA.

## 4.1) iOS Safari y modo standalone

- En iOS, el modo pantalla completa solo aplica si la app fue instalada via **Agregar a pantalla de inicio**.
- En Safari (sin instalar), las barras superior/inferior no se pueden ocultar por limitaciones del navegador.
- Se agregaron metadatos iOS en `frontend/index.html`:
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-status-bar-style`
  - `apple-mobile-web-app-title`
  - `viewport-fit=cover`

Zoom automatico en inputs:
- iOS Safari hace zoom si el input es menor a 16px.
- Se fuerza `font-size: 16px` en `input/textarea/select` solo en iOS para evitarlo.

## 5) Arquitectura general

Entrada principal:
- `frontend/src/main.jsx`
  - Registra service worker con `registerSW({ immediate: true })`.
  - Renderiza `<App />`.

Composicion raiz:
- `frontend/src/App.jsx`
  - `<AuthProvider>`
  - `<ExpenseSyncProvider>`
  - `<BrowserRouter>`
  - Rutas protegidas con `RequireAuth` y publico con `GuestOnly`.

### Providers

#### AuthProvider (`frontend/src/context/AuthContext.jsx`)
Responsabilidades:
- Manejo de sesion (`user`, `booting`).
- Deteccion de conectividad (`isOnline`) via `useOnlineStatus()`.
- Restore de sesion:
  - Online: consulta `/health/me`.
  - Offline: usa usuario cacheado.
- Operaciones:
  - `login(payload)`
  - `register(payload)`
  - `logout()`

Notas:
- Si hay usuario valido se cachea en localStorage.
- `logout` limpia sesion local aunque falle la llamada remota.

#### ExpenseSyncProvider (`frontend/src/context/ExpenseSyncContext.jsx`)
Responsabilidades:
- Mantener contador de pendientes `pendingCount`.
- Encolar gastos offline (`queueExpense`).
- Sincronizar automaticamente al estar online (`syncPendingExpenses`).

Regla de sincronizacion:
- Si falla `expensesApi.create` con error 4xx: descarta ese item (error de validacion/datos).
- Si falla por otros motivos (red/5xx): conserva item en cola para reintento.

## 6) Capa de datos y API

Cliente HTTP:
- `frontend/src/lib/apiClient.js`

Caracteristicas:
- Wrapper `request()` con parse de JSON y manejo de errores.
- Error tipado `ApiError` con `status` y `payload`.
- Siempre envia cookies/sesion con `credentials: 'include'`.
- Si hay tokens en localStorage, envia:
  - `Authorization: Bearer <access_token>`
  - `X-Refresh-Token: <refresh_token>`

Compatibilidad iOS:
- Safari puede bloquear cookies cross-site (ITP).
- El cliente guarda tokens devueltos en login/register y los envia por headers para evitar perder sesion.

Endpoints usados actualmente:

- Health
  - `GET /health/me`

- Auth
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/logout`

- Grupos (sets)
  - `GET /sets`
  - `GET /sets/:setId`
  - `GET /sets/:setId/users`
  - `POST /sets`

- Categorias
  - `GET /sets/:setId/categories?expense_type=...`
  - `POST /sets/:setId/categories`

- Gastos
  - `POST /sets/:setId/expenses`
  - `GET /sets/:setId/expenses` (con filtros)

- Invitaciones
  - `POST /invite/:setId` (crear invitacion)
  - `POST /invite` (aceptar invitacion)

## 7) Persistencia local y claves

### Cache de datos (`frontend/src/lib/localCache.js`)

Cacheo por sesion de usuario:
- Todos los caches de grupos/categorias/usuarios se guardan con scope por usuario (`scope:id:<userId>` o `scope:email:<email>`).
- Si no hay usuario, se usa scope `global` y se reutiliza el cache legacy.

Helper:
- `frontend/src/lib/sessionScope.js` centraliza la resolucion del scope por usuario.

- `expenses_mobile_user_v1`
  - Usuario para restore offline de sesion.

- `expenses_mobile_sets_v1`
  - Lista de grupos cacheada (por usuario).

- `expenses_mobile_categories_v1`
  - Categorias cacheadas por `setId` y `expenseType` (por usuario).
  - Cuando se piden todas las categorias se usa clave interna `all`.

- `expenses_mobile_set_users_v1`
  - Usuarios cacheados por grupo (por usuario).

### Cola offline (`frontend/src/lib/offlineExpenseQueue.js`)

- `expenses_mobile_offline_queue_v1`
  - Cola de gastos pendientes de sincronizar.

Cada item incluye:
- `id` local
- `setId`
- `payload`
- `queuedAt`

### Favoritos y grupo de inicio (`frontend/src/lib/favoritesStorage.js`)

- `expenses_mobile_favorite_groups_v1`
  - Grupo favorito unico (solo uno a la vez), con scope por usuario.

- `expenses_mobile_startup_group_v1`
  - Ultimo grupo usado para arranque rapido, con scope por usuario.

- `expenses_mobile_favorite_categories_v1`
  - Favoritos por scope `setId:expenseTypeId`, con scope por usuario.

Notas:
- Los favoritos se guardan en localStorage y funcionan igual online/offline.
- En caso de datos legacy, el cache global se migra automaticamente al primer uso.

### Tokens de sesion (`frontend/src/lib/tokenStorage.js`)

- `expenses_mobile_access_token_v1`
  - Access token usado para `Authorization`.
- `expenses_mobile_refresh_token_v1`
  - Refresh token enviado en `X-Refresh-Token`.

## 8) Sistema de rutas

Definidas en `frontend/src/App.jsx`.

- `/auth`
  - Publica (GuestOnly)
  - Login/Register en un unico formulario.

- `/` y `/groups`
  - Protegidas
  - Home mobile con lista de grupos y selector Crear/Ver.

- `/profile`
  - Protegida
- Perfil + invitaciones (solo online).
 - Selectores de grupo/usuarios usan cache por sesion para evitar flashes de loading.

- `/sets/new`
  - Protegida
  - Crear grupo.

- `/sets/:setId/types`
  - Protegida
  - Seleccion de tipo de gasto (FIJO, VARIABLE, PROVEEDOR).

- `/sets/:setId/categories/:typeKey`
  - Protegida
  - Lista de categorias/proveedores por tipo.

- `/sets/:setId/categories/:typeKey/new`
  - Protegida
  - Alta de categoria/proveedor.

- `/sets/:setId/categories/:typeKey/:categoryId/expense/new`
  - Protegida
  - Alta de gasto.

- `/sets/:setId/view`
  - Protegida
  - Vista y filtrado de gastos (online only).

Regla fallback:
- Cualquier ruta desconocida redirige a `/`.

## 9) Comportamientos clave de UX mobile

Layout base (`frontend/src/index.css`):
- `body` sin scroll global (`overflow: hidden`).
- Shell principal fija en alto de viewport (`h-[100dvh]`).
- Scroll solo en contenedor interno (`.scroll-pane`).

Patrones:
- Header fijo por pantalla.
- Accion principal en barra inferior (`BottomActionBar`) cuando aplica.
- Controles grandes y tactiles.
- Componentes horizontales scrolleables para seleccion rapida.

## 10) Header y notificaciones

Componente:
- `frontend/src/components/MobileHeader.jsx`

Estado de conectividad:
- Online -> chip verde con `connection-icon.svg`.
- Offline -> chip rojo con `connection-offline-icon.svg`.

Pendientes offline:
- Si `pendingCount > 0`, se muestra chip con `pending-icon.svg` + contador.

Home (`/groups`) tiene header propio con:
- Boton `Logout`.
- Boton a perfil (muestra alias de email sin dominio).
- Mismos chips de estado/conectividad y pendientes.

## 11) Flujo funcional por pantalla

### 11.1 Auth (`AuthPage.jsx`)

- Form unico para login/register con toggle.
- Si offline:
  - Login permitido (si hay sesion/cookie valida y restore posible).
  - Register deshabilitado.
- Al autenticar, redirige a `/`.

### 11.2 Home/Groups (`HomePage.jsx`)

Responsabilidades:
- Cargar grupos desde API (online) o cache (offline).
- Online: cache-first (usa cache local si existe y refresca en background).
- Modo `Crear` y `Ver`.
- Favoritos de grupo (unico).
- Arranque rapido a pantalla de tipos.

Reglas:
- Si `mode === view` y se pierde conexion -> fuerza `create`.
- Modo VER offline bloqueado.
- Al entrar por `/` con sesion:
  - Busca grupo favorito valido.
  - Si no, usa `startupGroup` valido.
  - Si no, primer grupo disponible.
  - Navega automaticamente a `/sets/:setId/types`.

### 11.3 Tipos de gasto (`ExpenseTypePage.jsx`)

- Muestra 3 botones grandes (fijo/variable/proveedor) ocupando todo el alto util.
- Carga nombre de grupo desde navigation state, cache o API.

### 11.4 Categorias/Proveedores (`CategoriesPage.jsx`)

- Carga categorias por tipo.
- Offline usa cache.
- Online: cache-first (usa cache local si existe y refresca en background).
- Soporta favoritos por categoria/proveedor.
- CTA inferior para crear categoria/proveedor (solo online).

### 11.5 Crear categoria/proveedor (`CreateCategoryPage.jsx`)

- Form simple.
- Envia `category_name` y `expense_type` al backend.
- Si guarda bien, vuelve a lista de categorias del tipo.

### 11.6 Crear grupo (`CreateSetPage.jsx`)

- Form simple con `set_name`.
- Offline bloqueado.
- Al crear, vuelve a `/groups` con mensaje flash.

### 11.7 Crear gasto (`CreateExpensePage.jsx`)

Campos:
- `amount` (entero positivo obligatorio)
- `expense_date`
- `payment_method` (botones single-choice)
- `user_id` creador (selector horizontal: `Yo` + miembros)
- `description` opcional

Carga de usuarios del grupo:
- Online: cache-first (usa cache local si existe y refresca en background) + API `/sets/:setId/users`.
- Offline: cache.

Submit:
- Online -> `POST /sets/:setId/expenses`.
- Offline -> encola en `offlineExpenseQueue` y vuelve con mensaje.

### 11.8 Ver gastos (`ViewExpensesPage.jsx`)

- Disponible solo online.
- Panel de filtros colapsable (cerrado por defecto).
- Filtros actuales:
  - Tipo (botones horizontales)
  - Forma de pago (botones horizontales)
  - Usuario creador (botones horizontales)
  - Categoria (select dependiente del tipo)
  - Rango de fechas (`from_date`, `to_date`)

Reglas de categorias:
- Si tipo = Todos: muestra todas agrupadas por tipo (`optgroup`).
- Si tipo especifico: muestra solo categorias de ese tipo.

Resultado:
- Boton `Aplicar filtros` recarga gastos.
- Si hay resultados, muestra `Total filtrado` sumando `amount` de la lista actual.

### 11.9 Perfil (`ProfilePage.jsx`)

Bloques:
- Datos de usuario.
- Estado online/offline.
- Invitaciones (solo si online).

Seccion Crear invitacion:
- Colapsable.
- Grupo (selector horizontal).
- Email destino con input integrado + boton pegar.
- Boton crear invitacion.
- Token generado en input integrado + boton copiar.

Seccion Aceptar invitacion:
- Colapsable.
- Token con input integrado + boton pegar.
- Boton aceptar invitacion.

Acciones de clipboard:
- Usa `navigator.clipboard` para copiar/pegar.

## 12) Componentes reutilizables clave

- `MobileHeader.jsx`
  - Header comun con back y chips de estado.

- `BottomActionBar.jsx`
  - Barra inferior fija de accion primaria.

- `ModeToggle.jsx`
  - Toggle Crear/Ver.

- `ListCardButton.jsx`
  - Boton tarjeta para listas (grupos/categorias/tipos).
  - Soporte favorito con iconos SVG:
    - `star-empty-icon.svg`
    - `star-full-icon.svg`

- `SingleChoiceButtons.jsx`
  - Grupo de botones single-select en grilla.

- `HorizontalScrollableChoice.jsx`
  - Seleccion single-select horizontal con scroll.

- `InlineActionInput.jsx`
  - Input con accion integrada a la derecha (copiar/pegar).

## 13) Catalogos y mapeos

Archivo:
- `frontend/src/constants/catalogs.js`

### Tipos de gasto
- 1 -> `fijo`
- 2 -> `variable`
- 3 -> `proveedor`

### Formas de pago
- 1 -> Efectivo
- 2 -> Tarjeta credito
- 3 -> Tarjeta debito

Helpers:
- `getExpenseTypeByKey`
- `getExpenseTypeById`
- `getPaymentMethodById`

## 14) Offline-first: reglas concretas

1. Conexion detectada por `navigator.onLine` + eventos `online/offline`.
2. Si se crea gasto sin conexion:
   - se guarda en cola local.
   - se incrementa `pendingCount`.
3. Cuando vuelve conexion y hay sesion:
   - sync recorre cola y envia cada gasto.
   - 4xx se descarta.
   - otros errores quedan pendientes.
4. El usuario ve pendientes en header de todas las pantallas.

Limitacion conocida:
- No hay modo offline para alta de grupos/categorias/invitaciones ni para vista de gastos.

## 15) Decisiones de producto implementadas

- Inicio rapido: al abrir app logueada, se entra directo a seleccion de tipo de gasto del grupo favorito/startup.
- Grupo favorito unico para priorizar velocidad de uso.
- Alias de usuario sin dominio en acceso a perfil.
- Notificaciones compactas en header en lugar de banners largos.

## 16) Estructura de carpetas relevante

```text
frontend/
  src/
    assets/icons/
    components/
    constants/
    context/
    hooks/
    lib/
    pages/
    App.jsx
    main.jsx
    index.css
  vite.config.js
  tailwind.config.js
  postcss.config.js
  package.json
```

## 17) Guia rapida para futuros cambios

### Agregar nueva pantalla mobile
1. Crear page en `src/pages`.
2. Registrar ruta en `src/App.jsx` bajo `RequireAuth` o `GuestOnly`.
3. Usar `MobileHeader` y layout `app-shell` + `scroll-pane`.
4. Si necesita CTA principal, usar `BottomActionBar`.

### Agregar nuevo filtro en modo VER
1. Extender estado `filters` en `ViewExpensesPage.jsx`.
2. Mapear control UI (preferir `SingleChoiceButtons` o `HorizontalScrollableChoice`).
3. Incluir parametro en `query`.
4. Validar consistencia de dependencias (ejemplo: categoria depende de tipo).

### Extender soporte offline
1. Definir si la entidad necesita cache local.
2. Agregar funciones en `localCache.js` o cola dedicada.
3. Integrar indicador visual en header si aplica.
4. Definir politica de reintentos/descartes.

## 18) Riesgos tecnicos y puntos a vigilar

- Dependencia de `navigator.onLine`: puede no reflejar conectividad real con backend en todos los casos.
- Cola offline en localStorage:
  - limitada por capacidad del browser.
  - sin versionado de schema por item (solo por key global).
- Sin tests automaticos de UI/flujo aun.
- Algunos textos/mensajes estan hardcodeados en componentes (todavia sin capa i18n).

## 19) Resumen ejecutivo

El frontend mobile actual ya cubre el flujo operativo principal para captura rapida de gastos con soporte offline en la creacion de gastos, sincronizacion automatica, favoritos, arranque rapido al grupo objetivo y gestion de invitaciones desde perfil.

La base esta lista para usar en produccion controlada mobile y para avanzar en paralelo con la capa desktop.

## 20) Mini guia de colores (mapeo rapido)

Punto unico de edicion:
- `frontend/src/index.css` (`:root`, bloque de variables)

Tailwind consume estas variables desde:
- `frontend/tailwind.config.js`

### 20.1 Paleta base (cruda)

Estas 4 variables representan tu paleta original:
- `--palette-black` -> `#000000`
- `--palette-indigo` -> `#262A56`
- `--palette-copper` -> `#B8621B`
- `--palette-sand` -> `#E3CCAE`

Normalmente no hace falta tocar clases en JSX: con cambiar estas variables y los tokens semanticos, cambia toda la UI.

### 20.2 Tokens semanticos por grupo visual

Superficies y fondo:
- `--app-bg`: fondo principal del shell (`app-shell`)
- `--app-panel`: tarjetas, headers translúcidos, inputs, contenedores

Acentos de accion:
- `--app-accent-main`: CTA principal / tono fuerte
- `--app-accent-soft`: seleccion activa suave
- `--app-accent-alt`: variante secundaria de accion
- `--app-accent-warning`: resaltados tipo aviso/pending

Tipografia:
- `--app-text-primary`: texto principal
- `--app-text-muted`: texto secundario/labels

Feedback (mensajes):
- `--app-success-bg`, `--app-success-border`, `--app-success-text`
- `--app-error-bg`, `--app-error-border`, `--app-error-text`

Estado de conexion (chips de header):
- `--app-status-online-bg`, `--app-status-online-border`, `--app-status-online-text`
- `--app-status-offline-bg`, `--app-status-offline-border`, `--app-status-offline-text`
- `--app-status-pending-bg`, `--app-status-pending-border`

### 20.3 Que tocar segun lo que quieras cambiar

\"Quiero cambiar todo el look general\":
1. `--app-bg`
2. `--app-panel`
3. `--app-text-primary`
4. `--app-text-muted`

\"Quiero cambiar botones y seleccionados\":
1. `--app-accent-main`
2. `--app-accent-soft`
3. `--app-accent-alt`
4. `--app-accent-warning`

\"Quiero cambiar solo estados (online/offline/errores)\":
1. `--app-status-*`
2. `--app-success-*`
3. `--app-error-*`

### 20.4 Regla practica para mantener consistencia

- No hardcodear colores en JSX (`bg-red-*`, `text-emerald-*`, `bg-white`, etc.).
- Si hace falta un color nuevo, crear primero variable en `:root`.
- Exponerlo en `tailwind.config.js` bajo `colors.app.*`.
- Recien ahi usar la clase Tailwind en componentes.
