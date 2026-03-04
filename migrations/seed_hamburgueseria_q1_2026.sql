-- ============================================
-- Q1 2026 completo: Hamburgueseria Ruta 8
-- - Gastos: 50 por mes (150 total)
-- - Ingresos: 4 por mes (12 total)
-- Periodo: 2026-01-01 a 2026-03-31
-- ============================================

START TRANSACTION;

-- 0) Parametros
SET @seed_set_name := 'Hamburgueseria Ruta 8';
SET @seed_email := 'dueno_hamburgueseria@demo.com';
SET @period_start := DATE('2026-01-01');
SET @period_end := DATE('2026-03-31');
SET @replace_existing := 1; -- 1 = borra y regenera Q1/2026, 0 = solo inserta

SET @set_id := NULL;
SET @user_id := NULL;

SELECT s.id INTO @set_id
FROM sets s
WHERE s.name = @seed_set_name
ORDER BY s.id DESC
LIMIT 1;

SELECT u.id INTO @user_id
FROM users u
WHERE u.email = @seed_email
LIMIT 1;

SELECT @set_id AS detected_set_id, @user_id AS detected_user_id;

-- 1) Limpieza opcional del periodo
DELETE FROM expenses
WHERE @replace_existing = 1
  AND set_id = @set_id
  AND expense_date BETWEEN @period_start AND @period_end;

DELETE FROM incomes
WHERE @replace_existing = 1
  AND set_id = @set_id
  AND income_date BETWEEN @period_start AND @period_end;

-- =========================================================
-- 2) GASTOS Q1 2026 (150 registros)
-- =========================================================

DROP TEMPORARY TABLE IF EXISTS tmp_month_profile_2026_q1;
CREATE TEMPORARY TABLE tmp_month_profile_2026_q1 (
  month_num TINYINT UNSIGNED PRIMARY KEY,
  expense_factor DECIMAL(6,3) NOT NULL,
  fuel_factor DECIMAL(6,3) NOT NULL,
  ads_factor DECIMAL(6,3) NOT NULL,
  suppliers_factor DECIMAL(6,3) NOT NULL,
  repair_shock DECIMAL(6,3) NOT NULL
);

-- Enero alto, Febrero duro, Marzo recuperacion
INSERT INTO tmp_month_profile_2026_q1
(month_num, expense_factor, fuel_factor, ads_factor, suppliers_factor, repair_shock)
VALUES
(1, 1.060, 1.10, 1.15, 1.08, 1.00),
(2, 1.180, 1.22, 0.95, 1.10, 1.55),
(3, 0.980, 1.02, 1.08, 1.00, 1.00);

DROP TEMPORARY TABLE IF EXISTS tmp_category_model_2026_q1;
CREATE TEMPORARY TABLE tmp_category_model_2026_q1 (
  sort_order INT UNSIGNED NOT NULL,
  category_name VARCHAR(80) NOT NULL,
  expense_type TINYINT UNSIGNED NOT NULL,
  base_amount INT UNSIGNED NOT NULL,
  weight INT UNSIGNED NOT NULL
);

INSERT INTO tmp_category_model_2026_q1
(sort_order, category_name, expense_type, base_amount, weight)
VALUES
(1,  'Alquiler local',          1, 360000, 3),
(2,  'Sueldos cocina',          1, 560000, 5),
(3,  'Sueldos caja',            1, 330000, 4),
(4,  'Servicios local',         1, 170000, 3),
(5,  'Publicidad digital',      1, 190000, 3),
(6,  'Seguro comercio',         1,  65000, 1),
(7,  'Internet y sistemas',     1,  45000, 1),
(8,  'Impuestos municipales',   1, 130000, 2),

(9,  'Nafta compras',           2,  90000, 3),
(10, 'Peajes traslados',        2,  38000, 2),
(11, 'Mantenimiento auto',      2, 110000, 2),
(12, 'Seguro auto',             2,  62000, 1),
(13, 'Patente auto',            2,  56000, 1),
(14, 'Limpieza y descartables', 2,  65000, 2),
(15, 'Repuestos cocina',        2,  75000, 2),
(16, 'Emergencias operativas',  2,  52000, 1),

(17, 'Carne y medallones',      3, 280000, 6),
(18, 'Pan de hamburguesa',      3, 150000, 4),
(19, 'Papas congeladas',        3, 145000, 4),
(20, 'Nuggets y pollo',         3, 130000, 3),
(21, 'Bebidas y gaseosas',      3, 165000, 4),
(22, 'Salsas y condimentos',    3,  82000, 2),
(23, 'Packaging y envoltorios', 3,  92000, 2),
(24, 'Quesos y vegetales',      3, 118000, 3);

DROP TEMPORARY TABLE IF EXISTS tmp_category_weighted_2026_q1;
CREATE TEMPORARY TABLE tmp_category_weighted_2026_q1 (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(80) NOT NULL,
  expense_type TINYINT UNSIGNED NOT NULL,
  base_amount INT UNSIGNED NOT NULL,
  weight INT UNSIGNED NOT NULL,
  cum_weight INT UNSIGNED NOT NULL
);

SET @running_weight := 0;
INSERT INTO tmp_category_weighted_2026_q1
(category_name, expense_type, base_amount, weight, cum_weight)
SELECT
  m.category_name,
  m.expense_type,
  m.base_amount,
  m.weight,
  (@running_weight := @running_weight + m.weight) AS cum_weight
FROM tmp_category_model_2026_q1 m
ORDER BY m.sort_order;

SELECT MAX(cum_weight) INTO @total_weight
FROM tmp_category_weighted_2026_q1;

DROP TEMPORARY TABLE IF EXISTS tmp_category_ranges_2026_q1;
CREATE TEMPORARY TABLE tmp_category_ranges_2026_q1 AS
SELECT
  category_name,
  expense_type,
  base_amount,
  (cum_weight - weight + 1) AS bucket_from,
  cum_weight AS bucket_to
FROM tmp_category_weighted_2026_q1;

INSERT INTO expenses
(set_id, user_id, category_id, expense_type, payment_method, amount, description, expense_date)
WITH RECURSIVE seq AS (
  SELECT 0 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 149
),
raw AS (
  SELECT
    n,
    FLOOR(n / 50) + 1 AS month_num,
    MOD(n, 50) + 1 AS row_in_month,
    ((n * 37 + FLOOR(n / 50) * 17 + 23) MOD @total_weight) + 1 AS bucket,
    (0.84 + (MOD(n * 31 + 11, 43) / 100)) AS rand_scale,
    (1 + MOD(n * 9 + FLOOR(n / 50) * 5, 28)) AS day_in_month
  FROM seq
)
SELECT
  @set_id AS set_id,
  @user_id AS user_id,
  c.id AS category_id,
  cr.expense_type AS expense_type,
  CASE
    WHEN cr.expense_type = 1 THEN
      CASE WHEN MOD(raw.row_in_month + raw.month_num, 10) < 2 THEN 1 ELSE 3 END
    WHEN cr.expense_type = 2 THEN
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
      cr.base_amount
      * mp.expense_factor
      * raw.rand_scale
      * CASE
          WHEN cr.category_name = 'Publicidad digital' THEN mp.ads_factor
          WHEN cr.category_name IN ('Nafta compras', 'Peajes traslados') THEN mp.fuel_factor
          WHEN cr.expense_type = 3 THEN mp.suppliers_factor
          WHEN cr.category_name = 'Mantenimiento auto' THEN mp.repair_shock
          ELSE 1
        END
      * CASE
          WHEN cr.category_name = 'Mantenimiento auto'
               AND raw.month_num = 2
               AND raw.row_in_month IN (8, 21, 37) THEN 2.10
          WHEN cr.category_name = 'Publicidad digital'
               AND raw.month_num IN (1, 3)
               AND raw.row_in_month IN (11, 26, 41) THEN 1.30
          WHEN cr.category_name = 'Servicios local'
               AND raw.month_num = 2 THEN 1.16
          WHEN cr.category_name = 'Carne y medallones'
               AND raw.month_num = 1 THEN 1.12
          ELSE 1
        END
    , 0)
  ) AS amount,
  CASE
    WHEN cr.category_name = 'Nafta compras' THEN 'Traslado para compra de materia prima'
    WHEN cr.category_name = 'Peajes traslados' THEN 'Peajes por recorrido de proveedores'
    WHEN cr.category_name = 'Mantenimiento auto' THEN 'Mantenimiento del vehiculo de compras'
    WHEN cr.expense_type = 3 THEN CONCAT('Pago a proveedor: ', cr.category_name)
    WHEN cr.expense_type = 1 THEN CONCAT('Costo fijo: ', cr.category_name)
    ELSE CONCAT('Gasto operativo: ', cr.category_name)
  END AS description,
  DATE_ADD(
    DATE_ADD(@period_start, INTERVAL (raw.month_num - 1) MONTH),
    INTERVAL LEAST(
      raw.day_in_month - 1,
      DAY(LAST_DAY(DATE_ADD(@period_start, INTERVAL (raw.month_num - 1) MONTH))) - 1
    ) DAY
  ) AS expense_date
FROM raw
JOIN tmp_month_profile_2026_q1 mp
  ON mp.month_num = raw.month_num
JOIN tmp_category_ranges_2026_q1 cr
  ON raw.bucket BETWEEN cr.bucket_from AND cr.bucket_to
JOIN categories c
  ON c.set_id = @set_id
 AND c.name = cr.category_name
 AND c.expense_type = cr.expense_type;

-- =========================================================
-- 3) INGRESOS Q1 2026 (12 registros)
-- =========================================================

DROP TEMPORARY TABLE IF EXISTS tmp_income_profile_2026_q1;
CREATE TEMPORARY TABLE tmp_income_profile_2026_q1 (
  month_num TINYINT UNSIGNED PRIMARY KEY,
  income_factor DECIMAL(6,3) NOT NULL
);

INSERT INTO tmp_income_profile_2026_q1 (month_num, income_factor) VALUES
(1, 1.080),
(2, 0.900),
(3, 1.000);

INSERT INTO incomes (set_id, income_type, amount, income_date)
WITH RECURSIVE seq_income AS (
  SELECT 0 AS n
  UNION ALL
  SELECT n + 1 FROM seq_income WHERE n < 11
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
    150000,
    ROUND(
      10200000
      * ip.income_factor
      * CASE raw_income.income_slot
          WHEN 1 THEN 0.20
          WHEN 2 THEN 0.24
          WHEN 3 THEN 0.27
          ELSE 0.29
        END
      * (0.94 + (MOD(raw_income.n * 13 + 5, 17) / 100))
    , 0)
  ) AS amount,
  DATE_ADD(
    DATE_ADD(@period_start, INTERVAL (raw_income.month_num - 1) MONTH),
    INTERVAL LEAST(
      CASE raw_income.income_slot
        WHEN 1 THEN 3
        WHEN 2 THEN 10
        WHEN 3 THEN 18
        ELSE 26
      END + MOD(raw_income.n * 5, 3),
      DAY(LAST_DAY(DATE_ADD(@period_start, INTERVAL (raw_income.month_num - 1) MONTH))) - 1
    ) DAY
  ) AS income_date
FROM raw_income
JOIN tmp_income_profile_2026_q1 ip
  ON ip.month_num = raw_income.month_num;

COMMIT;

-- 4) Verificaciones
SELECT
  DATE_FORMAT(expense_date, '%Y-%m') AS ym,
  COUNT(*) AS qty_gastos,
  SUM(amount) AS total_gastos
FROM expenses
WHERE set_id = @set_id
  AND expense_date BETWEEN @period_start AND @period_end
GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
ORDER BY ym;

SELECT
  DATE_FORMAT(income_date, '%Y-%m') AS ym,
  COUNT(*) AS qty_ingresos,
  SUM(amount) AS total_ingresos
FROM incomes
WHERE set_id = @set_id
  AND income_date BETWEEN @period_start AND @period_end
GROUP BY DATE_FORMAT(income_date, '%Y-%m')
ORDER BY ym;

SELECT
  e.ym,
  e.total_gastos,
  i.total_ingresos,
  (i.total_ingresos - e.total_gastos) AS balance
FROM (
  SELECT DATE_FORMAT(expense_date, '%Y-%m') AS ym, SUM(amount) AS total_gastos
  FROM expenses
  WHERE set_id = @set_id
    AND expense_date BETWEEN @period_start AND @period_end
  GROUP BY DATE_FORMAT(expense_date, '%Y-%m')
) e
JOIN (
  SELECT DATE_FORMAT(income_date, '%Y-%m') AS ym, SUM(amount) AS total_ingresos
  FROM incomes
  WHERE set_id = @set_id
    AND income_date BETWEEN @period_start AND @period_end
  GROUP BY DATE_FORMAT(income_date, '%Y-%m')
) i ON i.ym = e.ym
ORDER BY e.ym;
