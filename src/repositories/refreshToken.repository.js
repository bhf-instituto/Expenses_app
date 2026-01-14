import conn from '../config/db_connection.config.js';

// export const saveRefreshToken = async (userId, token) => {
//     await conn.query(
//         `INSERT INTO refresh_tokens (user_id, hashed_token, expires_at)
//          VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
//         [userId, token]
//     );
// };

export const deleteRefreshToken = async (refreshToken) => {
    await conn.query(
        'DELETE FROM refresh_tokens WHERE hashed_token = ?',
        [refreshToken]
    );
};

export const deleteRefreshTokenByUserId = async (userId) => {
        await conn.query(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [userId]
    );
}

export const findRefreshToken = async (token) => {
    const [rows] = await dbConnection.query(
        'SELECT user_id FROM refresh_tokens WHERE hashed_token = ?',
        [token]
    );
    return rows[0] || null;
};


export const saveOrUpdateRefreshToken = async (userId, token) => {
    await conn.query(
        `
        INSERT INTO refresh_tokens (user_id, hashed_token, expires_at)
        VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
        ON DUPLICATE KEY UPDATE
            hashed_token = VALUES(hashed_token),
            expires_at = VALUES(expires_at),
            created_at = CURRENT_TIMESTAMP
        `,
        [userId, token]
    );    
};

export const findRefreshTokenByUserId = async (userId) => {
    const [rows] = await conn.query(
        'SELECT hashed_token FROM refresh_tokens WHERE user_id = ? LIMIT 1',
        [userId]
    );
    return rows[0] || null;
};