-- Add incomes table for group-level income tracking
-- income_type catalog:
--   1 = EFECTIVO
--   3 = DEBITO

CREATE TABLE incomes (
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
