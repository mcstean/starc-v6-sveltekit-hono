<script lang="ts">
  import { onMount } from 'svelte';
  let form = { product_wanted: '', description: '', budget: 0 };
  let files: string[] = [];
  let sent = false;
  let phone = '';
  onMount(() => { phone = document.cookie.match(/starc_phone=([^;]+)/)?.[1] ?? ''; });
  async function up(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f); fd.append('type', 'temp');
    const r = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
    files = [...files, r.url];
  }
  async function submit(e: Event) {
    e.preventDefault();
    await fetch('/api/sourcing-request', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, customer_phone: phone, files })
    });
    sent = true;
  }
</script>

<div class="max-w-2xl mx-auto px-4 py-10">
  <h1 class="text-3xl font-bold mb-6">Demande de sourcing</h1>
  {#if sent}
    <div class="card bg-green-50 text-center">
      <p class="font-semibold text-green-800">Demande envoyee ! Nous vous repondons bientot.</p>
    </div>
  {:else}
    <form on:submit={submit} class="card grid gap-3">
      <input class="input" placeholder="Telephone" bind:value={phone} required />
      <input class="input" placeholder="Produit recherche" bind:value={form.product_wanted} required />
      <textarea class="input" rows="4" placeholder="Description detaillee" bind:value={form.description}></textarea>
      <input type="number" class="input" placeholder="Budget (XAF)" bind:value={form.budget} />
      <input type="file" class="input" on:change={up} />
      {#if files.length}<p class="text-sm text-slate-500">{files.length} fichier(s)</p>{/if}
      <button class="btn-accent">Envoyer</button>
    </form>
  {/if}
</div>
