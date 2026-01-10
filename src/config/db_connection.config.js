import { createPool } from 'mysql2/promise'
import { configDotenv } from "dotenv";

configDotenv();

const DBConnection = createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: {
        rejectUnauthorized: false
    }
})


export default DBConnection;