require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT, 10),
  ssl: {
    rejectUnauthorized: false, // required for Neon or Heroku
  },
});

pool.connect()
  .then(() => console.log("✅ Connected to DB"))
  .catch((err) => console.error("❌ DB connection error:", err));

module.exports = pool;
