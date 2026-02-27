-- Backend v2
-- Providers stop being a standalone entity and become categories under expense_type = 3.
-- This migration removes the old providers relation from expenses and drops providers table.

ALTER TABLE expenses
DROP FOREIGN KEY fk_expenses_provider;

ALTER TABLE expenses
DROP INDEX idx_expenses_provider;

ALTER TABLE expenses
DROP COLUMN provider_id;

DROP TABLE providers;
