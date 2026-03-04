import conn from '../config/db_connection.config.js';

export const createIncome = async (setId, incomeType, amount, incomeDate) => {
    const [result] = await conn.query(`
        INSERT INTO incomes (set_id, income_type, amount, income_date)
        VALUES (?, ?, ?, ?)
    `, [setId, incomeType, amount, incomeDate]);

    return result.insertId;
};

export const getIncomesByFilters = async (filters) => {
    let query = `
        SELECT
            id,
            set_id,
            income_type,
            amount,
            income_date,
            updated_at
        FROM incomes
        WHERE set_id = ?
    `;

    const params = [filters.setId];

    if (filters.income_type !== undefined) {
        query += ' AND income_type = ?';
        params.push(filters.income_type);
    }

    if (filters.from_date) {
        query += ' AND income_date >= ?';
        params.push(filters.from_date);
    }

    if (filters.to_date) {
        query += ' AND income_date <= ?';
        params.push(filters.to_date);
    }

    if (filters.updated_after) {
        query += ' AND updated_at > ?';
        params.push(filters.updated_after);
    }

    query += ' ORDER BY updated_at DESC, id DESC';
    query += ' LIMIT ? OFFSET ?';

    params.push(filters.limit, filters.offset);

    const [rows] = await conn.query(query, params);
    return rows;
};

export const getIncomeTotalByRange = async (setId, fromDate, toDate, incomeType = undefined) => {
    let query = `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM incomes
        WHERE set_id = ?
          AND income_date BETWEEN ? AND ?
    `;

    const params = [setId, fromDate, toDate];

    if (incomeType !== undefined) {
        query += ' AND income_type = ?';
        params.push(incomeType);
    }

    const [[row]] = await conn.query(query, params);
    return row;
};

export const getExpenseTotalByRange = async (setId, fromDate, toDate) => {
    const [[row]] = await conn.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE set_id = ?
          AND expense_date BETWEEN ? AND ?
    `, [setId, fromDate, toDate]);

    return row;
};

export const getExpenseTotalsByTypeInRange = async (setId, fromDate, toDate) => {
    const [rows] = await conn.query(`
        SELECT
            expense_type,
            SUM(amount) AS total
        FROM expenses
        WHERE set_id = ?
          AND expense_date BETWEEN ? AND ?
        GROUP BY expense_type
        ORDER BY total DESC
    `, [setId, fromDate, toDate]);

    return rows;
};

export const getExpenseTotalsByCategoryInRange = async (setId, fromDate, toDate, limit) => {
    const [rows] = await conn.query(`
        SELECT
            c.id AS category_id,
            c.name AS category_name,
            c.expense_type,
            SUM(e.amount) AS total
        FROM expenses e
        JOIN categories c ON c.id = e.category_id
        WHERE e.set_id = ?
          AND e.expense_date BETWEEN ? AND ?
        GROUP BY c.id, c.name, c.expense_type
        ORDER BY total DESC
        LIMIT ?
    `, [setId, fromDate, toDate, limit]);

    return rows;
};
