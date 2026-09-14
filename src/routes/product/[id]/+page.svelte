<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { addToCart } from '$lib/stores';
  let p: any = null;
  let qty = 1;
  let group: any = null;
  onMount(async () => {
    p = await fetch(`/api/products/${$page.params.id}`).then(r => r.json());
    if (p.group_id) {
      const gs = await fetch('/api/groups').then(r => r.json());
      group = gs.find((g: any) => g.id === p.group_id);
    }
  });
  function cbm() { return p ? ((p.length_cm * p.width_cm * p.height_cm) / 1_000_000).toFixed(4) : '0'; }
  function shippingEst() { return p ? Math.round(p.weight_kg * 2500 * qty) : 0; }
  function customsEst() { return p ? Math.round(p.unit_price_xaf * qty * 0.32) : 0; }
  function totalEst() { return p ? (p.unit_price_xaf * qty + shippingEst() + customsEst()) : 0; }
  function add() {
    addToCart({ product_id: p.id, name: p.product_name, price: p.unit_price_xaf, qty, weight_kg: p.weight_kg, cbm: Number(cbm()), image_url: p.image_url, group_id: p.group_id, is_preorder: !!p.is_preorder });
    location.href = '/checkout';
  }
</script>

{#if p}
<div class="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
  <div class="aspect-square bg-slate-100 rounded-xl flex items-center justify-center">
    {#if p.image_url}<img src={p.image_url} alt={p.product_name} class="w-full h-full object-cover rounded-xl" />{:else}Image{/if}
  </div>
  <div>
    <h1 class="text-3xl font-bold">{p.product_name}</h1>
    <p class="text-slate-500">SKU: {p.sku}</p>
    <p class="text-3xl font-bold text-brand-accent my-4">{Number(p.unit_price_xaf).toLocaleString()} XAF</p>
    <p class="text-slate-700 mb-4">{p.description}</p>
    <div class="card mb-4">
      <h3 class="font-semibold mb-2">Specifications</h3>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <p>Poids: <strong>{p.weight_kg} kg</strong></p>
        <p>CBM: <strong>{cbm()}</strong></p>
        <p>Dimensions: {p.length_cm}x{p.width_cm}x{p.height_cm} cm</p>
        <p>Douane: {p.customs_rate}%</p>
      </div>
    </div>
    <div class="card mb-4">
      <h3 class="font-semibold mb-2">Estimation</h3>
      <div class="flex items-center gap-3 mb-3">
        <label class="label mb-0">Quantite</label>
        <input type="number" min="1" class="input max-w-24" bind:value={qty} />
      </div>
      <div class="text-sm space-y-1">
        <p>Produit: <strong>{(p.unit_price_xaf * qty).toLocaleString()} XAF</strong></p>
        <p>Fret: <strong>{shippingEst().toLocaleString()} XAF</strong></p>
        <p>Douane: <strong>{customsEst().toLocaleString()} XAF</strong></p>
        <p class="text-lg pt-2 border-t">Total estime: <strong class="text-brand-accent">{totalEst().toLocaleString()} XAF</strong></p>
      </div>
    </div>
    {#if group}
      <div class="card mb-4 bg-blue-50">
        <h3 class="font-semibold">Groupe: {group.title}</h3>
        <p class="text-sm">Origine: {group.origin_country} - {group.shipping_mode}</p>
        <p class="text-sm">ETA: {group.eta_date}</p>
      </div>
    {/if}
    <button class="btn-accent w-full text-lg py-3" on:click={add}>Ajouter au panier</button>
  </div>
</div>
{/if}
