
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "finance_manager",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4",
    timezone: "Z",

    decimalNumbers: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
});

module.exports = pool;
