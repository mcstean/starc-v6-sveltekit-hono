import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway')? { rejectUnauthorized: false } : false
});

function toPG(sql: string): string {
  let s = sql.replace(/datetime\('now'\)/gi, 'NOW()');
  let i = 0;
  s = s.replace(/\?/g, () => `$${++i}`);
  return s;
}

class Prepared {
  sql: string; params: any[] = [];
  constructor(sql: string){ this.sql = sql; }
  bind(...p: any[]){ this.params = p; return this; }
  async first<T>(): Promise<T | null> {
    const r = await pool.query(toPG(this.sql), this.params);
    return (r.rows[0] as T)?? null;
  }
  async all<T>(): Promise<{ results: T[] }> {
    const r = await pool.query(toPG(this.sql), this.params);
    return { results: r.rows as T[] };
  }
  async run(){
    let sql = toPG(this.sql);
    if (/^\s*INSERT/i.test(sql) &&!/RETURNING/i.test(sql)) sql += ' RETURNING id';
    const r = await pool.query(sql, this.params);
    return { meta: { last_row_id: r.rows?.[0]?.id?? null }, success: true };
  }
}

export const db = { prepare: (sql: string) => new Prepared(sql), _pool: pool };
export const createDb = () => db;
