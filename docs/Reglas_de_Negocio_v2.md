# Reglas de Negocio v2 - Aplicacion de Gastos

## 1. Reglas de identidad y pertenencia

RN-01. Todo gasto pertenece a un unico grupo (`set_id`).

RN-02. Todo gasto pertenece a un unico usuario (`user_id`).

RN-03. Todo gasto pertenece a una unica categoria (`category_id`).

RN-04. Toda categoria pertenece a un unico grupo.

RN-05. Toda categoria pertenece a un unico tipo de gasto (`expense_type`).

## 2. Reglas de tipos de gasto

RN-06. El catalogo de tipos es cerrado: `1=FIJO`, `2=VARIABLE`, `3=PROVEEDORES`.

RN-07. No se permiten tipos fuera de ese catalogo.

RN-08. El tipo de un gasto se deriva de la categoria elegida al crear el gasto.

RN-09. "Proveedores" se modela exclusivamente como categorias de tipo `3`.

## 3. Reglas de categorias

RN-10. En un mismo grupo y tipo, el nombre de categoria debe ser unico.

RN-11. Solo administradores pueden crear, editar o eliminar categorias.

RN-12. Para editar una categoria, el nombre debe ser valido.

RN-13. Si se cambia el `expense_type` de una categoria, el sistema sincroniza el `expense_type` de los gastos ya asociados a esa categoria.

RN-14. La eliminacion de categorias sigue reglas comunes de integridad referencial (si existen gastos asociados, la base puede bloquear la eliminacion).

## 4. Reglas de gastos

RN-15. `amount` debe ser entero positivo.

RN-16. `expense_date` es obligatoria funcionalmente; si no se envia al crear, el backend asigna la fecha actual.

RN-17. `description` es opcional.

RN-18. No existe `provider_id` en gastos (v2).

RN-19. Los gastos pueden editarse solo en: monto, descripcion y fecha.

RN-20. La eliminacion de gastos es fisica (hard delete).

RN-21. Toda eliminacion de gasto deja tombstone en `deleted_expenses` para sincronizacion incremental.

RN-22. El borrado de gasto es idempotente desde API: eliminar un gasto ya eliminado devuelve respuesta exitosa de "already deleted".

## 5. Reglas de permisos

RN-23. Un usuario sin sesion no puede acceder a endpoints protegidos.

RN-24. Un usuario solo accede a grupos donde participa.

RN-25. Solo `ADMIN` puede editar/eliminar grupo.

RN-26. Solo `ADMIN` puede crear invitaciones.

RN-27. `PARTICIPANT` y `ADMIN` pueden crear y listar gastos del grupo.

RN-28. Edicion de gasto: solo el duenio del gasto.

RN-29. Eliminacion de gasto: duenio del gasto o admin del grupo.

## 6. Reglas de invitaciones

RN-30. Una invitacion valida contiene `set_id` y usuario invitado.

RN-31. Solo el usuario destinatario puede aceptar su token de invitacion.

RN-32. Un usuario ya participante no puede volver a agregarse al mismo grupo.

## 7. Reglas de reportes/totales

RN-33. Totales por categoria: agrupan por categoria en un rango de fechas.

RN-34. Totales por tipo: agrupan por `expense_type`.

RN-35. Totales por proveedor: en v2 agrupan categorias cuyo tipo es `PROVEEDORES (3)`.

RN-36. Totales filtrados respetan filtros validos de categoria, tipo, usuario y rango.

## 8. Reglas de validacion de entrada

RN-37. IDs y filtros numericos deben ser enteros validos.

RN-38. Filtros de fecha y timestamps (`updated_after`, `deleted_after`) deben tener formato parseable.

RN-39. `page` debe ser entero > 0.

RN-40. `limit` debe ser entero entre 1 y 100.

## 9. Reglas de consistencia de datos

RN-41. La informacion de cada grupo es independiente de otros grupos.

RN-42. No se permite acceso cruzado entre recursos de distintos grupos.

RN-43. El backend debe validar reglas criticas aunque el frontend tambien las valide.

