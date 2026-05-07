import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.DATABASE_URL?.includes("neon.tech") || process.env.NODE_ENV === "production") 
    ? { rejectUnauthorized: false } 
    : false,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  // Do not process.exit(-1) on Vercel
});

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL Connected");
    client.release();
  } catch (err) {
    console.error("Error connecting to PostgreSQL:", err.message);
  }
};

export default pool;
