# Frontend Desktop - Dashboard (v4)

Fecha de actualizacion: 2026-03-05

## 1) Objetivo

El modo desktop implementa operacion completa diaria del sistema, sin romper el flujo mobile:
- gestion de grupos
- gestion de gastos
- gestion de ingresos
- gestion de categorias/proveedores
- gestion de usuarios de grupo (admin)
- modulo de analiticas financieras con graficos
- cache local + soporte offline para datos y cola de sincronizacion de acciones

## 2) Activacion responsive

- En viewport `>= 1024px` (`lg`), `/` y `/groups` renderizan dashboard desktop.
- En viewport menor se mantiene el flujo mobile.
- Ruta explicita desktop: `/dashboard`.

Archivos clave:
- `frontend/src/App.jsx`
- `frontend/src/hooks/useDesktopViewport.js`
- `frontend/src/pages/DesktopDashboardPage.jsx`

## 3) Layout general

Estructura:
- `aside` izquierdo con grupos.
- header superior con estado online/offline, usuario y logout.
- panel principal con tarjetas KPI + tabs de operacion.

Tabs operativas:
- `Gastos`
- `Ingresos`
- `Categorias`
- `Usuarios`
- `Analiticas`

## 4) KPIs superiores

Las tarjetas resumen muestran:
- `Total filtrado (gastos)`
- `Total filtrado (ingresos)` (acotado al rango de fechas activo en filtros de gastos)
- `Saldo` (diferencia ingresos-gastos) + porcentaje en la misma linea
- `Cant. gastos`
- `Cant. ingresos`
- `Filtros` (cantidad de filtros activos)

## 5) Sidebar de grupos

### 5.1 Seleccion y acciones
- input `Nuevo grupo` + boton `Crear`.
- click en grupo: lo selecciona como grupo activo.
- acciones por item (`favorito`, `editar`, `eliminar`) visibles solo con hover.

### 5.2 Favorito de grupo
- favorito unico por usuario.
- el grupo favorito:
  - sube al tope
  - usa fondo destacado
  - se usa como grupo de arranque al reingresar/recargar
- label `GRUPO ACTIVO` se pinta en amarillo cuando el grupo activo es el favorito.

### 5.3 Edicion/eliminacion de grupo
- flujo por pasos en modal:
  - editar: nombre nuevo -> confirmacion escribiendo `EDITAR`
  - eliminar: confirmar `SI/NO` -> confirmacion escribiendo `ELIMINAR`

## 6) Tab Gastos

### 6.1 Tabla + viewport fijo
- `thead` fijo y `tbody` con scroll interno.
- area de tabla con altura estable en viewport.
- paginacion clasica (`<< < 1 2 3 ... > >>`).
- cantidad por pagina adaptativa segun alto disponible (no fija hardcodeada).

### 6.2 Ordenamiento por columnas
Click en `th` alterna orden:
- Categoria: `A-Z` / `Z-A`
- Monto: mayor-menor / menor-mayor
- Tipo: orden custom (`FIJO`, `VARIABLE`, `PROVEEDOR`)
- Pago: orden custom (`EFECTIVO`, `DEBITO`, `CREDITO`)
- Usuario: alfabetico
- Fecha: antiguos-recientes / inverso

### 6.3 Descripcion expandible
- click en fila abre/cierra descripcion debajo de esa fila.
- se pueden abrir varias descripciones en paralelo.
- boton `Cerrar descripciones` solo visible en tab `Gastos`.

### 6.4 Filtros (modal)
- boton `FILTROS` solo visible en tab `Gastos`.
- modal con:
  - tipo de gasto (multi)
  - forma de pago (multi)
  - usuarios (multi)
  - categoria/proveedor (multi, por panel de tipo)
  - rango `desde/hasta`
- acciones: `Limpiar`, `Cancelar`, `Aplicar filtros`.

### 6.5 Alta/edicion de gasto (modal)
- boton flotante `+ CREAR GASTO`.
- layout en 2 columnas:
  - izquierda: tipo, forma de pago, usuario creador
  - derecha: categoria/proveedor
  - abajo: monto, fecha, descripcion
- acciones de fila: editar/eliminar con iconos, sin borde ni fondo.

## 7) Tab Ingresos

- tabla de ingresos con columnas:
  - tipo
  - monto
  - fecha
  - acciones
- `ADMIN` puede:
  - crear ingreso
  - editar ingreso
  - eliminar ingreso
- `PARTICIPANT` solo visualiza.
- tipos soportados: `EFECTIVO (1)` y `DEBITO (3)`.

## 8) Tab Categorias y Usuarios

### 8.1 Categorias/proveedores
- listado con ordenamiento por `Nombre` y `Tipo`.
- boton `CREAR` abre modal (nombre + tipo).
- acciones editar/eliminar por fila.

### 8.2 Usuarios del grupo
- remocion de participante (solo admin).
- opcion para eliminar tambien sus gastos historicos del grupo.

## 9) Tab Analiticas

Endpoint fuente:
- `GET /sets/:id_set/incomes/analytics`

### 9.1 Filtros de analitica
- panel expandible/colapsable (`Mostrar filtros` / `Ocultar filtros`).
- filtros:
  - `Desde`
  - `Hasta`
  - `Tipo ingreso`
  - `Top categorias`
  - `Orden ranking`
- acciones:
  - `Aplicar`
  - `Limpiar`
- quick ranges:
  - ultima semana
  - ultimo mes
  - ultimos 3 meses
  - ultimo semestre
  - ultimo anio

### 9.2 Visualizaciones
- KPIs de analitica:
  - ingresos
  - gastos
  - saldo
  - margen operativo
  - crecimiento gasto 3m/6m/12m
  - tendencia margen 3m
- graficos de series:
  - evolucion mensual ingreso vs gasto vs saldo
  - ratio de ejecucion mensual
  - crecimiento mensual (%)
  - margen operativo mensual
  - evolucion mensual por tipo (stacked)
  - estructura por tipo
  - ranking de categorias (actual vs periodo anterior)

## 10) Perfil de color compartido

El desktop puede editar perfil de color (persistido por usuario):
- tipos de gasto
- formas de pago
- series de analitica (`gasto`, `ingreso`, `saldo`)

Persistencia:
- backend: `user_color_profiles` + endpoints:
  - `GET /auth/color-profile`
  - `PUT /auth/color-profile`
- frontend cache local por usuario:
  - `expenses_mobile_ui_color_settings_v1`

Aplicacion:
- los colores se aplican en:
  - botones de seleccion
  - badges de tablas
  - series de graficos
- mobile consume el mismo perfil (lectura), pero la edicion se realiza en desktop.

## 11) Cache local y offline

Cache principal por usuario:
- grupos
- categorias
- usuarios por grupo
- gastos
- ingresos
- perfil de color UI

Cola offline unificada:
- `expenses_mobile_offline_actions_v1`
- sincronizacion automatica al volver online
- manejo de descarte en errores de validacion (4xx)

## 12) Notas de mantenimiento

- Si se agregan nuevos tipos o metodos de pago, actualizar:
  - backend (constantes + validaciones)
  - `catalogs.js`
  - `uiColorSettings.js`
  - docs funcionales/reglas
- Si se cambia contrato de analitica, actualizar:
  - tab `Analiticas` desktop
  - `docs/Documento_Funcional_v2.md`
  - `docs/Reglas_de_Negocio_v2.md`
