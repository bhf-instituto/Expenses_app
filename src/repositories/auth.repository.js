import conn from '../config/db_connection.config.js';

export const findUserByEmail = async (email) => {
    const [rows] = await conn.query(
        'SELECT id, email, password_hash FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0];
};

export const userExistsByEmail = async (email) => {
    const [rows] = await conn.query(
        'SELECT id FROM users WHERE email = ? LIMIT 1',
        [email]
    );
    return rows[0];
};

export const createUser = async (email, passwordHash) => {
    const [result] = await conn.query(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash]
    );
    return result.insertId;
};


