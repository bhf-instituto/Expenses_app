import conn from '../config/db_connection.config.js';

export const saveRefreshToken = async (userId, token) => {
    await conn.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [userId, token]
    );
};

export const deleteRefreshToken = async (refreshToken) => {
    await conn.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [refreshToken]
    );
};

export const findRefreshToken = async (token) => {
    const [rows] = await dbConnection.query(
        'SELECT user_id FROM refresh_tokens WHERE token = ?',
        [token]
    );
    return rows[0] || null;
};
