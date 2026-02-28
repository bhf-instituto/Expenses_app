-- Add payment method support to expenses.
-- Closed catalog handled by backend constants:
-- 1 = EFECTIVO
-- 2 = TARJETA_CREDITO
-- 3 = TARJETA_DEBITO

ALTER TABLE expenses
ADD COLUMN payment_method TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER expense_type;

ALTER TABLE expenses
ADD INDEX idx_expenses_payment_method (payment_method);
