import conn from '../config/db_connection.config.js';

export const getColorProfileByUserId = async (userId) => {
    const [rows] = await conn.query(
        `
            SELECT user_id, settings_json, updated_at
            FROM user_color_profiles
            WHERE user_id = ?
            LIMIT 1
        `,
        [userId]
    );
    return rows[0] || null;
};

export const upsertColorProfileByUserId = async (userId, settingsJson) => {
    await conn.query(
        `
            INSERT INTO user_color_profiles (user_id, settings_json)
            VALUES (?, CAST(? AS JSON))
            ON DUPLICATE KEY UPDATE
                settings_json = VALUES(settings_json),
                updated_at = CURRENT_TIMESTAMP
        `,
        [userId, settingsJson]
    );
};
