import conn from '../config/db_connection.config.js'
import EXPENSE_TYPE from '../constants/expenseTypes.constant.js';


export const getExpensesTotalsByFilters = async (filters) => {

    let query = `
        SELECT
            COALESCE(SUM(e.amount), 0) AS total_amount
        FROM expenses e
        WHERE e.set_id = ?
    `;

    const params = [filters.setId];

    if (filters.category_id) {
        query += ' AND e.category_id = ?';
        params.push(filters.category_id);
    }

    if (filters.expense_type !== undefined) {
        query += ' AND e.expense_type = ?';
        params.push(filters.expense_type);
    }

    if (filters.user_id) {
        query += ' AND e.user_id = ?';
        params.push(filters.user_id);
    }

    if (filters.from_date) {
        query += ' AND e.expense_date >= ?';
        params.push(filters.from_date);
    }

    if (filters.to_date) {
        query += ' AND e.expense_date <= ?';
        params.push(filters.to_date);
    }

    const [[row]] = await conn.query(query, params);
    return row;
};


export const getTotalsByCategory = async (setId, fromDate, toDate) => {
    const [rows] = await conn.query(`
        SELECT
            c.id AS category_id,
            c.name AS category_name,
            SUM(e.amount) AS total
        FROM expenses e
        JOIN categories c ON c.id = e.category_id
        WHERE e.set_id = ?
          AND e.expense_date BETWEEN ? AND ?
        GROUP BY c.id, c.name
        ORDER BY total DESC
    `, [setId, fromDate, toDate]);

    console.log(rows);
    
    return rows;
};

export const getTotalsByProvider = async (setId, fromDate, toDate) => {
    const [rows] = await conn.query(`
        SELECT
            c.id AS provider_id,
            c.name AS provider_name,
            SUM(e.amount) AS total
        FROM expenses e
        JOIN categories c ON c.id = e.category_id
        WHERE e.set_id = ?
          AND c.expense_type = ?
          AND e.expense_date BETWEEN ? AND ?
        GROUP BY c.id, c.name
        ORDER BY total DESC
    `, [setId, EXPENSE_TYPE.PROVEEDORES, fromDate, toDate]);

    return rows;
};

export const getTotalsByType = async (setId, fromDate, toDate) => {
    const [rows] = await conn.query(`
        SELECT
            e.expense_type,
            SUM(e.amount) AS total
        FROM expenses e
        WHERE e.set_id = ?
          AND e.expense_date BETWEEN ? AND ?
        GROUP BY e.expense_type
    `, [setId, fromDate, toDate]);

    return rows;
};

