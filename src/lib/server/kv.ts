import { db } from './pg';
export const createKV = () => ({
  async get(key: string){
    try{
      const row = await db.prepare('SELECT value FROM kv_store WHERE key=?').bind(key).first<{value:string}>();
      return row?.value?? null;
    }catch{ return null; }
  },
  async put(key: string, value: string){
    await db.prepare('INSERT INTO kv_store (key,value) VALUES (?,?) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value').bind(key,value).run();
  }
});
