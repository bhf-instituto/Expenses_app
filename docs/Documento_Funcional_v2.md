# Documento Funcional v2 - Aplicacion de Registro de Gastos

Fecha de actualizacion: 2026-03-05

## 1. Proposito

La aplicacion permite registrar gastos estructurados para analisis posterior.
No es una aplicacion contable/fiscal: los registros representan eventos declarados por los usuarios.

Prioridades del sistema:
- Consistencia de datos
- Trazabilidad
- Control de acceso por grupo

## 2. Alcance funcional

La unidad principal de trabajo es el grupo (`set`).
Cada gasto pertenece a:
- Un unico grupo
- Un unico usuario
- Una unica categoria
- Un unico tipo de gasto (derivado de la categoria)

## 3. Usuarios y sesion

- Los usuarios se registran con email y password.
- La autenticacion usa cookies (`access_token` + `refresh_token`).
- Los tokens se envian por cookie `HttpOnly`; no se devuelven en el body de `login/register`.
- Un usuario puede existir sin grupos.
- Un usuario puede crear grupos y participar en grupos de terceros.

## 4. Grupos (Sets)

El grupo es el contexto de segregacion funcional y de datos:
- No se comparten gastos entre grupos.
- No se comparten categorias entre grupos.

Operaciones:
- Crear grupo
- Ver grupos del usuario
- Ver un grupo puntual
- Editar nombre
- Eliminar grupo
- Quitar usuarios del grupo (solo admin), con opcion de eliminar tambien sus gastos del grupo

## 5. Roles dentro del grupo

Roles vigentes:
- `ADMIN` (1)
- `PARTICIPANT` (2)

Permisos:
- `ADMIN`:
  - Crear/editar/eliminar categorias
  - Editar/eliminar grupo
  - Quitar participantes del grupo (no admin)
  - Elegir si al quitar participante se eliminan tambien sus gastos
  - Crear invitaciones
  - Eliminar gastos de cualquier usuario del grupo
  - Crear/editar/eliminar ingresos del grupo
- `PARTICIPANT`:
  - Crear gastos
  - Ver gastos/categorias/totales
  - Ver ingresos y analiticas de ingresos
  - Editar y eliminar solo sus propios gastos

## 6. Tipos de gasto (catalogo cerrado)

Tipos definidos por el sistema:
- `1 = FIJO`
- `2 = VARIABLE`
- `3 = PROVEEDORES`

El usuario no puede crear nuevos tipos fuera de ese catalogo.

## 7. Categorias

Las categorias clasifican gastos y pertenecen a un grupo.

Atributos principales:
- `set_id`
- `name`
- `expense_type`

Reglas:
- La categoria pertenece a un unico grupo.
- La categoria pertenece a un unico tipo de gasto.
- El nombre debe ser unico dentro de `(grupo + tipo)`.
- Para modelar proveedores, se crean categorias con `expense_type = 3`.

## 8. Gastos (entidad central)

Atributos funcionales:
- `set_id` (grupo)
- `user_id` (autor, seleccionable entre usuarios que pertenezcan al grupo)
- `category_id`
- `expense_type` (se toma de la categoria)
- `payment_method` (forma de pago del gasto)
- `amount` (entero positivo)
- `description` (opcional)
- `expense_date` (obligatoria; si no se envia, el sistema usa fecha actual)

Formas de pago permitidas:
- `1 = EFECTIVO`
- `2 = TARJETA_CREDITO`
- `3 = TARJETA_DEBITO`

Operaciones:
- Crear gasto
- Listar gastos (con filtros)
- Editar gasto (monto, descripcion, fecha)
- Eliminar gasto (hard delete)
- Consultar totales

## 8.1 Ingresos (entidad de analitica)

Atributos funcionales:
- `set_id` (grupo)
- `income_type` (catalogo cerrado)
- `amount` (entero positivo)
- `income_date` (obligatoria)

Tipos permitidos:
- `1 = EFECTIVO`
- `3 = TARJETA_DEBITO`

Reglas de acceso:
- Solo `ADMIN` puede crear, editar y eliminar ingresos.
- `ADMIN` y `PARTICIPANT` pueden listar ingresos y consultar analitica.

Operaciones:
- Crear ingreso
- Listar ingresos (con filtros y paginacion)
- Editar ingreso
- Eliminar ingreso
- Consultar analitica `ingresos vs gastos` por rango

## 8.2 Perfil de color por usuario

El sistema permite persistir un perfil de colores por usuario autenticado.

Alcance:
- colores de tipos de gasto (`FIJO`, `VARIABLE`, `PROVEEDOR`)
- colores de formas de pago (`EFECTIVO`, `TARJETA_CREDITO`, `TARJETA_DEBITO`)
- colores de series de analitica (`gasto`, `ingreso`, `saldo`)

Caracteristicas:
- se guarda por usuario, no por grupo
- se cachea localmente para mejorar carga
- desktop puede editarlo
- mobile lo consume para renderizar UI consistente

## 9. Totales y analitica

El sistema expone:
- Totales por categoria
- Totales por tipo de gasto
- Totales por "proveedor".
- Total acumulado filtrado
- Analitica de ingresos vs gastos:
  - resumen (`summary`): ingresos, gastos, saldo, margen y crecimientos
  - tendencia mensual (`monthly_trend`) con crecimiento y ejecucion
  - estructura (`structure`) por tipo de gasto
  - evolucion mensual por tipo (`type_trend`)
  - ranking dinamico de categorias (`category_ranking`)

Filtros disponibles (segun endpoint):
- categoria
- tipo
- forma de pago
- usuario
- rango de fechas

## 10. Borrado y sincronizacion incremental

El borrado de gastos es fisico (`hard delete`), pero se conserva trazabilidad en `deleted_expenses`:
- `expense_id`
- `set_id`
- `deleted_at`

Esto permite sincronizacion incremental de eliminaciones (offline-lite).

## 11. Flujos funcionales principales

### 11.1 Configuracion inicial
1. Usuario crea grupo.
2. Admin crea categorias de tipo `FIJO`, `VARIABLE` y/o `PROVEEDORES`.

### 11.2 Carga de gasto
1. Usuario selecciona grupo.
2. Usuario crea gasto.
3. Selecciona categoria valida del grupo.
4. El sistema deriva automaticamente el tipo desde la categoria.
5. Usuario selecciona quien registra el gasto (`Yo` u otro participante del grupo).
6. Usuario informa monto, fecha y descripcion opcional.

### 11.3 Analisis
1. Usuario lista gastos con filtros.
2. Usuario consulta totales por categoria/tipo/proveedor (tipo 3).

### 11.4 Gestion de participantes (admin)
1. Admin abre gestion de usuarios del grupo.
2. Selecciona participante a quitar.
3. El sistema pregunta si tambien debe eliminarse el historial de gastos de ese usuario dentro del grupo.
4. Si se confirma:
   - El usuario deja de pertenecer al grupo y pierde acceso.
   - Opcionalmente se eliminan sus gastos del grupo.

## 12. Endpoints funcionales

Modulos vigentes:
- `auth`
- `health`
- `invite`
- `sets`
- `categories`
- `expenses`
- `incomes` (recurso bajo `/sets/:id_set/incomes`)

### 12.2 Usuarios de grupo
- Listar participantes de un grupo: `GET /sets/:id_set/users`
- Quitar participante de un grupo: `DELETE /sets/:id_set/users/:id_user`
  - Body: `{ "delete_expenses": true|false }`

### 12.3 Ingresos
- Crear ingreso (solo admin): `POST /sets/:id_set/incomes`
  - Body: `{ "income_type": 1|3, "amount": 1000, "income_date": "YYYY-MM-DD" }`
- Listar ingresos: `GET /sets/:id_set/incomes`
  - Query opcional: `income_type`, `from_date`, `to_date`, `updated_after`, `page`, `limit`
- Editar ingreso (solo admin): `PUT /sets/:id_set/incomes/:id_income`
  - Body (parcial): `{ "income_type"?: 1|3, "amount"?: 1000, "income_date"?: "YYYY-MM-DD" }`
- Eliminar ingreso (solo admin): `DELETE /sets/:id_set/incomes/:id_income`
- Analitica ingresos vs gastos: `GET /sets/:id_set/incomes/analytics`
  - Query: `from_date`, `to_date`
  - Query opcional: `income_type`, `category_limit`, `category_sort`

### 12.4 Perfil de color de usuario
- Obtener perfil: `GET /auth/color-profile`
- Guardar/actualizar perfil: `PUT /auth/color-profile`
  - Body: `{ "settings": { ... } }`

### 12.1 Invitaciones (metodos vigentes)
- Crear invitacion: `POST /invite/:id_set`
  - Body: `{ "email": "usuario@dominio.com" }`
- Aceptar invitacion: `POST /invite`
  - Body: `{ "invite_token": "..." }`

## 13. Contrato HTTP base

Formato de respuesta:
- Exito: `{ "ok": true, "data": { ... } }`
- Error: `{ "ok": false, "data": { "message": "..." } }`

Codigos esperados:
- `200`: consultas y operaciones exitosas sin creacion
- `201`: creacion exitosa de recursos
- `400`: validacion de entrada
- `401`: sesion requerida
- `403`: acceso denegado por permisos/pertenencia
- `404`: recurso inexistente
- `409`: conflicto de unicidad/estado
- `500`: error interno

