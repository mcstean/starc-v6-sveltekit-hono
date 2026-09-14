import pg from 'pg';
import fs from 'fs';
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
const sql = fs.readFileSync('migrations_pg.sql','utf8');
await pool.query(sql);
console.log('MIGRATED OK');
await pool.end();
