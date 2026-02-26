-- Simple tombstone strategy for incremental sync of hard-deleted expenses.
-- Keep hard delete in `expenses` and record deletions in `deleted_expenses`.

CREATE TABLE deleted_expenses (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    expense_id INT UNSIGNED NOT NULL,
    set_id INT UNSIGNED NOT NULL,
    deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_deleted_expenses_set_deleted_at (set_id, deleted_at),
    UNIQUE KEY uq_deleted_expenses_expense_id (expense_id),
    CONSTRAINT fk_deleted_expenses_set
        FOREIGN KEY (set_id) REFERENCES sets(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
