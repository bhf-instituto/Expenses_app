import conn from "../config/db_connection.config.js"

export const findGroupUser = async (groupId, userId) => {

    const [result] = await conn.query(`SELECT 1 
            FROM set_users
            WHERE set_id = ? AND user_id = ?`,
        [groupId, userId]
    )

    return result;
}

export const checkCreatedSet = async (userId, setName) => {

     const [result] = await conn.query(`
        SELECT s.id, s.name
        FROM sets s
        JOIN set_users su ON su.set_id = s.id
        WHERE su.user_id = ? AND su.role = 1 AND s.name = ?`,
        [userId, setName]
    )
    
    return result > 0;
}

export const checkParticipantSet = async (userId, setName) => {

     const [result] = await conn.query(`
        SELECT s.id, s.name
        FROM sets s
        JOIN set_users su ON su.set_id = s.id
        WHERE su.user_id = ? AND s.name = ?`,
        [userId, setName]
    )
    
    return result > 0;
}


export const findSetsCreated = async (userId, setName) => {

     const [result] = await conn.query(`
        SELECT s.id, s.name
        FROM sets s
        JOIN set_users su ON su.set_id = s.id
        WHERE su.user_id = ? AND su.role = 1 AND s.name = ?`,
        [userId, setName]
    )
    
    return result;
}


//////////////////

export const getUserRoleInSet = async (userId, setName) => {
    // Query para buscar el rol del usuario en el set por nombre
    const [rows] = await conn.query(`
        SELECT su.role
        FROM set_users su
        JOIN sets s ON su.set_id = s.id
        WHERE su.user_id = ? AND s.name = ?
        LIMIT 1
    `, [userId, setName]);

    // Si no hay filas, el usuario no pertenece al grupo
    if (rows.length === 0) {
        return {
            admin: false,
            participant: false
        };
    }

    const role = rows[0].role;

    return {
        admin: role === 1,
        participant: role === 0
    };
};