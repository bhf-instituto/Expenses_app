# Expenses App

Aplicación de registro y análisis de gastos colaborativos con backend en Node.js/Express y frontend React/Vite.

## Descripción

Expenses App permite a usuarios organizar gastos por grupos (`sets`), con control de acceso, categorías, tipos de gastos y analíticas de ingresos versus gastos. El sistema soporta:

- Gestión de grupos colaborativos
- Roles por grupo: `ADMIN` y `PARTICIPANT`
- Registro de gastos y provisión de categorías por grupo
- Registro de ingresos y analíticas financieras
- Perfil de colores por usuario para UI consistente Desktop/Mobile
- Soporte de sincronización offline en el frontend móvil
- Trazabilidad de eliminaciones con tombstones para sincronización incremental

## Estructura del repositorio

- `src/` - código del backend Express
- `frontend/` - frontend React + Vite (desktop/mobile)
- `docs/` - documentación funcional y de reglas de negocio
- `migrations/` - scripts SQL de esquema y semillas

## Características principales

- Autenticación con cookies `HttpOnly` (`access_token`, `refresh_token`)
- Contexto de datos aislado por grupo (`set`)
- Categorías con tipos cerrados: `FIJO`, `VARIABLE`, `PROVEEDORES`
- Gastos con pagos en: `EFECTIVO`, `TARJETA_CREDITO`, `TARJETA_DEBITO`
- Ingresos con tipos: `EFECTIVO`, `TARJETA_DEBITO`
- Analíticas: totales filtrados, tendencia mensual, estructura por tipo y ranking de categorías
- Administración de participantes y eliminación opcional de gastos asociados

## Instalación

### Backend

1. Instala dependencias

```bash
npm install
```

2. Crea el archivo de configuración de entorno a partir de `.env.example`

```bash
copy .env.example .env
```

3. Completa variables de entorno:

- `PORT`
- `CORS_ALLOWED_ORIGINS`
- `DB_HOST`
- `DB_USER`
- `DB_NAME`
- `DB_PASS`
- `DB_PORT`
- `SALT_ROUNDS`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_INVITE_SECRET`

### Frontend

1. Entra en la carpeta del frontend

```bash
cd frontend
```

2. Instala dependencias

```bash
npm install
```

3. Copia el ejemplo de entorno

```bash
copy .env.example .env
```

4. Ajusta `VITE_BACKEND_URL` o `VITE_API_BASE_URL` según tu backend

## Ejecución

### Backend en desarrollo

```bash
npm run dev
```

### Backend en producción

```bash
npm start
```

### Frontend

Dentro de `frontend/`:

```bash
npm run dev
```

## API y funcionalidades

### Módulos de backend

- `auth`
- `health`
- `invite`
- `sets`
- `categories`
- `expenses`
- `incomes`

### Endpoints relevantes

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /health/me`
- `GET /sets`
- `POST /sets`
- `GET /sets/:id_set/users`
- `DELETE /sets/:id_set/users/:id_user`
- `POST /sets/:id_set/expenses`
- `GET /sets/:id_set/expenses`
- `POST /sets/:id_set/incomes`
- `GET /sets/:id_set/incomes`
- `GET /sets/:id_set/incomes/analytics`
- `GET /auth/color-profile`
- `PUT /auth/color-profile`
- `POST /invite/:setId`
- `POST /invite`

## Reglas de negocio clave

- Un gasto pertenece a un solo grupo, usuario y categoría
- Las categorías son únicas dentro de `(grupo + tipo)`
- Los tipos de gasto son cerrados: `1=FIJO`, `2=VARIABLE`, `3=PROVEEDORES`
- `payment_method` solo admite `1=EFECTIVO`, `2=TARJETA_CREDITO`, `3=TARJETA_DEBITO`
- Los ingresos solo pueden ser creados/gestionados por `ADMIN`
- La eliminación de gastos es física, pero se guarda un tombstone para sincronización
- Un participante puede crear gastos, ver datos y consultar analíticas; solo el admin puede gestionar categorías, invitados y datos de grupo

## Frontend

### Desktop

- Dashboard completo con gestión de grupos, gastos, ingresos, categorías, usuarios y analíticas
- Vista responsive que se activa en `>= 1024px`
- Perfil de color editable para tipos de gasto, formas de pago y series de analítica
- Cache local y soporte offline con cola de sincronización

### Mobile

- Flujo rápido para autenticación, selección de grupos, alta de gastos e ingresos, y consulta de gastos
- Persistencia local por usuario y cola offline para creación de gastos
- UI móvil optimizada para PWA y iOS

## Documentación adicional

Revisa los documentos en `docs/`:

- `docs/Documento_Funcional_v2.md`
- `docs/Reglas_de_Negocio_v2.md`
- `docs/Frontend_Desktop.md`
- `docs/Frontend_Mobile.md`

## Licencia

ISC
