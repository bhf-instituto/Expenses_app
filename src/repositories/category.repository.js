import conn from '../config/db_connection.config.js';


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

export const createCategory = async (setId, categoryType, categoryName) => {
    const [result] = await conn.query(`
        INSERT INTO categories (set_id, name, expense_type)
        VALUES (?, ?, ?);
        `,
        [setId, categoryName, categoryType]
    )

    return true;
}

export const getAllFromSet = async (setId) => {
    const [result] = await conn.query(`
        SELECT name, expense_type FROM categories 
        WHERE set_id = ?
        `,
    [setId])
    return result;
}