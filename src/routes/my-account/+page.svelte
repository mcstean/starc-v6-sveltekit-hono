<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  let data: any = null;
  let phone = '';
  let tab = 'orders';
  const steps = ['PENDING','RESERVED','LOCKED','ORDERED','SHIPPED','ARRIVED'];
  onMount(async () => {
    phone = document.cookie.match(/starc_phone=([^;]+)/)?.[1] ?? '';
    if (!phone) { goto('/login'); return; }
    data = await fetch(`/api/my-orders?phone=${phone}`).then(r => r.json());
  });
  function stepIndex(s: string) { return steps.indexOf(s); }
  async function upload(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f); fd.append('type', 'id'); fd.append('customer_id', String(data.customer?.id));
    await fetch('/api/upload', { method: 'POST', body: fd });
    location.reload();
  }
</script>

{#if data}
<div class="max-w-5xl mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-bold">Mon Compte</h1>
    <div class="text-right">
      <p class="text-sm text-slate-500">KOBO</p>
      <p class="text-2xl font-bold text-brand-accent">{Number(data.wallet?.kobo_balance ?? 0).toFixed(0)}</p>
    </div>
  </div>
  <div class="card mb-6">
    <p><strong>{data.customer?.name || 'Nouveau client'}</strong></p>
    <p class="text-sm">{data.customer?.phone || phone} - {data.customer?.city || ''}</p>
    <p class="mt-2 text-sm">Code parrain: <strong class="text-brand-accent">{data.customer?.referral_code || 'Generez en commandant'}</strong></p>
    <p class="text-xs text-slate-500">Partagez ce code - gagnez 2% KOBO sur chaque filleul.</p>
  </div>
  <div class="flex gap-2 mb-4 flex-wrap">
    {#each [['orders','Commandes'],['receipts','Recus'],['files','Fichiers'],['sourcing','Sourcing']] as [k, l]}
      <button class="btn {tab === k ? 'bg-brand text-white' : 'btn-outline'}" on:click={() => tab = k}>{l}</button>
    {/each}
  </div>
  {#if tab === 'orders'}
    {#if !data.orders?.length}<p class="text-slate-500">Aucune commande.</p>{/if}
    {#each data.orders as o}
      <div class="card mb-3">
        <div class="flex justify-between">
          <p class="font-semibold">{o.receipt_number || '#' + o.id}</p>
          <span class="badge bg-blue-100 text-blue-800">{o.status}</span>
        </div>
        <p class="text-sm text-slate-500">{o.group_title} - Total {Number(o.total_xaf).toLocaleString()} XAF</p>
        <div class="flex justify-between mt-3">
          {#each steps as s, i}
            <div class="flex flex-col items-center flex-1">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs {i <= stepIndex(o.status) ? 'bg-brand-accent text-white' : 'bg-slate-200 text-slate-500'}">{i + 1}</div>
              <p class="text-[10px] mt-1 text-center">{s}</p>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  {/if}
  {#if tab === 'receipts'}
    {#if !data.receipts?.length}<p class="text-slate-500">Aucun recu.</p>{/if}
    {#each data.receipts as r}
      <div class="card mb-2 flex justify-between">
        <span>{r.receipt_number}</span>
        <a href="/receipt/{r.order_id}" class="text-brand-accent text-sm">Voir</a>
      </div>
    {/each}
  {/if}
  {#if tab === 'files'}
    <div class="card mb-3">
      <input type="file" on:change={upload} class="input" />
    </div>
    {#each data.files as f}
      <div class="card mb-2 flex justify-between">
        <span>{f.file_type} - {f.file_url}</span>
        <a href={f.file_url} target="_blank" class="text-brand-accent text-sm">Ouvrir</a>
      </div>
    {/each}
  {/if}
  {#if tab === 'sourcing'}
    <a href="/request-sourcing" class="btn-primary mb-3 inline-block">Nouvelle demande</a>
    {#each data.sourcing as s}
      <div class="card mb-2">
        <p class="font-semibold">{s.product_wanted}</p>
        <p class="text-sm text-slate-500">Statut: {s.status} {s.quoted_price ? `- Devis ${Number(s.quoted_price).toLocaleString()} XAF` : ''}</p>
      </div>
    {/each}
  {/if}
</div>
{/if}
