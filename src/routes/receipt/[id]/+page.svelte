<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { downloadReceipt, buildReceiptPDF } from '$lib/pdf';
  import { makeQR } from '$lib/qr';
  let order: any = null;
  let receipt: any = null;
  let qrUrl = '';
  onMount(async () => {
    const id = $page.params.id;
    order = await fetch(`/api/orders/${id}`).then(r => r.json());
    receipt = await fetch(`/api/receipt/${id}`).then(r => r.json());
    if (receipt?.receipt_number) qrUrl = await makeQR(`https://starc.cm/receipt/${id}?n=${receipt.receipt_number}`);
  });
  function payload() {
    if (!receipt) return null;
    let items: any[] = [];
    try { items = JSON.parse(receipt.items_json || '[]'); } catch {}
    return {
      receipt_number: receipt.receipt_number,
      customer_name: order?.customer_name ?? '',
      customer_phone: order?.customer_phone ?? '',
      items: items.map(i => ({ name: i.name, qty: i.qty, unit: i.unit, total: i.total })),
      subtotal: receipt.subtotal, shipping_total: receipt.shipping_total,
      customs_total: receipt.customs_total, insurance_total: receipt.insurance_total,
      delivery_total: receipt.delivery_total, total_xaf: receipt.total_xaf,
      paid_xaf: receipt.paid_xaf, remaining_xaf: receipt.remaining_xaf,
      payment_method: receipt.payment_method, qr_data_url: qrUrl,
      created_at: receipt.created_at
    };
  }
  function pdf() { const p = payload(); if (p) downloadReceipt(p); }
  function preview() { const p = payload(); if (p) window.open(buildReceiptPDF(p).output('bloburl')); }
</script>

{#if receipt}
<div class="max-w-3xl mx-auto px-4 py-10">
  <div class="card">
    <div class="bg-brand text-white -m-5 mb-5 p-5 rounded-t-xl">
      <h1 class="text-2xl font-bold">STARC.CM</h1>
      <p class="text-sm text-slate-300">Recu {receipt.receipt_number}</p>
    </div>
    <p><strong>Client:</strong> {order?.customer_name} ({order?.customer_phone})</p>
    <p><strong>Total:</strong> {Number(receipt.total_xaf).toLocaleString()} XAF</p>
    <p><strong>Paye:</strong> {Number(receipt.paid_xaf).toLocaleString()} XAF</p>
    <p><strong>Reste:</strong> {Number(receipt.remaining_xaf).toLocaleString()} XAF</p>
    {#if qrUrl}<img src={qrUrl} alt="QR" class="w-40 h-40 my-4" />{/if}
    <div class="flex gap-3 mt-4">
      <button class="btn-primary" on:click={preview}>Apercu PDF</button>
      <button class="btn-accent" on:click={pdf}>Telecharger PDF</button>
    </div>
    <a href="/my-account" class="block mt-4 text-brand-accent text-sm">Voir mon compte</a>
  </div>
</div>
{:else}
<div class="max-w-3xl mx-auto px-4 py-10"><p>Recu introuvable.</p></div>
{/if}
