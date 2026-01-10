import conn from '../config/db_connection.config.js';


export const findUserByEmail = async (email) => {
    const [rows] = await conn.query(
        'SELECT id, email, password_hash FROM users WHERE email = ?',
        [email]
    );
    return rows;
};

export const createUser = async (email, passwordHash) => {
    const [result] = await conn.query(
        'INSERT INTO users (email, password_hash) VALUES (?, ?)',
        [email, passwordHash]
    );
    return result.insertId;
}