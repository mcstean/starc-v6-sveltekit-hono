<script lang="ts">
  import { onMount } from 'svelte';

  let allProducts: any[] = [];
  let loading = true;
  let search = '';
  let activeTab: 'all' | 'instock' | 'preorder' = 'all';
  let activeCategory = 'all';
  let sortBy: 'newest' | 'price-asc' | 'price-desc' | 'weight' = 'newest';

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  // Derived
  $: categories = ['all', ...Array.from(new Set(allProducts.map(p => p.category).filter(Boolean)))];
  $: filtered = allProducts
    .filter(p => {
      if (activeTab === 'instock'  && !p.is_instock)  return false;
      if (activeTab === 'preorder' && !p.is_preorder) return false;
      if (activeCategory !== 'all' && p.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.product_name || ''} ${p.description || ''} ${p.category || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc')  return (a.unit_price_xaf || 0) - (b.unit_price_xaf || 0);
      if (sortBy === 'price-desc') return (b.unit_price_xaf || 0) - (a.unit_price_xaf || 0);
      if (sortBy === 'weight')     return (a.weight_kg || 0) - (b.weight_kg || 0);
      return (b.id || 0) - (a.id || 0);
    });

  onMount(async () => {
    try {
      const r = await fetch('/api/products');
      if (r.ok) allProducts = await r.json();
    } catch {}
    loading = false;
  });

  const countFor = (tab: string) => {
    if (tab === 'all') return allProducts.length;
    if (tab === 'instock') return allProducts.filter(p => p.is_instock).length;
    if (tab === 'preorder') return allProducts.filter(p => p.is_preorder).length;
    return 0;
  };
</script>

<svelte:head>
  <title>Boutique — STARC Enterprise</title>
  <meta name="description" content="Boutique STARC Enterprise — Produits disponibles à Douala ou précommandables sur les groupages Njangui." />
</svelte:head>

<!-- ════ Header de page ════ -->
<section class="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-12">
    <div class="flex items-center gap-2 text-xs text-slate-500 mb-3">
      <a href="/" class="hover:text-[#3B9AE1]">Accueil</a>
      <span>/</span>
      <span class="text-slate-900 font-semibold">Boutique</span>
    </div>
    <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Boutique & Opportunités</h1>
    <p class="text-base text-slate-600 mt-2 max-w-2xl">
      Produits disponibles immédiatement au Hub Akwa ou précommandables sur les groupages Njangui en cours.
    </p>
  </div>
</section>

<!-- ════ Tabs INSTOCK / PREORDER ════ -->
<section class="bg-white border-b border-slate-200 sticky top-16 md:top-20 z-30">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex items-center gap-1 overflow-x-auto py-3" style="scrollbar-width:none;">
      <button
        on:click={() => activeTab = 'all'}
        class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all {activeTab === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">
        Tout
        <span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'all' ? 'bg-white/20' : 'bg-slate-200'}">{countFor('all')}</span>
      </button>
      <button
        on:click={() => activeTab = 'instock'}
        class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all {activeTab === 'instock' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        INSTOCK · Akwa
        <span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'instock' ? 'bg-white/20' : 'bg-slate-200'}">{countFor('instock')}</span>
      </button>
      <button
        on:click={() => activeTab = 'preorder'}
        class="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all {activeTab === 'preorder' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}">
        <span>✈</span>
        Précommande Njangui
        <span class="px-1.5 py-0.5 rounded-full text-[10px] {activeTab === 'preorder' ? 'bg-white/20' : 'bg-slate-200'}">{countFor('preorder')}</span>
      </button>
    </div>
  </div>
</section>

<!-- ════ Barre filtres + recherche ════ -->
<section class="bg-white border-b border-slate-200">
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row gap-3 md:items-center">
    <!-- Search -->
    <div class="relative flex-1 max-w-md">
      <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
      <input
        type="text"
        bind:value={search}
        placeholder="Rechercher un produit, une catégorie..."
        class="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-100 text-sm text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1]" />
    </div>

    <!-- Sort -->
    <select bind:value={sortBy} class="px-3 py-2.5 rounded-lg bg-slate-100 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1]">
      <option value="newest">Plus récents</option>
      <option value="price-asc">Prix croissant</option>
      <option value="price-desc">Prix décroissant</option>
      <option value="weight">Plus légers d'abord</option>
    </select>
  </div>
</section>

<!-- ════ Catégories chips ════ -->
{#if categories.length > 2}
  <section class="bg-slate-50 border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center gap-2 overflow-x-auto" style="scrollbar-width:none;">
      <span class="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-500 mr-1">Catégories :</span>
      {#each categories as cat}
        <button
          on:click={() => activeCategory = cat}
          class="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors {activeCategory === cat ? 'bg-[#3B9AE1] text-white' : 'bg-white text-slate-700 border border-slate-200 hover:border-[#3B9AE1]'}">
          {cat === 'all' ? 'Toutes' : cat}
        </button>
      {/each}
    </div>
  </section>
{/if}

<!-- ════ Grille produits ════ -->
<section class="py-8 md:py-12 bg-white">
  <div class="max-w-7xl mx-auto px-4 md:px-6">

    {#if loading}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {#each Array(8) as _}
          <div class="bg-slate-100 rounded-2xl h-80 animate-pulse"></div>
        {/each}
      </div>
    {:else if filtered.length === 0}
      <div class="max-w-md mx-auto text-center py-16">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-3xl text-slate-300">◻</div>
        <h3 class="text-lg font-bold text-slate-900 mb-1">Aucun produit trouvé</h3>
        <p class="text-sm text-slate-500">
          {#if search}
            Aucun résultat pour « {search} ». Essayez un autre terme.
          {:else}
            Cette catégorie est vide pour l'instant.
          {/if}
        </p>
        {#if search || activeCategory !== 'all' || activeTab !== 'all'}
          <button
            on:click={() => { search = ''; activeCategory = 'all'; activeTab = 'all'; }}
            class="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-[#3B9AE1] transition-colors">
            Réinitialiser les filtres
          </button>
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-between mb-5">
        <p class="text-sm text-slate-600">
          <span class="font-bold text-slate-900">{filtered.length}</span>
          {filtered.length > 1 ? 'produits' : 'produit'}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {#each filtered as p (p.id)}
          <a href="/product/{p.id}" class="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all flex flex-col">

            <!-- Image + badges -->
            <div class="relative h-48 bg-slate-100 overflow-hidden">
              {#if p.image_url}
                <img src={p.image_url} alt={p.product_name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
              {:else}
                <div class="w-full h-full flex items-center justify-center text-slate-300 text-5xl">◻</div>
              {/if}

              <!-- Stock badge -->
              {#if p.is_instock}
                <span class="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                  <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  INSTOCK
                </span>
              {:else if p.is_preorder}
                <span class="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                  Précommande
                </span>
              {/if}

              <!-- CBM badge -->
              {#if p.cbm}
                <span class="absolute bottom-3 right-3 px-2 py-1 rounded bg-slate-900/80 backdrop-blur text-white text-[10px] font-bold">
                  CBM {p.cbm}
                </span>
              {/if}
            </div>

            <!-- Content -->
            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                {#if p.category}
                  <span class="text-[10px] font-bold uppercase tracking-wider text-[#3B9AE1]">{p.category}</span>
                {/if}
                <h3 class="text-sm font-bold text-slate-900 leading-snug line-clamp-2 mt-1 mb-2 min-h-[2.5rem]">
                  {p.product_name}
                </h3>

                <!-- Specs grid -->
                <div class="grid grid-cols-3 gap-1 mb-3 text-center">
                  <div class="bg-slate-50 rounded-md py-1.5">
                    <span class="block text-[9px] text-slate-500 uppercase font-semibold">Poids</span>
                    <span class="block text-[11px] font-bold text-slate-800">{p.weight_kg || '—'} kg</span>
                  </div>
                  <div class="bg-slate-50 rounded-md py-1.5">
                    <span class="block text-[9px] text-slate-500 uppercase font-semibold">Dim</span>
                    <span class="block text-[11px] font-bold text-slate-800">
                      {#if p.length_cm}{p.length_cm}×{p.width_cm}×{p.height_cm}{:else}—{/if}
                    </span>
                  </div>
                  <div class="bg-slate-50 rounded-md py-1.5">
                    <span class="block text-[9px] text-slate-500 uppercase font-semibold">Stock</span>
                    <span class="block text-[11px] font-bold {p.is_instock ? 'text-emerald-600' : 'text-amber-600'}">
                      {#if p.is_instock}{p.stock_qty ?? 0}{:else}—{/if}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Price + CTA -->
              <div class="pt-3 border-t border-slate-100">
                <div class="flex items-baseline justify-between mb-2">
                  <span class="text-[10px] text-slate-500 font-semibold uppercase">Prix revendeur</span>
                  <span class="text-lg font-black text-[#3B9AE1]">{formatXAF(p.unit_price_xaf)}<span class="text-[10px] text-slate-500 font-bold ml-1">XAF</span></span>
                </div>
                <div class="w-full py-2 rounded-lg bg-slate-900 group-hover:bg-[#3B9AE1] text-white text-center text-xs font-bold transition-colors">
                  {p.is_instock ? 'Réserver au Hub' : 'Précommander'}
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

  </div>
</section>

<!-- ════ CTA bas de page ════ -->
<section class="py-12 md:py-16 bg-slate-50 border-t border-slate-200">
  <div class="max-w-3xl mx-auto px-4 md:px-6 text-center">
    <h3 class="text-2xl md:text-3xl font-black text-slate-900 mb-3">
      Vous ne trouvez pas ce que vous cherchez ?
    </h3>
    <p class="text-sm md:text-base text-slate-600 mb-6">
      Dites-nous ce que vous voulez importer. Nous cherchons le fournisseur, groupons le fret, et vous livre au Hub Akwa.
    </p>
    <div class="flex flex-col sm:flex-row gap-3 justify-center">
      <a href="/request-sourcing" class="px-6 py-3 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] text-white font-bold text-sm transition-colors">
        Demander un sourcing
      </a>
      <a href="https://wa.me/237600000000?text=Bonjour%20STARC%2C%20je%20cherche%20un%20produit%20sp%C3%A9cifique" target="_blank" rel="noopener" class="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-sm transition-colors flex items-center justify-center gap-2">
        💬 Discuter sur WhatsApp
      </a>
    </div>
  </div>
</section>
