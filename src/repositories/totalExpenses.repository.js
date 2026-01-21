import conn from '../config/db_connection.config.js'


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
            p.id AS provider_id,
            p.name AS provider_name,
            SUM(e.amount) AS total
        FROM expenses e
        LEFT JOIN providers p ON p.id = e.provider_id
        WHERE e.set_id = ?
          AND e.expense_date BETWEEN ? AND ?
        GROUP BY p.id, p.name
        ORDER BY total DESC
    `, [setId, fromDate, toDate]);

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

