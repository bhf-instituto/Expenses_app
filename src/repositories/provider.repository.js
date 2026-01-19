import conn from '../config/db_connection.config.js';

export const updateProvider = async (providerId, setId, data) => {

    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
        fields.push(`${key} = ?`);
        values.push(value);
    }

    if (fields.length === 0) return false;

    const query = `
        UPDATE providers
        SET ${fields.join(', ')}
        WHERE id = ? AND set_id = ?
    `;

    values.push(providerId, setId);

    const [result] = await conn.query(query, values);

    return result.affectedRows > 0;
};

export const deleteProviderById = async (providerId, setId) => {
    const [rows] = await conn.query(`
        DELETE FROM providers
        WHERE id = ?
         AND set_id = ?
        `,
        [providerId, setId]
    )
    return rows.affectedRows > 0;
}

export const getSetByProviderId = async (providerId) => {
    const [rows] = await conn.query(`
        SELECT set_id 
        FROM providers
        WHERE id = ?
        LIMIT 1
        `,
        [providerId]
    )

    return rows;
}

export const getAllProvidersById = async (setId) => {

    const [rows] = await conn.query(`
        SELECT * 
        FROM providers
        WHERE set_id = ?
        `,
        [setId]
    )

    return rows;
}
export const createProvider = async (setId, name, contactName, phone) => {

    const [rows] = await conn.query(`
        INSERT INTO providers   
        (set_id, name, contact_name, phone)
        VALUES
        (?, ?, ?, ?)   
        `,
        [setId, name, contactName, phone]
    )

    return rows.insertId;
}