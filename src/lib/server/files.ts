import fs from 'fs/promises';
import path from 'path';
const DIR = '/tmp/uploads';
export const createFiles = () => ({
  async put(key: string, stream: any){
    const full = path.join(DIR, key);
    await fs.mkdir(path.dirname(full), {recursive:true});
    let buf: Buffer;
    if(stream?.getReader){
      const reader = stream.getReader(); const chunks: Uint8Array[]=[];
      while(true){ const {done,value}=await reader.read(); if(done)break; if(value)chunks.push(value); }
      buf = Buffer.concat(chunks);
    } else if(stream?.arrayBuffer){
      buf = Buffer.from(await stream.arrayBuffer());
    } else {
      buf = Buffer.from(stream as any);
    }
    await fs.writeFile(full, buf);
  },
  async get(key: string){
    const full = path.join(DIR, key);
    try{
      const data = await fs.readFile(full);
      return { body: data, httpMetadata: { contentType: 'application/octet-stream' } };
    }catch{ return null; }
  }
});
