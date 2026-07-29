import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

pool.connect().then((client) => {
  console.log("Connected to PostgreSQL database");
  client.release();
}).catch((err) => {
  console.error("Failed to connect to database:", err.message);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development" && duration > 100) {
    console.log("Executed query", { text: text.substring(0, 80), duration, rows: res.rowCount });
  }
  return res;
};

export const getOne = async (text: string, params?: any[]) => {
  const res = await query(text, params);
  return res.rows[0] || null;
};

export const getMany = async (text: string, params?: any[]) => {
  const res = await query(text, params);
  return res.rows;
};

export default pool;
