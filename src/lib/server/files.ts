export const createFiles = (bindings: Record<string, any> = {}) => {
  const bucket = bindings.UPLOADS;
  const toArrayBuffer = async (stream: any): Promise<ArrayBuffer> => {
    if (stream?.arrayBuffer) return await stream.arrayBuffer();
    if (stream?.getReader) {
      const reader = stream.getReader();
      const chunks: Uint8Array[] = [];
      while (true) { const { done, value } = await reader.read(); if (done) break; if (value) chunks.push(value); }
      const total = chunks.reduce((n, c) => n + c.byteLength, 0);
      const merged = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { merged.set(c, off); off += c.byteLength; }
      return merged.buffer;
    }
    return stream as ArrayBuffer;
  };
  return {
    async put(key: string, stream: any) { if (!bucket) return; const buf = await toArrayBuffer(stream); await bucket.put(key, buf); },
    async get(key: string) { if (!bucket) return null; const obj = await bucket.get(key); if (!obj) return null; return { body: obj.body, httpMetadata: obj.httpMetadata }; }
  };
};
