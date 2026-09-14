<script lang="ts">
  import { onMount } from 'svelte';
  import { addToCart } from '$lib/stores';
  let filter = 'ALL';
  let search = '';
  let products: any[] = [];
  let loading = false;
  async function load() {
    loading = true;
    products = await fetch(`/api/products?filter=${filter}&search=${encodeURIComponent(search)}`).then(r => r.json());
    loading = false;
  }
  onMount(load);
  $: if (filter || search) load();
  function cbm(p: any) { return ((p.length_cm * p.width_cm * p.height_cm) / 1_000_000).toFixed(4); }
  function add(p: any) {
    addToCart({ product_id: p.id, name: p.product_name, price: p.unit_price_xaf, qty: 1, weight_kg: p.weight_kg, cbm: Number(cbm(p)), image_url: p.image_url, group_id: p.group_id, is_preorder: !!p.is_preorder });
  }
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Boutique</h1>
  <div class="flex flex-wrap gap-2 mb-6">
    {#each ['ALL','INSTOCK','PREORDER'] as f}
      <button class="btn {filter === f ? 'bg-brand text-white' : 'btn-outline'}" on:click={() => filter = f}>{f}</button>
    {/each}
    <input class="input max-w-xs" placeholder="Rechercher..." bind:value={search} />
  </div>
  {#if loading}<p>Chargement...</p>{:else}
    <div class="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
      {#each products as p}
        <div class="card flex flex-col">
          <div class="aspect-square bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-400">
            {#if p.image_url}<img src={p.image_url} alt={p.product_name} class="w-full h-full object-cover rounded-lg" />{:else}Image{/if}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-1 mb-1">
              {#if p.is_instock}<span class="badge bg-green-100 text-green-800">INSTOCK</span>{/if}
              {#if p.is_preorder}<span class="badge bg-blue-100 text-blue-800">PREORDER</span>{/if}
            </div>
            <h3 class="font-semibold">{p.product_name}</h3>
            <p class="text-xs text-slate-500">SKU: {p.sku}</p>
            <p class="text-lg font-bold text-brand-accent mt-2">{Number(p.unit_price_xaf).toLocaleString()} XAF</p>
            <p class="text-xs text-slate-500 mt-1">Poids {p.weight_kg}kg - CBM {cbm(p)}</p>
            {#if p.is_preorder && p.moq_needed > 0}
              <div class="mt-2">
                <div class="h-2 bg-slate-200 rounded overflow-hidden">
                  <div class="h-full bg-brand-accent" style="width: {Math.min(100, (p.moq_current / p.moq_needed) * 100)}%"></div>
                </div>
                <p class="text-xs text-slate-500 mt-1">MOQ {p.moq_current}/{p.moq_needed}</p>
              </div>
            {/if}
          </div>
          <div class="flex gap-2 mt-3">
            <a href="/product/{p.id}" class="btn-outline flex-1">Details</a>
            <button class="btn-primary flex-1" on:click={() => add(p)}>Ajouter</button>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
