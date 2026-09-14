import QRCode from 'qrcode';
export async function makeQR(text: string): Promise<string> {
  return await QRCode.toDataURL(text, { width: 300, margin: 1 });
}
