-- ============================================
-- Seed realista v2: hamburgueseria (12 meses)
-- - 1 usuario
-- - 1 grupo
-- - >=5 categorias por tipo
-- - 50 gastos por mes (600 total)
-- - 4 ingresos por mes (48 total)
-- - estacionalidad + meses con perdida
--
-- Recomendado: MySQL 8+
-- Password login del usuario seed: hambur2026
-- ============================================

START TRANSACTION;

-- --------------------------------------------
-- 0) Parametros del seed
-- --------------------------------------------
SET @seed_email := 'dueno_hamburgueseria@demo.com';
SET @seed_password_hash := '$2b$10$HU4WEtqrVyY7XGmUyZRhbuhsdz2ZyMcAcU7MvnVOEeJn71YWdMxw.';
SET @seed_set_name := 'Hamburgueseria Ruta 8';
-- Primer dia del mes de hace 11 meses (ventana movil de 12 meses hasta hoy)
SET @year_start := DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 11 MONTH), '%Y-%m-01');

-- --------------------------------------------
-- 1) Guard-rail: tabla incomes (por si no existe)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS incomes (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    set_id INT UNSIGNED NOT NULL,
    income_type TINYINT UNSIGNED NOT NULL,
    amount INT UNSIGNED NOT NULL,
    income_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_incomes_set_date (set_id, income_date),
    KEY idx_incomes_income_type (income_type),
    CONSTRAINT fk_incomes_set
        FOREIGN KEY (set_id) REFERENCES sets(id)
        ON DELETE CASCADE,
    CONSTRAINT chk_incomes_income_type
        CHECK (income_type IN (1, 3)),
    CONSTRAINT chk_incomes_amount_positive
        CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------
-- 2) Limpieza idempotente
-- --------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_seed_sets;
CREATE TEMPORARY TABLE tmp_seed_sets AS
SELECT id
FROM sets
WHERE name = @seed_set_name;

DELETE FROM deleted_expenses
WHERE set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM expenses
WHERE set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM incomes
WHERE set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM set_users
WHERE set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM categories
WHERE set_id IN (SELECT id FROM tmp_seed_sets);

DELETE FROM sets
WHERE id IN (SELECT id FROM tmp_seed_sets);

DROP TEMPORARY TABLE IF EXISTS tmp_seed_sets;

DELETE FROM refresh_tokens
WHERE user_id IN (
    SELECT id FROM users WHERE email = @seed_email
);

DELETE FROM users
WHERE email = @seed_email;

-- --------------------------------------------
-- 3) Usuario + grupo + admin membership
-- --------------------------------------------
INSERT INTO users (email, password_hash)
VALUES (@seed_email, @seed_password_hash);

SET @user_id := LAST_INSERT_ID();

INSERT INTO sets (name)
VALUES (@seed_set_name);

SET @set_id := LAST_INSERT_ID();

INSERT INTO set_users (set_id, user_id, role)
VALUES (@set_id, @user_id, 1);

-- --------------------------------------------
-- 4) Categorias
-- expense_type: 1=fijo, 2=variable, 3=proveedor
-- --------------------------------------------
INSERT INTO categories (set_id, name, expense_type) VALUES
(@set_id, 'Alquiler local', 1),
(@set_id, 'Sueldos cocina', 1),
(@set_id, 'Sueldos caja', 1),
(@set_id, 'Servicios local', 1),
(@set_id, 'Publicidad digital', 1),
(@set_id, 'Seguro comercio', 1),
(@set_id, 'Internet y sistemas', 1),
(@set_id, 'Impuestos municipales', 1),

(@set_id, 'Nafta compras', 2),
(@set_id, 'Peajes traslados', 2),
(@set_id, 'Mantenimiento auto', 2),
(@set_id, 'Seguro auto', 2),
(@set_id, 'Patente auto', 2),
(@set_id, 'Limpieza y descartables', 2),
(@set_id, 'Repuestos cocina', 2),
(@set_id, 'Emergencias operativas', 2),

(@set_id, 'Carne y medallones', 3),
(@set_id, 'Pan de hamburguesa', 3),
(@set_id, 'Papas congeladas', 3),
(@set_id, 'Nuggets y pollo', 3),
(@set_id, 'Bebidas y gaseosas', 3),
(@set_id, 'Salsas y condimentos', 3),
(@set_id, 'Packaging y envoltorios', 3),
(@set_id, 'Quesos y vegetales', 3);

-- --------------------------------------------
-- 5) Perfil mensual (estacionalidad)
-- Meses intencionalmente flojos: 2 y 8
-- --------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_month_profile;
CREATE TEMPORARY TABLE tmp_month_profile (
    month_num TINYINT UNSIGNED PRIMARY KEY,
    income_factor DECIMAL(6,3) NOT NULL,
    expense_factor DECIMAL(6,3) NOT NULL,
    fuel_factor DECIMAL(6,3) NOT NULL,
    ads_factor DECIMAL(6,3) NOT NULL,
    suppliers_factor DECIMAL(6,3) NOT NULL,
    repair_shock DECIMAL(6,3) NOT NULL
);

INSERT INTO tmp_month_profile
(month_num, income_factor, expense_factor, fuel_factor, ads_factor, suppliers_factor, repair_shock)
VALUES
(1,  1.000, 1.000, 1.00, 0.95, 1.00, 1.00),
(2,  0.850, 1.120, 1.18, 0.95, 1.08, 1.20), -- perdida probable
(3,  0.920, 1.040, 1.04, 0.95, 1.02, 1.00),
(4,  0.980, 1.000, 1.00, 1.00, 1.00, 1.00),
(5,  1.050, 1.080, 1.03, 1.30, 1.03, 1.00),
(6,  1.100, 1.050, 1.00, 1.10, 1.01, 1.00),
(7,  1.080, 1.090, 1.06, 1.00, 1.04, 1.08),
(8,  0.900, 1.220, 1.35, 0.95, 1.11, 1.45), -- perdida probable
(9,  1.000, 1.040, 1.08, 0.95, 1.02, 1.00),
(10, 1.060, 1.010, 1.00, 1.05, 1.00, 1.00),
(11, 1.180, 1.100, 1.02, 1.25, 1.04, 1.00),
(12, 1.340, 1.170, 1.08, 1.45, 1.07, 1.08);

-- --------------------------------------------
-- 6) Modelo base de gasto por categoria
-- --------------------------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_category_model;
CREATE TEMPORARY TABLE tmp_category_model (
    sort_order INT UNSIGNED NOT NULL,
    category_name VARCHAR(80) NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    base_amount INT UNSIGNED NOT NULL,
    weight INT UNSIGNED NOT NULL
);

INSERT INTO tmp_category_model
(sort_order, category_name, expense_type, base_amount, weight)
VALUES
(1,  'Alquiler local',          1, 340000, 3),
(2,  'Sueldos cocina',          1, 520000, 5),
(3,  'Sueldos caja',            1, 300000, 4),
(4,  'Servicios local',         1, 150000, 3),
(5,  'Publicidad digital',      1, 170000, 3),
(6,  'Seguro comercio',         1,  60000, 1),
(7,  'Internet y sistemas',     1,  40000, 1),
(8,  'Impuestos municipales',   1, 120000, 2),

(9,  'Nafta compras',           2,  75000, 3),
(10, 'Peajes traslados',        2,  32000, 2),
(11, 'Mantenimiento auto',      2,  90000, 2),
(12, 'Seguro auto',             2,  58000, 1),
(13, 'Patente auto',            2,  52000, 1),
(14, 'Limpieza y descartables', 2,  55000, 2),
(15, 'Repuestos cocina',        2,  62000, 2),
(16, 'Emergencias operativas',  2,  45000, 1),

(17, 'Carne y medallones',      3, 240000, 6),
(18, 'Pan de hamburguesa',      3, 130000, 4),
(19, 'Papas congeladas',        3, 120000, 4),
(20, 'Nuggets y pollo',         3, 110000, 3),
(21, 'Bebidas y gaseosas',      3, 150000, 4),
(22, 'Salsas y condimentos',    3,  70000, 2),
(23, 'Packaging y envoltorios', 3,  80000, 2),
(24, 'Quesos y vegetales',      3, 100000, 3);

DROP TEMPORARY TABLE IF EXISTS tmp_category_weighted;
CREATE TEMPORARY TABLE tmp_category_weighted (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    base_amount INT UNSIGNED NOT NULL,
    weight INT UNSIGNED NOT NULL,
    cum_weight INT UNSIGNED NOT NULL
);

SET @running_weight := 0;
INSERT INTO tmp_category_weighted
(category_name, expense_type, base_amount, weight, cum_weight)
SELECT
    m.category_name,
    m.expense_type,
    m.base_amount,
    m.weight,
    (@running_weight := @running_weight + m.weight) AS cum_weight
FROM tmp_category_model m
ORDER BY m.sort_order;

SELECT MAX(cum_weight) INTO @total_weight
FROM tmp_category_weighted;

DROP TEMPORARY TABLE IF EXISTS tmp_category_bucket_map;
CREATE TEMPORARY TABLE tmp_category_bucket_map (
    bucket INT UNSIGNED NOT NULL PRIMARY KEY,
    category_name VARCHAR(80) NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    base_amount INT UNSIGNED NOT NULL
);

INSERT INTO tmp_category_bucket_map
(bucket, category_name, expense_type, base_amount)
WITH RECURSIVE seq_bucket AS (
    SELECT 1 AS bucket
    UNION ALL
    SELECT bucket + 1 FROM seq_bucket WHERE bucket < @total_weight
),
ranked_bucket_category AS (
    SELECT
        sb.bucket,
        cm.category_name,
        cm.expense_type,
        cm.base_amount,
        ROW_NUMBER() OVER (
            PARTITION BY sb.bucket
            ORDER BY cm.cum_weight
        ) AS rn
    FROM seq_bucket sb
    JOIN tmp_category_weighted cm
        ON cm.cum_weight >= sb.bucket
)
SELECT
    bucket,
    category_name,
    expense_type,
    base_amount
FROM ranked_bucket_category
WHERE rn = 1;

-- --------------------------------------------
-- 7) Gastos: 600 (50 por mes)
-- payment_method: 1=efectivo, 2=credito, 3=debito
-- --------------------------------------------
INSERT INTO expenses
(set_id, user_id, category_id, expense_type, payment_method, amount, description, expense_date)
WITH RECURSIVE seq AS (
    SELECT 0 AS n
    UNION ALL
    SELECT n + 1 FROM seq WHERE n < 599
),
raw AS (
    SELECT
        n,
        FLOOR(n / 50) + 1 AS month_num,
        MOD(n, 50) + 1 AS row_in_month,
        ((n * 41 + FLOOR(n / 50) * 11 + 19) MOD @total_weight) + 1 AS bucket,
        (0.82 + (MOD(n * 29 + 7, 49) / 100)) AS rand_scale,
        (1 + MOD(n * 13 + FLOOR(n / 50) * 3, 28)) AS day_in_month
    FROM seq
)
SELECT
    @set_id AS set_id,
    @user_id AS user_id,
    c.id AS category_id,
    cbm.expense_type AS expense_type,
    CASE
        WHEN cbm.expense_type = 1 THEN
            CASE WHEN MOD(raw.row_in_month + raw.month_num, 10) < 2 THEN 1 ELSE 3 END
        WHEN cbm.expense_type = 2 THEN
            CASE
                WHEN MOD(raw.row_in_month + raw.month_num, 10) < 4 THEN 1
                WHEN MOD(raw.row_in_month + raw.month_num, 10) < 8 THEN 3
                ELSE 2
            END
        ELSE
            CASE
                WHEN MOD(raw.row_in_month + raw.month_num, 10) < 2 THEN 1
                WHEN MOD(raw.row_in_month + raw.month_num, 10) < 6 THEN 3
                ELSE 2
            END
    END AS payment_method,
    GREATEST(
        4000,
        ROUND(
            cbm.base_amount
            * mp.expense_factor
            * raw.rand_scale
            * CASE
                WHEN cbm.category_name = 'Publicidad digital' THEN mp.ads_factor
                WHEN cbm.category_name IN ('Nafta compras', 'Peajes traslados') THEN mp.fuel_factor
                WHEN cbm.expense_type = 3 THEN mp.suppliers_factor
                WHEN cbm.category_name = 'Mantenimiento auto' THEN mp.repair_shock
                ELSE 1
              END
            * CASE
                WHEN cbm.category_name = 'Mantenimiento auto'
                     AND raw.row_in_month IN (9, 27, 44) THEN 1.75
                WHEN cbm.category_name = 'Publicidad digital'
                     AND raw.month_num IN (5, 11, 12)
                     AND raw.row_in_month IN (12, 26, 39) THEN 1.35
                WHEN cbm.category_name = 'Servicios local'
                     AND raw.month_num IN (6, 7, 8) THEN 1.18
                ELSE 1
              END
        , 0)
    ) AS amount,
    CASE
        WHEN cbm.category_name = 'Nafta compras' THEN 'Traslado para compra de materia prima'
        WHEN cbm.category_name = 'Peajes traslados' THEN 'Peajes por recorrido de proveedores'
        WHEN cbm.category_name = 'Mantenimiento auto' THEN 'Mantenimiento del vehiculo de compras'
        WHEN cbm.expense_type = 3 THEN CONCAT('Pago a proveedor: ', cbm.category_name)
        WHEN cbm.expense_type = 1 THEN CONCAT('Costo fijo: ', cbm.category_name)
        ELSE CONCAT('Gasto operativo: ', cbm.category_name)
    END AS description,
    DATE_ADD(
        DATE_ADD(@year_start, INTERVAL (raw.month_num - 1) MONTH),
        INTERVAL LEAST(
            raw.day_in_month - 1,
            DAY(LAST_DAY(DATE_ADD(@year_start, INTERVAL (raw.month_num - 1) MONTH))) - 1
        ) DAY
    ) AS expense_date
FROM raw
JOIN tmp_month_profile mp
    ON mp.month_num = raw.month_num
JOIN tmp_category_bucket_map cbm
    ON cbm.bucket = raw.bucket
JOIN categories c
    ON c.set_id = @set_id
   AND c.name = cbm.category_name;

-- --------------------------------------------
-- 8) Ingresos: 48 (4 por mes)
-- income_type: 1=efectivo, 3=debito
-- --------------------------------------------
INSERT INTO incomes
(set_id, income_type, amount, income_date)
WITH RECURSIVE seq_income AS (
    SELECT 0 AS n
    UNION ALL
    SELECT n + 1 FROM seq_income WHERE n < 47
),
raw_income AS (
    SELECT
        n,
        FLOOR(n / 4) + 1 AS month_num,
        MOD(n, 4) + 1 AS income_slot
    FROM seq_income
)
SELECT
    @set_id AS set_id,
    CASE
        WHEN MOD(raw_income.n * 7 + raw_income.month_num, 10) < 7 THEN 3
        ELSE 1
    END AS income_type,
    GREATEST(
        120000,
        ROUND(
            9600000
            * mp.income_factor
            * CASE raw_income.income_slot
                WHEN 1 THEN 0.21
                WHEN 2 THEN 0.24
                WHEN 3 THEN 0.27
                ELSE 0.28
              END
            * (0.93 + (MOD(raw_income.n * 17 + 5, 19) / 100))
        , 0)
    ) AS amount,
    DATE_ADD(
        DATE_ADD(@year_start, INTERVAL (raw_income.month_num - 1) MONTH),
        INTERVAL LEAST(
            CASE raw_income.income_slot
                WHEN 1 THEN 3
                WHEN 2 THEN 10
                WHEN 3 THEN 18
                ELSE 26
            END + MOD(raw_income.n * 5, 3),
            DAY(LAST_DAY(DATE_ADD(@year_start, INTERVAL (raw_income.month_num - 1) MONTH))) - 1
        ) DAY
    ) AS income_date
FROM raw_income
JOIN tmp_month_profile mp
    ON mp.month_num = raw_income.month_num;

COMMIT;

-- --------------------------------------------
-- 9) Verificaciones
-- --------------------------------------------
SELECT
    @user_id AS seeded_user_id,
    @set_id AS seeded_set_id,
    @seed_email AS seeded_email,
    @seed_set_name AS seeded_group;

SELECT
    SUM(CASE WHEN expense_type = 1 THEN 1 ELSE 0 END) AS cat_fijo,
    SUM(CASE WHEN expense_type = 2 THEN 1 ELSE 0 END) AS cat_variable,
    SUM(CASE WHEN expense_type = 3 THEN 1 ELSE 0 END) AS cat_proveedor
FROM categories
WHERE set_id = @set_id;

SELECT COUNT(*) AS expenses_count
FROM expenses
WHERE set_id = @set_id;

SELECT COUNT(*) AS incomes_count
FROM incomes
WHERE set_id = @set_id;

SELECT
    DATE_FORMAT(e.expense_date, '%Y-%m') AS ym,
    SUM(e.amount) AS total_expenses
FROM expenses e
WHERE e.set_id = @set_id
GROUP BY DATE_FORMAT(e.expense_date, '%Y-%m')
ORDER BY ym;

SELECT
    DATE_FORMAT(i.income_date, '%Y-%m') AS ym,
    SUM(i.amount) AS total_incomes
FROM incomes i
WHERE i.set_id = @set_id
GROUP BY DATE_FORMAT(i.income_date, '%Y-%m')
ORDER BY ym;

SELECT
    x.ym,
    x.total_incomes,
    y.total_expenses,
    (x.total_incomes - y.total_expenses) AS monthly_balance
FROM (
    SELECT DATE_FORMAT(income_date, '%Y-%m') AS ym, SUM(amount) AS total_incomes
    FROM incomes
    WHERE set_id = @set_id
    GROUP BY DATE_FORMAT(income_date, '%Y-%m')
) x
JOIN (
    SELECT DATE_FORMAT(expense_date, '%Y-%m') AS ym, SUM(amount) AS total_expenses
    FROM expenses
    WHERE set_id = @set_id
    GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
) y
    ON y.ym = x.ym
ORDER BY x.ym;
