import conn from '../config/db_connection.config.js';

export const createExpense = async (
    setId,
    userId,
    category_id,
    expenseType,
    normAmount,
    description,
    validExpenseDate,
    validProviderId
) => {

    const [result] = await conn.query(`
    INSERT INTO expenses
    (set_id, user_id, category_id, expense_type, amount, description, expense_date, provider_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
        setId,
        userId,
        category_id,
        expenseType,
        normAmount,
        description,
        validExpenseDate,
        validProviderId
    ]);

    return result.insertId;

};
export const getExpenseById = async (id) => {
    const [row] = await conn.query(`
        SELECT 
            id,
            set_id,
            user_id
        FROM expenses
        WHERE id = ? 
        LIMIT 1
        `,
        [id]
    )
    return row[0];
};
export const getExpensesByFilters = async (filters) => {

    let query = `
        SELECT
            e.id,
            e.amount,
            e.description,
            e.expense_date,
            e.expense_type,
            e.user_id,
            u.email AS user_email,
            e.category_id,
            c.name AS category_name,
            e.provider_id,
            p.name AS provider_name,
            e.updated_at
        FROM expenses e
        JOIN categories c ON c.id = e.category_id
        JOIN users u ON u.id = e.user_id
        LEFT JOIN providers p ON p.id = e.provider_id
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

    if (filters.updated_after) {
        query += ' AND e.updated_at > ?';
        params.push(filters.updated_after);
    }

    query += ' ORDER BY e.updated_at DESC, e.id DESC';
    query += ' LIMIT ? OFFSET ?';

    params.push(filters.limit, filters.offset);

    const [rows] = await conn.query(query, params);
    return rows;
};

export const getDeletedExpenseByExpenseId = async (expenseId) => {
    const [rows] = await conn.query(`
        SELECT expense_id, set_id, deleted_at
        FROM deleted_expenses
        WHERE expense_id = ?
        LIMIT 1
    `, [expenseId]);

    return rows[0] || null;
};

export const getDeletedExpensesByFilters = async (filters) => {

    let query = `
        SELECT
            expense_id,
            set_id,
            deleted_at
        FROM deleted_expenses
        WHERE set_id = ?
    `;

    const params = [filters.setId];

    if (filters.deleted_after) {
        query += ' AND deleted_at > ?';
        params.push(filters.deleted_after);
    }

    query += ' ORDER BY deleted_at DESC, expense_id DESC';
    query += ' LIMIT ? OFFSET ?';

    params.push(filters.limit, filters.offset);

    const [rows] = await conn.query(query, params);
    return rows;
};

export const updateExpenseById = async (expenseId, fields) => {

    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const [result] = await conn.query(`
    UPDATE expenses
    SET ${setClause}
    WHERE id = ?
  `, [...values, expenseId]);

    return result.affectedRows > 0;
};
export const deleteExpenseById = async (expenseId, setId) => {

    const connection = await conn.getConnection();

    try {
        await connection.beginTransaction();

        await connection.query(`
            INSERT INTO deleted_expenses (expense_id, set_id)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE
                set_id = VALUES(set_id),
                deleted_at = CURRENT_TIMESTAMP
        `, [expenseId, setId]);

        const [result] = await connection.query(`
            DELETE FROM expenses
            WHERE id = ?
        `, [expenseId]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            return false;
        }

        await connection.commit();
        return true;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};