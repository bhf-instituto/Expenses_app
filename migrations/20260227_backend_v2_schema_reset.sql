-- Backend v2 full reset schema
-- Drops and recreates the full database structure without providers table.
-- Expense types are app-defined constants:
--   1 = FIJO
--   2 = VARIABLE
--   3 = PROVEEDORES

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS deleted_expenses;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS set_users;
DROP TABLE IF EXISTS sets;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(150) NOT NULL,
    password_hash CHAR(60) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sets (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE set_users (
    set_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    role TINYINT UNSIGNED NOT NULL DEFAULT 2,
    PRIMARY KEY (set_id, user_id),
    KEY fk_set_users_user (user_id),
    CONSTRAINT fk_set_users_set
        FOREIGN KEY (set_id) REFERENCES sets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_set_users_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categories (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    set_id INT UNSIGNED NOT NULL,
    name VARCHAR(80) NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_category_set_type_name (set_id, expense_type, name),
    CONSTRAINT fk_categories_set
        FOREIGN KEY (set_id) REFERENCES sets(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE expenses (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    set_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    expense_type TINYINT UNSIGNED NOT NULL,
    amount INT UNSIGNED NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    expense_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY fk_expenses_user (user_id),
    KEY idx_expenses_set_date (set_id, expense_date),
    KEY idx_expenses_category (category_id),
    CONSTRAINT fk_expenses_category
        FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_expenses_set
        FOREIGN KEY (set_id) REFERENCES sets(id),
    CONSTRAINT fk_expenses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE deleted_expenses (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    expense_id INT UNSIGNED NOT NULL,
    set_id INT UNSIGNED NOT NULL,
    deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_deleted_expenses_expense_id (expense_id),
    KEY idx_deleted_expenses_set_deleted_at (set_id, deleted_at),
    CONSTRAINT fk_deleted_expenses_set
        FOREIGN KEY (set_id) REFERENCES sets(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE refresh_tokens (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT UNSIGNED NOT NULL,
    hashed_token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_refresh (user_id),
    CONSTRAINT refresh_tokens_ibfk_1
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
