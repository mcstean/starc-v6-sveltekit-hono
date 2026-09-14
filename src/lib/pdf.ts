import jsPDF from 'jspdf';

export type ReceiptData = {
  receipt_number: string; customer_name: string; customer_phone: string;
  items: Array<{ name: string; qty: number; unit: number; total: number }>;
  subtotal: number; shipping_total: number; customs_total: number;
  insurance_total: number; delivery_total: number; total_xaf: number;
  paid_xaf: number; remaining_xaf: number; payment_method: string;
  qr_data_url?: string; created_at?: string;
};

export function buildReceiptPDF(d: ReceiptData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 90, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22); doc.text('STARC.CM', 40, 45);
  doc.setFontSize(10); doc.text('NJANGUI - KOBO - NGOMA KOBO', 40, 65);
  doc.text('Douala, Cameroun', 40, 78);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14); doc.text('RECU / RECEIPT', 40, 130);
  doc.setFontSize(10);
  doc.text(`N: ${d.receipt_number}`, 40, 150);
  doc.text(`Date: ${d.created_at || new Date().toISOString()}`, 40, 165);
  doc.text(`Client: ${d.customer_name}`, 40, 180);
  doc.text(`Tel: ${d.customer_phone}`, 40, 195);
  let y = 230;
  doc.setFontSize(11); doc.text('Articles', 40, y); y += 15;
  doc.line(40, y, W - 40, y); y += 15;
  doc.setFontSize(9);
  for (const it of d.items) {
    doc.text(`${it.name}`, 40, y);
    doc.text(`${it.qty} x ${it.unit.toLocaleString()}`, 320, y);
    doc.text(`${it.total.toLocaleString()} XAF`, 440, y);
    y += 15;
    if (y > 700) { doc.addPage(); y = 60; }
  }
  y += 10; doc.line(40, y, W - 40, y); y += 20;
  const rows: [string, number][] = [
    ['Sous-total', d.subtotal], ['Fret', d.shipping_total],
    ['Douane', d.customs_total], ['Assurance', d.insurance_total],
    ['Livraison', d.delivery_total]
  ];
  for (const [l, v] of rows) {
    doc.text(l, 300, y); doc.text(`${v.toLocaleString()} XAF`, 440, y); y += 15;
  }
  doc.setFontSize(12);
  doc.text('TOTAL', 300, y + 5);
  doc.text(`${d.total_xaf.toLocaleString()} XAF`, 440, y + 5);
  y += 25; doc.setFontSize(10);
  doc.text(`Paye: ${d.paid_xaf.toLocaleString()} XAF`, 300, y); y += 15;
  doc.text(`Reste: ${d.remaining_xaf.toLocaleString()} XAF`, 300, y); y += 15;
  doc.text(`Mode: ${d.payment_method}`, 300, y);
  if (d.qr_data_url) doc.addImage(d.qr_data_url, 'PNG', 40, 240, 130, 130);
  doc.setFontSize(8); doc.text('Merci - STARC.CM', 40, 800);
  return doc;
}

export function downloadReceipt(d: ReceiptData) { buildReceiptPDF(d).save(`${d.receipt_number}.pdf`); }
