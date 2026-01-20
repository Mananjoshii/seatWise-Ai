const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_SSL === "true"
    ? { rejectUnauthorized: true }
    : false,
});

// ✅ CORRECT WAY: use promise wrapper
const promisePool = pool.promise();

// ✅ Non-blocking DB test
promisePool
  .getConnection()
  .then(conn => {
    console.log("✅ Database connected");
    conn.release();
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = promisePool;
