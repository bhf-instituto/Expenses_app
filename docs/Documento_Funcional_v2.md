# Documento Funcional v2 - Aplicacion de Registro de Gastos

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

## 5. Roles dentro del grupo

Roles vigentes:
- `ADMIN` (1)
- `PARTICIPANT` (2)

Permisos:
- `ADMIN`:
  - Crear/editar/eliminar categorias
  - Editar/eliminar grupo
  - Crear invitaciones
  - Eliminar gastos de cualquier usuario del grupo
- `PARTICIPANT`:
  - Crear gastos
  - Ver gastos/categorias/totales
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
- `user_id` (autor)
- `category_id`
- `expense_type` (se toma de la categoria)
- `amount` (entero positivo)
- `description` (opcional)
- `expense_date` (obligatoria; si no se envia, el sistema usa fecha actual)

Operaciones:
- Crear gasto
- Listar gastos (con filtros)
- Editar gasto (monto, descripcion, fecha)
- Eliminar gasto (hard delete)
- Consultar totales

## 9. Totales y analitica

El sistema expone:
- Totales por categoria
- Totales por tipo de gasto
- Totales por "proveedor".
- Total acumulado filtrado

Filtros disponibles (segun endpoint):
- categoria
- tipo
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
5. Usuario informa monto, fecha y descripcion opcional.

### 11.3 Analisis
1. Usuario lista gastos con filtros.
2. Usuario consulta totales por categoria/tipo/proveedor (tipo 3).

## 12. Endpoints funcionales

Modulos vigentes:
- `auth`
- `health`
- `invite`
- `sets`
- `categories`
- `expenses`


