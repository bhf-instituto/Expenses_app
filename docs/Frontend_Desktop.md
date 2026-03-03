# Frontend Desktop - Dashboard (v3)

Fecha de actualizacion: 2026-03-03

## 1) Objetivo

El modo desktop implementa un dashboard operativo completo sin romper el flujo mobile:
- Gestion de grupos
- Gestion de gastos
- Gestion de categorias/proveedores
- Gestion de usuarios de grupo (admin)
- Soporte offline con cola de acciones + cache local

## 2) Activacion responsive

- En viewport `>= 1024px` (`lg`), las rutas principales (`/`, `/groups`) renderizan dashboard desktop.
- En viewport menor, se mantiene el flujo mobile.
- Ruta explicita desktop disponible: `/dashboard`.

Archivos:
- `frontend/src/App.jsx`
- `frontend/src/hooks/useDesktopViewport.js`
- `frontend/src/pages/DesktopDashboardPage.jsx`

## 3) Layout general desktop

Estructura:
- `aside` izquierdo con grupos.
- Header superior con:
  - estado online/offline
  - pendientes
  - acceso a perfil
  - logout
- Panel principal con:
  - KPIs (`Total filtrado`, `Gastos`, `Categorias`, `Usuarios`)
  - tabs de operacion: `Gastos`, `Categorias`, `Usuarios`

Contenedor principal de tablas:
- altura fija en viewport (`h-[calc(100dvh-13rem)]`)
- no cambia de alto al cambiar entre tabs
- el contenido interno es el que scrollea

## 4) Sidebar de grupos

### 4.1 Alta y seleccion
- Input `Nuevo grupo` + boton `Crear`.
- Click en un grupo lo selecciona como grupo activo.

### 4.2 Favoritos (solo grupos)
- Favorito unico por usuario/sesion (no multiple).
- Persistencia en `favoritesStorage`.
- El grupo favorito:
  - sube al tope de la lista
  - usa fondo `bg-indigo-900`
- El favorito se selecciona automaticamente al entrar/reingresar/recargar si existe.

### 4.3 Acciones por hover en grupo
Los botones de accion no se ven por defecto:
- aparecen solo con hover sobre el item de grupo
- desaparecen al salir el mouse del item

Acciones visibles en hover:
- Favorito (estrella vacia/llena)
- Eliminar grupo (si rol admin)
- Editar grupo (si rol admin)

Iconos usados:
- `star-empty-icon.svg`
- `star-full-icon.svg`
- `close-line-icon.svg`
- `pencil-icon.svg`

### 4.4 Transicion al reordenar favoritos
- Se usa animacion FLIP para suavizar el desplazamiento de grupos cuando cambia el favorito.
- Se corrigio jitter/oscilacion para que solo anime cuando cambia realmente el orden.

Archivo:
- `frontend/src/hooks/useFlipListAnimation.js`

## 5) Header del panel principal

- Label `GRUPO ACTIVO`:
  - color normal: `text-app-muted`
  - color amarillo cuando el grupo activo es favorito
- Info de estado:
  - online/offline con icono
  - contador de pendientes

## 6) Tab Gastos

### 6.1 Tabla de gastos
- Header (`thead`) fijo.
- Body (`tbody`) scrolleable.
- Columna `Descripcion` removida de la tabla principal.

### 6.2 Descripcion expandible por fila
- Click en fila de gasto abre/cierra descripcion debajo de esa fila.
- Se pueden abrir multiples descripciones a la vez.
- Boton `Cerrar descripciones` para cerrar todas.
- `Cerrar descripciones` solo se muestra en tab `Gastos`.
- Apertura/cierre con transicion suave (`max-height` + `opacity`).

### 6.3 Ordenamiento por click en `th`
Cada click alterna direccion del orden:

- `Categoria`: alfabetico `A-Z` / `Z-A`
- `Monto`: `mayor->menor` / `menor->mayor`
- `Tipo`: orden personalizado
  - asc: `Fijo -> Variable -> Proveedor`
  - desc: `Proveedor -> Variable -> Fijo`
- `Pago`: orden personalizado
  - asc: `Efectivo -> Debito -> Credito`
  - desc: `Credito -> Debito -> Efectivo`
- `Usuario`: alfabetico por alias de email
- `Fecha`: `mas antiguos->mas recientes` / inverso

Indicador visual:
- flecha de orden en el header activo (`up/down`).

### 6.4 Acciones de gasto
- `Editar` y `Eliminar` con iconos (sin borde ni fondo, estilo consistente con grupos).

## 7) Filtros de gastos (modal)

Boton `FILTROS`:
- solo visible en tab `Gastos`
- estilo invertido para mayor contraste

Modal de filtros:
- `Tipo de gasto`: multiseleccion
- `Forma de pago`: multiseleccion
- `Usuarios`: multiseleccion
- `Categoria/Proveedor`: multiseleccion por panel de tipo
  - no mezcla categorias de todos los tipos en un solo bloque
  - navegacion por paneles con flechas izquierda/derecha
- `Desde` / `Hasta` por fecha
- acciones: `Limpiar`, `Cancelar`, `Aplicar filtros`

## 8) Creacion/edicion de gastos (modal)

Boton `+ Crear gasto`:
- flotante, esquina inferior derecha
- respeta grupo activo actual

Modal de gasto:
- formato horizontal (desktop)
- usa componentes de botones por filas (`WrappedChoiceGroup` / `WrappedMultiChoiceGroup`)
- bloques:
  - tipo de gasto
  - forma de pago
  - categoria/proveedor (dependiente del tipo)
  - usuario creador
  - monto
  - fecha
  - descripcion (opcional)

Edicion de gasto:
- restringe campos segun regla actual de negocio del frontend (monto, pago, fecha, descripcion).

## 9) Tab Categorias y Tab Usuarios

### 9.1 Categorias / proveedores
- Crear, editar y eliminar.
- Incluye tipo (`fijo`, `variable`, `proveedor`).

### 9.2 Usuarios del grupo
- Quitar participante (solo admin y con restricciones).
- Al quitar, se puede elegir eliminar tambien sus gastos.

## 10) Modales de confirmacion y pasos

### 10.1 Editar grupo
- Paso 1: nuevo nombre + continuar
- Paso 2: confirmacion escribiendo `EDITAR`

### 10.2 Eliminar grupo
- Paso 1: confirmacion `Si/No`
- Paso 2: confirmacion escribiendo `ELIMINAR`

## 11) Offline + cache desktop

Cola offline unificada:
- key: `expenses_mobile_offline_actions_v1`
- migracion automatica desde cola legacy de gastos

Acciones soportadas:
- `set.create`, `set.update`, `set.delete`
- `category.create`, `category.update`, `category.delete`
- `expense.create`, `expense.update`, `expense.delete`
- `set.user.remove`

Sincronizacion:
- auto al volver online
- 4xx se descartan por validacion
- 5xx/red quedan pendientes

Cache local:
- grupos, categorias, usuarios y gastos por grupo
- cargas iniciales mas rapidas y soporte offline

Archivos:
- `frontend/src/context/ExpenseSyncContext.jsx`
- `frontend/src/lib/offlineActionQueue.js`
- `frontend/src/lib/localCache.js`
- `frontend/src/lib/favoritesStorage.js`

## 12) Endpoint backend para miembros

Endpoint:
- `DELETE /sets/:id_set/users/:id_user`
  - body: `{ "delete_expenses": true|false }`

Reglas:
- solo admin del grupo
- no puede quitarse a si mismo
- no puede quitar otro admin
- opcion de eliminar gastos del usuario removido

## 13) Ajustes y correcciones aplicadas

- Se corrigio error de carga `invalid limit` usando `limit=100` en listados de gastos.
- Se unifico estilo de acciones (iconos) entre grupos y gastos.
- Se establecio tipografia de lista a `16px` (`text-base`) en tablas desktop.

## 14) Estado actual

Desktop v3 funcional para operacion completa diaria.

Pendientes sugeridos (fase siguiente):
- paginacion real en gastos (backend + frontend)
- graficos de analitica en dashboard
- tests e2e de flujos desktop (online/offline/sync)
