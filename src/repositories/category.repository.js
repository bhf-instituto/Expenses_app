import conn from '../config/db_connection.config.js';

export const findCategoryById = async (categoryId, setId) => {
    const [result] = await conn.query(`
        SELECT id, expense_type
        FROM categories
        WHERE id = ?
        AND set_id = ?
        `,
        [categoryId, setId]
    )

    return result[0];
}

export const findCategoryByUnique = async (setId, categoryType, categoryName) => {
    const [result] = await conn.query(`
        SELECT id, name
        FROM categories
        WHERE set_id = ?
          AND expense_type = ?
          AND name = ?
        LIMIT 1;

        `,
        [setId, categoryType, categoryName]
    )

    return result.length > 0;
}

export const createCategory = async (setId, categoryName, expenseType) => {
    const [result] = await conn.query(`
        INSERT INTO categories (set_id, name, expense_type)
        VALUES (?, ?, ?);
        `,
        [setId, categoryName, expenseType]
    )

    return result.insertId;
}

export const getAllFromSet_ = async (setId) => {
    const [result] = await conn.query(`
        SELECT name, expense_type FROM categories 
        WHERE set_id = ?
        `,
        [setId])

    return result;
}

export const getAllFromSet = async (setId, expenseType = null) => {
    
    
    let sql = `
        SELECT id, name, expense_type
        FROM categories
        WHERE set_id = ?
    `;

    const params = [setId];

    if (expenseType !== null ) {
        sql += ' AND expense_type = ?';
        params.push(expenseType);
    }

    const [result] = await conn.query(sql, params);
    return result;
};


export const editCategory_ = async (categoryId, categoryName) => {

    console.log(categoryId, categoryName);

    const [result] = await conn.query(`
            UPDATE categories 
            SET name = ?
            WHERE id = ?
        `,
        [categoryName, categoryId])

    return result.affectedRows > 0;
}

export const editCategory = async (
    categoryId,
    categoryName,
    expenseType = null
) => {
    let sql = `
    UPDATE categories
    SET name = ?
  `;

    const params = [categoryName];

    if (expenseType !== null) {
        sql += ', expense_type = ?';
        params.push(expenseType);
    }

    sql += ' WHERE id = ?';
    params.push(categoryId);

    const [result] = await conn.query(sql, params);

    return result.affectedRows;
};
