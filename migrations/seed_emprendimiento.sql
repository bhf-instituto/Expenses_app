-- ============================================
-- Seed demo: Emprendimiento
-- - Usa un usuario existente por email
-- - Crea 1 grupo
-- - Crea 9 categorias (3 por tipo)
-- - Crea 90 gastos (10 por categoria)
-- - Crea 12 ingresos
--
-- Nota:
-- "Proveedores" en este proyecto NO es tabla aparte.
-- Se representa como categories.expense_type = 3.
-- ============================================

START TRANSACTION;

-- --------------------------------------------
-- 0) Parametros editables
-- --------------------------------------------
SET @seed_set_name := 'Emprendimiento';
SET @seed_user_email := 'mirko_0@gmail.com';
SET @replace_existing := 1; -- 1 = borra y regenera este grupo para el usuario, 0 = solo inserta

SET @user_id := NULL;
SET @set_id := NULL;

SELECT id INTO @user_id
FROM users
WHERE email = @seed_user_email
LIMIT 1;

SELECT
    @seed_user_email AS seed_user_email,
    @user_id AS detected_user_id;

-- Si @user_id es NULL, el INSERT en set_users fallara.
-- En ese caso, cambia @seed_user_email por un usuario real de tu tabla users.

-- --------------------------------------------
-- 1) Limpieza idempotente del grupo destino
-- --------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_seed_sets;
CREATE TEMPORARY TABLE tmp_seed_sets AS
SELECT s.id
FROM sets s
JOIN set_users su
    ON su.set_id = s.id
WHERE s.name = @seed_set_name
  AND su.user_id = @user_id;

DELETE FROM deleted_expenses
WHERE @replace_existing = 1
  AND set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM expenses
WHERE @replace_existing = 1
  AND set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM incomes
WHERE @replace_existing = 1
  AND set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM set_users
WHERE @replace_existing = 1
  AND set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM categories
WHERE @replace_existing = 1
  AND set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM sets
WHERE @replace_existing = 1
  AND id IN (SELECT id FROM tmp_seed_sets);

DROP TEMPORARY TABLE IF EXISTS tmp_seed_sets;

-- --------------------------------------------
-- 2) Grupo + membership admin
-- --------------------------------------------
INSERT INTO sets (name)
VALUES (@seed_set_name);

SET @set_id := LAST_INSERT_ID();

INSERT INTO set_users (set_id, user_id, role)
VALUES (@set_id, @user_id, 1);

-- --------------------------------------------
-- 3) Modelo de categorias
-- expense_type: 1=fijo, 2=variable, 3=proveedores
-- --------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_category_model;
CREATE TEMPORARY TABLE tmp_category_model (
    sort_order TINYINT UNSIGNED NOT NULL,
    category_name VARCHAR(80) NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    base_amount INT UNSIGNED NOT NULL,
    description_prefix VARCHAR(120) NOT NULL
);

INSERT INTO tmp_category_model
(sort_order, category_name, expense_type, base_amount, description_prefix)
VALUES
    (1, 'Alquiler de taller',       1, 185000, 'Pago fijo de alquiler'),
    (2, 'Sueldos y honorarios',     1, 245000, 'Pago fijo de sueldos y honorarios'),
    (3, 'Servicios y suscripciones',1,  78000, 'Pago fijo de servicios'),

    (4, 'Logistica y envios',       2,  42000, 'Gasto variable de logistica'),
    (5, 'Publicidad operativa',     2,  56000, 'Gasto variable de publicidad'),
    (6, 'Mantenimiento menor',      2,  35000, 'Gasto variable de mantenimiento'),

    (7, 'Proveedor de insumos',     3,  98000, 'Pago a proveedor de insumos'),
    (8, 'Proveedor de packaging',   3,  64000, 'Pago a proveedor de packaging'),
    (9, 'Proveedor de servicios',   3, 112000, 'Pago a proveedor de servicios');

INSERT INTO categories (set_id, name, expense_type)
SELECT
    @set_id,
    category_name,
    expense_type
FROM tmp_category_model
ORDER BY sort_order;

-- --------------------------------------------
-- 4) Gastos: 10 por categoria (90 total)
-- payment_method: 1=efectivo, 2=credito, 3=debito
-- --------------------------------------------
INSERT INTO expenses
(set_id, user_id, category_id, expense_type, payment_method, amount, description, expense_date)
WITH RECURSIVE seq AS (
    SELECT 0 AS n
    UNION ALL
    SELECT n + 1
    FROM seq
    WHERE n < 9
)
SELECT
    @set_id AS set_id,
    @user_id AS user_id,
    c.id AS category_id,
    m.expense_type AS expense_type,
    CASE MOD(seq.n + m.sort_order, 3)
        WHEN 0 THEN 1
        WHEN 1 THEN 2
        ELSE 3
    END AS payment_method,
    CASE
        WHEN m.expense_type = 1 THEN
            m.base_amount + (seq.n * 7000) + (m.sort_order * 1500)
        WHEN m.expense_type = 2 THEN
            m.base_amount + (seq.n * 5500) + (MOD(seq.n + m.sort_order, 4) * 2500)
        ELSE
            m.base_amount + (seq.n * 9000) + (m.sort_order * 2000)
    END AS amount,
    CONCAT(m.description_prefix, ' #', LPAD(seq.n + 1, 2, '0')) AS description,
    DATE_SUB(
        CURDATE(),
        INTERVAL (
            CASE
                WHEN m.expense_type = 1 THEN (seq.n * 7) + MOD(m.sort_order, 3)
                WHEN m.expense_type = 2 THEN (seq.n * 5) + MOD(m.sort_order, 4)
                ELSE (seq.n * 6) + MOD(m.sort_order, 5)
            END
        ) DAY
    ) AS expense_date
FROM tmp_category_model m
JOIN categories c
    ON c.set_id = @set_id
   AND c.name = m.category_name
   AND c.expense_type = m.expense_type
CROSS JOIN seq
ORDER BY m.sort_order, seq.n;

-- --------------------------------------------
-- 5) Ingresos: 12 registros
-- income_type: 1=efectivo, 3=debito
-- --------------------------------------------
INSERT INTO incomes (set_id, income_type, amount, income_date)
WITH RECURSIVE seq_income AS (
    SELECT 0 AS n
    UNION ALL
    SELECT n + 1
    FROM seq_income
    WHERE n < 11
)
SELECT
    @set_id AS set_id,
    CASE
        WHEN MOD(seq_income.n, 2) = 0 THEN 1
        ELSE 3
    END AS income_type,
    165000 + (seq_income.n * 18500) + (MOD(seq_income.n, 3) * 7500) AS amount,
    DATE_SUB(
        CURDATE(),
        INTERVAL ((seq_income.n * 4) + MOD(seq_income.n, 3)) DAY
    ) AS income_date
FROM seq_income
ORDER BY seq_income.n;

COMMIT;

-- --------------------------------------------
-- 6) Verificaciones
-- --------------------------------------------
SELECT
    @user_id AS seeded_user_id,
    @set_id AS seeded_set_id,
    @seed_user_email AS seeded_user_email,
    @seed_set_name AS seeded_group;

SELECT
    expense_type,
    COUNT(*) AS categories_count
FROM categories
WHERE set_id = @set_id
GROUP BY expense_type
ORDER BY expense_type;

SELECT COUNT(*) AS expenses_count
FROM expenses
WHERE set_id = @set_id;

SELECT COUNT(*) AS incomes_count
FROM incomes
WHERE set_id = @set_id;

SELECT
    c.expense_type,
    c.name AS category_name,
    COUNT(e.id) AS expense_rows,
    COALESCE(SUM(e.amount), 0) AS total_amount
FROM categories c
LEFT JOIN expenses e
    ON e.category_id = c.id
WHERE c.set_id = @set_id
GROUP BY c.id, c.expense_type, c.name
ORDER BY c.expense_type, c.name;
