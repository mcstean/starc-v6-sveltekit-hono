<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { addToCart } from '$lib/stores';
  let group: any = null;
  let products: any[] = [];
  onMount(async () => {
    const gs = await fetch('/api/groups').then(r => r.json());
    group = gs.find((g: any) => String(g.id) === $page.params.id);
    products = await fetch(`/api/groups/${$page.params.id}/products`).then(r => r.json());
  });
  function add(p: any) {
    addToCart({ product_id: p.id, name: p.product_name, price: p.unit_price_xaf, qty: 1, weight_kg: p.weight_kg, cbm: 0, image_url: p.image_url, group_id: p.group_id, is_preorder: true });
  }
</script>

{#if group}
<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold">{group.title}</h1>
  <p class="text-slate-600">{group.origin_country} - {group.shipping_mode} - Cloture {group.closing_date}</p>
  <div class="grid md:grid-cols-3 lg:grid-cols-4 gap-6 mt-6">
    {#each products as p}
      <div class="card">
        <h3 class="font-semibold">{p.product_name}</h3>
        <p class="text-brand-accent font-bold mt-1">{Number(p.unit_price_xaf).toLocaleString()} XAF</p>
        <p class="text-xs text-slate-500">{p.weight_kg}kg</p>
        <div class="h-2 bg-slate-200 rounded mt-2 overflow-hidden">
          <div class="h-full bg-brand-accent" style="width: {Math.min(100, (p.moq_current / Math.max(1,p.moq_needed)) * 100)}%"></div>
        </div>
        <p class="text-xs mt-1">MOQ {p.moq_current}/{p.moq_needed}</p>
        <button class="btn-primary w-full mt-3" on:click={() => add(p)}>Ajouter</button>
      </div>
    {/each}
  </div>
</div>
{/if}
