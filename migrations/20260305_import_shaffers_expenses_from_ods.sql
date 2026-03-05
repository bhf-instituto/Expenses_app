-- Import generated from ODS: GASTOS SHAFFER'S (Respuestas).ods
-- Generated at: 2026-03-05 03:00:59
-- Valid rows imported from sheet BD GASTOS: 207

START TRANSACTION;
SET NAMES utf8mb4;

SET @target_set_name := 'SHAFFERS';
-- Source user ids present in the ODS payload (do not change unless source file changes)
SET @source_admin_user_id := 1;
SET @source_participant_user_id := 2;

-- Target user ids in the destination DB
SET @target_admin_user_id := 7;
SET @target_participant_user_id := 8;

SET @set_id := (SELECT id FROM sets WHERE name = @target_set_name LIMIT 1);
SET @admin_exists := (SELECT COUNT(*) FROM users WHERE id = @target_admin_user_id);
SET @participant_exists := (SELECT COUNT(*) FROM users WHERE id = @target_participant_user_id);

-- Ensure memberships exist (and keep requested roles)
INSERT INTO set_users (set_id, user_id, role)
SELECT @set_id, u.id, 1
FROM users u
WHERE @set_id IS NOT NULL
  AND u.id = @target_admin_user_id
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO set_users (set_id, user_id, role)
SELECT @set_id, u.id, 2
FROM users u
WHERE @set_id IS NOT NULL
  AND u.id = @target_participant_user_id
ON DUPLICATE KEY UPDATE role = VALUES(role);

DROP TEMPORARY TABLE IF EXISTS tmp_shaffers_ods_expenses;
CREATE TEMPORARY TABLE tmp_shaffers_ods_expenses (
    tmp_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    expense_date DATE NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    category_name VARCHAR(80) NOT NULL,
    payment_method TINYINT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    mapped_user_id INT UNSIGNED NULL,
    amount INT UNSIGNED NOT NULL,
    description VARCHAR(255) NULL,
    PRIMARY KEY (tmp_id)
);

INSERT INTO tmp_shaffers_ods_expenses
(expense_date, expense_type, category_name, payment_method, user_id, amount, description)
VALUES
    ('2026-01-04', 1, 'GAS', 1, 1, 60000, NULL),
    ('2026-01-05', 2, 'REPARACIONES', 2, 1, 700000, '4 cubiertas, balanceo y alineación'),
    ('2026-01-05', 3, 'BALBI', 3, 1, 710000, 'Hay $164.000 asado de seba'),
    ('2026-01-05', 1, 'SUELDOS GENERAL', 1, 2, 407500, 'PAGO: (COCINA)'),
    ('2026-01-05', 1, 'SUELDOS GENERAL', 3, 1, 250000, 'Pago: leo y seba'),
    ('2026-01-05', 1, 'SUELDOS GENERAL', 3, 1, 210000, 'Pago: diseño juani'),
    ('2026-01-06', 2, 'INSUMOS', 1, 1, 67000, 'Quimica'),
    ('2026-01-07', 1, 'SUELDOS GENERAL', 3, 1, 40000, 'Sueldo Marian'),
    ('2026-01-07', 2, 'NAFTA', 3, 1, 40000, NULL),
    ('2026-01-07', 3, 'DCERO', 3, 1, 159000, NULL),
    ('2026-01-07', 3, 'DCERO', 1, 1, 100000, NULL),
    ('2026-01-07', 3, 'KALIS', 1, 1, 515000, NULL),
    ('2026-01-07', 3, 'FRIPASA', 1, 1, 332000, NULL),
    ('2026-01-07', 2, 'OTROS', 3, 1, 15000, 'Publicidad meta'),
    ('2026-01-08', 3, 'NORTE', 3, 1, 410650, NULL),
    ('2026-01-08', 1, 'SUELDOS GENERAL', 1, 1, 70000, 'Gustavo adelanto de semana'),
    ('2026-01-08', 1, 'SUELDOS GENERAL', 3, 1, 5600, NULL),
    ('2026-01-08', 1, 'GAS', 3, 1, 59000, NULL),
    ('2026-01-08', 1, 'SOFTWARE', 3, 1, 53200, NULL),
    ('2026-01-09', 2, 'REPARACIONES', 1, 2, 40000, 'Cerradura kangoo'),
    ('2026-01-09', 3, 'COCA-COLA', 1, 1, 120000, NULL),
    ('2026-01-09', 1, 'SUELDOS GENERAL', 3, 1, 125000, 'Sueldo seba'),
    ('2026-01-10', 1, 'PUBLICIDAD CSK', 3, 1, 100000, NULL),
    ('2026-01-10', 2, 'REPARACIONES', 3, 1, 3300, 'Flexible'),
    ('2026-01-10', 2, 'OTROS', 3, 1, 10, 'Prueba de base de datos'),
    ('2026-01-10', 2, 'OTROS', 3, 1, 10, 'Prueba BD'),
    ('2026-01-11', 2, 'NAFTA', 3, 1, 30000, NULL),
    ('2026-01-13', 2, 'OTROS', 3, 1, 3300, 'FLXEIBLE'),
    ('2026-01-13', 3, 'NORTE', 3, 1, 410650, 'NORTE 10/01'),
    ('2026-01-13', 2, 'OTROS', 3, 1, 25000, 'CONTADORA'),
    ('2026-01-13', 2, 'INSUMOS', 3, 1, 8100, 'MERCADO'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 3, 1, 90000, 'ALE'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 3, 1, 30000, 'BRYAN'),
    ('2026-01-13', 3, 'BALBI', 3, 1, 609000, '12/01'),
    ('2026-01-13', 2, 'PEAJES', 3, 2, 30000, 'PEAJES MAR DEL PLATA'),
    ('2026-01-13', 2, 'NAFTA', 3, 1, 30000, 'CLIO'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 3, 1, 3500, 'VIAJE SANVI GABI'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 3, 1, 30000, 'ADELNATO ELI'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 3, 1, 30000, 'Marian'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 1, 1, 328200, 'Lu, lauti, eli, gabi'),
    ('2026-01-13', 1, 'SUELDOS GENERAL', 3, 1, 55800, 'Juani'),
    ('2026-01-15', 2, 'NAFTA', 3, 1, 30000, 'Aeropuerto Marcos'),
    ('2026-01-16', 2, 'OTROS', 3, 1, 3500, 'Coca'),
    ('2026-01-17', 3, 'VERDULERIA', 3, 1, 13000, NULL),
    ('2026-01-17', 3, 'VERDULERIA', 3, 1, 17000, NULL),
    ('2026-01-17', 2, 'NAFTA', 3, 1, 40000, NULL),
    ('2026-01-17', 2, 'OTROS', 3, 1, 5700, 'Facturas cyre'),
    ('2026-01-17', 2, 'OTROS', 3, 1, 4500, 'Coca leo'),
    ('2026-01-17', 2, 'OTROS', 3, 1, 4500, 'Coca cocina 13/01'),
    ('2026-01-17', 3, 'CELUGRAF', 3, 1, 12000, 'Anatomias'),
    ('2026-01-17', 1, 'SUELDOS GENERAL', 1, 2, 94500, 'Sueldo gustavo'),
    ('2026-01-17', 1, 'SUELDOS GENERAL', 1, 1, 125000, 'Sueldo seba 18/01 (lo saco el 09/01)'),
    ('2026-01-17', 1, 'SUELDOS GENERAL', 3, 1, 125000, 'Sueldo Leo (11/01'),
    ('2026-01-17', 1, 'TARJETA', 2, 1, 26500, 'Pago manual'),
    ('2026-01-17', 2, 'INSUMOS', 1, 2, 8900, 'Tarugos DIPS'),
    ('2026-01-19', 1, 'SUELDOS GENERAL', 1, 2, 30000, 'Adelanto Seba'),
    ('2026-01-19', 3, 'BALBI', 3, 1, 672000, NULL),
    ('2026-01-19', 1, 'SUELDOS GENERAL', 3, 1, 90000, 'Sueldo Ale'),
    ('2026-01-19', 1, 'SUELDOS GENERAL', 3, 1, 250000, 'Seba y Leo'),
    ('2026-01-19', 1, 'SUELDOS GENERAL', 1, 1, 415000, 'Lu, juani, Benja, eli, Bryan, Gabi'),
    ('2026-01-20', 1, 'SUELDOS GENERAL', 3, 1, 150000, 'Adelanto eli'),
    ('2026-01-20', 1, 'MONOTRIBUTO', 3, 1, 45700, NULL),
    ('2026-01-21', 3, 'COCA-COLA', 1, 1, 147000, NULL),
    ('2026-01-21', 3, 'ALMACEN MANU', 1, 1, 47600, NULL),
    ('2026-01-21', 3, 'ALMACEN MANU', 3, 1, 49000, NULL),
    ('2026-01-21', 1, 'SUELDOS GENERAL', 3, 1, 40000, 'Marian'),
    ('2026-01-21', 3, 'NORTE', 3, 1, 271789, NULL),
    ('2026-01-21', 1, 'GAS', 3, 1, 59000, NULL),
    ('2026-01-21', 2, 'OTROS', 3, 1, 24000, 'Pádel Seba y Leo'),
    ('2026-01-22', 2, 'OTROS', 3, 1, 3900, 'Tornillos juli'),
    ('2026-01-22', 2, 'OTROS', 3, 1, 4900, 'Arroz y cocq'),
    ('2026-01-22', 1, 'SUELDOS GENERAL', 3, 1, 3500, 'Viaje sanvi eli 19/01'),
    ('2026-01-22', 2, 'OTROS', 3, 1, 5000, 'Comida Leo'),
    ('2026-01-22', 3, 'MARMOL', 1, 1, 266500, NULL),
    ('2026-01-22', 1, 'SUELDOS GENERAL', 1, 1, 40000, 'Adelanto LEO'),
    ('2026-01-23', 1, 'SEGURO 208', 1, 2, 58000, NULL),
    ('2026-01-23', 3, 'LATINA', 3, 2, 1568372, 'Papas'),
    ('2026-01-23', 2, 'NAFTA', 1, 2, 70000, NULL),
    ('2026-01-24', 3, 'VERDULERIA', 1, 2, 8000, NULL),
    ('2026-01-28', 1, 'SUELDOS GENERAL', 3, 1, 56700, 'valen'),
    ('2026-01-28', 1, 'SUELDOS GENERAL', 3, 1, 50000, 'Adelanto eli'),
    ('2026-01-28', 2, 'PEAJES', 3, 1, 5500, 'Pan'),
    ('2026-01-28', 1, 'SUELDOS GENERAL', 3, 1, 40000, 'Marian'),
    ('2026-01-28', 3, 'KALIS', 1, 1, 436000, NULL),
    ('2026-01-28', 1, 'SUELDOS GENERAL', 3, 1, 210000, 'Seba y Leo 25/01'),
    ('2026-01-29', 2, 'NAFTA', 3, 1, 50000, NULL),
    ('2026-01-29', 3, 'BALBI', 3, 1, 619500, NULL),
    ('2026-01-29', 2, 'OTROS', 1, 1, 7000, 'Comida viaje'),
    ('2026-01-30', 2, 'REPARACIONES', 3, 1, 75000, 'Ventana 206'),
    ('2026-01-31', 3, 'VERDULERIA', 1, 1, 9000, NULL),
    ('2026-01-31', 1, 'GAS', 3, 1, 59000, NULL),
    ('2026-02-01', 1, 'SUELDOS GENERAL', 1, 2, 50000, 'Adelanto'),
    ('2026-02-01', 2, 'OTROS', 3, 1, 10000, 'Helado juani'),
    ('2026-02-01', 1, 'SUELDOS GENERAL', 3, 1, 120000, 'Ludmi'),
    ('2026-02-02', 2, 'OTROS', 3, 1, 6600, 'Algún insumo 30/01'),
    ('2026-02-02', 1, 'CAPCUT', 3, 1, 21300, NULL),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 1, 2, 496200, 'Juani, Lu, Benja, Bryan, Ale, Gabi 01/02'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 3, 1, 200000, 'Leo y seba 01/02 -50k adelanto seba'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 3, 1, 170000, 'Juani diseño 01/02'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 1, 1, 490500, 'Juani, Lu, Benja, Gus, Bryan y Gabi 01/02'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 3, 1, 13500, 'Gabi 01/02'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 3, 1, 123000, 'Ale 01/02 + premio 30k'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 1, 1, 37000, 'Eli 01/02 pago cuota 1 de 4'),
    ('2026-02-02', 1, 'SUELDOS GENERAL', 3, 1, 33400, 'Gus 01/02'),
    ('2026-02-02', 1, 'LUZ', 3, 1, 210000, 'Enero'),
    ('2026-02-02', 1, 'LUZ', 3, 1, 210000, 'Enero'),
    ('2026-02-03', 2, 'NAFTA', 3, 1, 50000, 'Marcos capi'),
    ('2026-02-03', 3, 'NORTE', 3, 1, 143500, '29/01'),
    ('2026-02-04', 3, 'VERDULERIA', 1, 1, 9200, NULL),
    ('2026-02-05', 2, 'OTROS', 1, 1, 1800, 'Cartulina'),
    ('2026-02-06', 1, 'SUELDOS GENERAL', 1, 1, 100000, 'Adelanto leo'),
    ('2026-02-06', 3, 'CELUGRAF', 1, 1, 64000, NULL),
    ('2026-02-06', 3, 'VERDULERIA', 1, 2, 19000, NULL),
    ('2026-02-07', 3, 'COCA-COLA', 1, 2, 55000, '10 pack coca'),
    ('2026-02-09', 1, 'LUZ', 3, 1, 210000, 'Enero'),
    ('2026-02-09', 3, 'BALBI', 3, 1, 546000, '02/02'),
    ('2026-02-09', 2, 'PEAJES', 3, 1, 3500, 'Peajes Marcos capi'),
    ('2026-02-09', 1, 'SUELDOS GENERAL', 3, 1, 40000, 'Marian 03/02'),
    ('2026-02-09', 1, 'SEGURO KANGOO', 3, 1, 76000, '03/02 EN VIAJE A CHASCO'),
    ('2026-02-09', 2, 'NAFTA', 3, 1, 75200, '06/02 Tanque lleno antes de salir a ramallo'),
    ('2026-02-09', 1, 'SOFTWARE', 3, 1, 55200, NULL),
    ('2026-02-09', 1, 'SUELDOS GENERAL', 3, 1, 56700, 'Valen 07/02'),
    ('2026-02-09', 3, 'BALBI', 3, 1, 735000, NULL),
    ('2026-02-09', 3, 'DCERO', 3, 1, 153750, '50% del Pago total'),
    ('2026-02-09', 1, 'SUELDOS GENERAL', 3, 1, 25000, 'leo (Resto del sueldo 08/02)'),
    ('2026-02-09', 1, 'SUELDOS GENERAL', 3, 1, 125000, 'seba 08/02'),
    ('2026-02-09', 1, 'SUELDOS GENERAL', 1, 1, 514800, 'Lu, Benja, Gus, ale, Bryan, gabi y eli'),
    ('2026-02-10', 3, 'MARMOL', 1, 1, 1016600, 'Papas'),
    ('2026-02-10', 1, 'SUELDOS GENERAL', 3, 1, 40000, 'Marian'),
    ('2026-02-10', 1, 'TARJETA', 2, 1, 9900, '09/02 (débito lo que tenía de $203.800)'),
    ('2026-02-11', 3, 'VERDULERIA', 3, 1, 22500, NULL),
    ('2026-02-12', 2, 'PEAJES', 3, 1, 5500, NULL),
    ('2026-02-12', 3, 'IGG PACKAGING', 3, 1, 370000, NULL),
    ('2026-02-13', 3, 'KALIS', 1, 1, 460000, NULL),
    ('2026-02-13', 3, 'NORTE', 3, 1, 407690, NULL),
    ('2026-02-13', 1, 'GAS', 3, 1, 62000, NULL),
    ('2026-02-14', 2, 'INSUMOS', 1, 2, 10000, 'Tarros dips'),
    ('2026-02-14', 3, 'ALMACEN MANU', 1, 2, 8200, 'Pepinillos'),
    ('2026-02-14', 1, 'SUELDOS GENERAL', 3, 2, 20000, 'Adelanto Seba'),
    ('2026-02-14', 2, 'OTROS', 3, 1, 2400, 'Yerba'),
    ('2026-02-14', 1, 'SUELDOS GENERAL', 3, 1, 56700, 'Valen'),
    ('2026-02-14', 2, 'OTROS', 3, 1, 7000, 'Mercado'),
    ('2026-02-14', 2, 'OTROS', 3, 1, 15600, 'Bon o bon'),
    ('2026-02-17', 3, 'VERDULERIA', 3, 1, 15500, NULL),
    ('2026-02-17', 3, 'VERDULERIA', 3, 1, 4600, NULL),
    ('2026-02-17', 2, 'INSUMOS', 3, 1, 14200, 'Papel, trapos, etc'),
    ('2026-02-17', 3, 'VERDULERIA', 3, 1, 5100, NULL),
    ('2026-02-17', 2, 'OTROS', 3, 1, 17000, 'Bon o bon sensei'),
    ('2026-02-17', 1, 'SUELDOS GENERAL', 3, 1, 230000, 'Seba 105k, Leo 125k'),
    ('2026-02-17', 1, 'SUELDOS GENERAL', 1, 1, 398200, 'Juani, Benja, Gus, eli, gabi'),
    ('2026-02-17', 1, 'SUELDOS GENERAL', 3, 1, 90000, 'Ale'),
    ('2026-02-17', 1, 'SUELDOS GENERAL', 3, 1, 31700, 'Eli'),
    ('2026-02-17', 1, 'SUELDOS GENERAL', 3, 1, 29300, 'Bryan'),
    ('2026-02-17', 1, 'MONOTRIBUTO', 3, 1, 52500, 'Febrero'),
    ('2026-02-18', 2, 'REPARACIONES', 1, 2, 58000, 'Matafuegos'),
    ('2026-02-18', 1, 'SUELDOS GENERAL', 3, 1, 91250, 'Marian + feriados'),
    ('2026-02-18', 2, 'EQUIPAMIENTO', 3, 1, 137500, 'Minipimer, balanza, pistola, cuchillas'),
    ('2026-02-18', 3, 'VERDULERIA', 3, 1, 6000, NULL),
    ('2026-02-19', 3, 'COCA-COLA', 1, 1, 104500, '19 packs'),
    ('2026-02-19', 1, 'SUELDOS GENERAL', 3, 1, 300000, 'Juli'),
    ('2026-02-19', 2, 'NAFTA', 3, 1, 30000, NULL),
    ('2026-02-19', 2, 'NAFTA', 1, 2, 60000, NULL),
    ('2026-02-20', 3, 'ALMACEN MANU', 1, 1, 100000, NULL),
    ('2026-02-20', 3, 'ALMACEN MANU', 3, 1, 34000, NULL),
    ('2026-02-20', 3, 'FRIPASA', 1, 1, 352000, NULL),
    ('2026-02-20', 3, 'VERDULERIA', 1, 1, 8000, NULL),
    ('2026-02-20', 1, 'GAS', 3, 1, 62000, NULL),
    ('2026-02-20', 2, 'OTROS', 3, 1, 22000, 'Comida viaje trabajo'),
    ('2026-02-20', 2, 'PEAJES', 3, 1, 2500, NULL),
    ('2026-02-23', 1, 'SUELDOS GENERAL', 3, 1, 56700, 'Valen'),
    ('2026-02-23', 1, 'SEGURO 208', 3, 2, 58000, 'Seguro Peugeot 206'),
    ('2026-02-23', 3, 'BALBI', 3, 1, 528000, NULL),
    ('2026-02-23', 1, 'SUELDOS GENERAL', 3, 1, 452250, 'Juani, Lu, ale, Gus, bryan'),
    ('2026-02-23', 1, 'SUELDOS GENERAL', 1, 1, 82700, 'Gabi, eli'),
    ('2026-02-23', 1, 'SUELDOS GENERAL', 3, 1, 125000, 'Leo'),
    ('2026-02-23', 1, 'SUELDOS GENERAL', 3, 1, 98000, 'Benja y Ale viaje sanvi'),
    ('2026-02-23', 1, 'SUELDOS GENERAL', 1, 2, 125000, 'Sueldo finde'),
    ('2026-02-24', 2, 'NAFTA', 3, 1, 30000, 'Auto mama'),
    ('2026-02-25', 3, 'VERDULERIA', 3, 1, 10600, NULL),
    ('2026-02-26', 2, 'EQUIPAMIENTO', 3, 1, 70000, 'Salero difusor, pistón de pistola, gomitas aderezos'),
    ('2026-02-26', 3, 'NORTE', 3, 1, 505000, NULL),
    ('2026-02-27', 2, 'NAFTA', 3, 1, 60000, NULL),
    ('2026-02-27', 2, 'OTROS', 3, 1, 350000, 'Seña food truck'),
    ('2026-02-27', 1, 'SUELDOS GENERAL', 3, 1, 30000, 'Marian'),
    ('2026-02-28', 2, 'AUTO', 3, 2, 60000, 'Óptica kangoo'),
    ('2026-02-28', 3, 'VERDULERIA', 1, 2, 14000, NULL),
    ('2026-03-02', 1, 'SUELDOS GENERAL', 3, 1, 172500, 'Ludmi'),
    ('2026-03-03', 2, 'NAFTA', 3, 1, 30000, NULL),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 40000, 'Marian'),
    ('2026-03-03', 2, 'OTROS', 3, 1, 4400, 'Poet y ddl'),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 3500, 'Eli sanvi'),
    ('2026-03-03', 3, 'BALBI', 3, 1, 726000, NULL),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 93000, 'Ale'),
    ('2026-03-03', 1, 'CAPCUT', 3, 1, 21000, NULL),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 56700, 'Valen 27/02'),
    ('2026-03-03', 3, 'IGG PACKAGING', 3, 1, 16800, 'Dips'),
    ('2026-03-03', 3, 'VERDULERIA', 3, 1, 7000, 'Amarito'),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 30000, 'Marian 25/02'),
    ('2026-03-03', 2, 'OTROS', 3, 1, 19000, 'Stele (no se)'),
    ('2026-03-03', 2, 'OTROS', 3, 1, 19400, 'Patri online (nose)'),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 84000, 'Juani (16 y 17 de febrero) feriados'),
    ('2026-03-03', 1, 'SUELDOS GENERAL', 3, 1, 66150, 'Valen 17/02 feriado y semana'),
    ('2026-03-03', 2, 'OTROS', 3, 1, 250000, 'Food truck'),
    ('2026-03-04', 1, 'SEGURO KANGOO', 3, 2, 73000, NULL),
    ('2026-03-04', 2, 'OTROS', 3, 2, 7800, 'Recarga teléfono trabajo'),
    ('2026-03-04', 2, 'AUTO', 3, 2, 295000, 'Mano obra dani'),
    ('2026-03-04', 2, 'AUTO', 1, 2, 288000, 'Repuestos kangoo');

-- Map source user ids (from ODS) to destination user ids (in target DB)
UPDATE tmp_shaffers_ods_expenses t
SET t.mapped_user_id = CASE
    WHEN t.user_id = @source_admin_user_id AND @admin_exists > 0 THEN @target_admin_user_id
    WHEN t.user_id = @source_participant_user_id AND @participant_exists > 0 THEN @target_participant_user_id
    WHEN @admin_exists > 0 THEN @target_admin_user_id
    WHEN @participant_exists > 0 THEN @target_participant_user_id
    ELSE NULL
END;

SET @source_rows_without_valid_user := (
  SELECT COUNT(*)
  FROM tmp_shaffers_ods_expenses t
  LEFT JOIN users u
    ON u.id = t.mapped_user_id
  WHERE u.id IS NULL
);

-- Create missing categories for this set
INSERT INTO categories (set_id, name, expense_type)
SELECT DISTINCT @set_id, t.category_name, t.expense_type
FROM tmp_shaffers_ods_expenses t
LEFT JOIN categories c
    ON c.set_id = @set_id
   AND c.expense_type = t.expense_type
   AND c.name = t.category_name
WHERE @set_id IS NOT NULL
  AND c.id IS NULL;
SET @categories_inserted := ROW_COUNT();

-- Insert expenses, skipping exact duplicates if script is rerun
INSERT INTO expenses (set_id, user_id, category_id, expense_type, payment_method, amount, description, expense_date)
SELECT
    @set_id,
    t.mapped_user_id,
    c.id,
    t.expense_type,
    t.payment_method,
    t.amount,
    t.description,
    t.expense_date
FROM tmp_shaffers_ods_expenses t
JOIN users u
    ON u.id = t.mapped_user_id
JOIN categories c
    ON c.set_id = @set_id
   AND c.expense_type = t.expense_type
   AND c.name = t.category_name
LEFT JOIN expenses e
    ON e.set_id = @set_id
   AND e.user_id = t.mapped_user_id
   AND e.category_id = c.id
   AND e.expense_type = t.expense_type
   AND e.payment_method = t.payment_method
   AND e.amount = t.amount
   AND COALESCE(e.description, '') = COALESCE(t.description, '')
   AND e.expense_date = t.expense_date
WHERE @set_id IS NOT NULL
  AND e.id IS NULL;
SET @expenses_inserted := ROW_COUNT();

COMMIT;

SELECT
    @target_set_name AS target_set_name,
    @set_id AS set_id,
    @target_admin_user_id AS target_admin_user_id,
    @admin_exists AS target_admin_exists,
    @target_participant_user_id AS target_participant_user_id,
    @participant_exists AS target_participant_exists,
    @categories_inserted AS categories_inserted,
    @expenses_inserted AS expenses_inserted,
    (SELECT COUNT(*) FROM tmp_shaffers_ods_expenses) AS source_rows,
    @source_rows_without_valid_user AS source_rows_without_valid_user;

