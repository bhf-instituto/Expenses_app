import conn from "../config/db_connection.config.js"

export const dbStatus = async () => {
    try {
        const [rows] = await conn.query('SELECT 1');
        return rows.length > 0;
    } catch (error) {
        console.error('DB check failed:', error);
        return false;
    }
}