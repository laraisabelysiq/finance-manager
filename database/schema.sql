
CREATE DATABASE IF NOT EXISTS finance_manager
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE finance_manager;

-- Usuários da aplicação
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- Categorias pertencentes a cada usuário
CREATE TABLE IF NOT EXISTS categories (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(60) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uq_categories_user_name_type (user_id, name, type),
    UNIQUE KEY uq_categories_id_user (id, user_id),
    KEY idx_categories_user_type (user_id, type),

    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT
) ENGINE=InnoDB;

-- Receitas e despesas
CREATE TABLE IF NOT EXISTS transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes VARCHAR(1000) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    CONSTRAINT chk_transactions_amount
        CHECK (amount > 0),

    CONSTRAINT fk_transactions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE RESTRICT,

    CONSTRAINT fk_transactions_category_user
        FOREIGN KEY (category_id, user_id)
        REFERENCES categories(id, user_id)
        ON DELETE RESTRICT
        ON UPDATE RESTRICT,

    KEY idx_transactions_user_date (user_id, transaction_date),
    KEY idx_transactions_user_type_date
        (user_id, type, transaction_date),
    KEY idx_transactions_category_user (category_id, user_id)
) ENGINE=InnoDB;
