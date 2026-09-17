<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { addToCart } from '$lib/stores';
  import { goto } from '$app/navigation';

  let product: any = null;
  let related: any[] = [];
  let loading = true;
  let error = '';
  let qty = 1;
  let activeImg = 0;
  let addedFeedback = false;

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  $: productId = $page.params.id;
  $: images = product
    ? [product.image_url, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean)
    : [];
  $: hasDiscount = product?.discount_price_xaf && product.discount_price_xaf < product.unit_price_xaf;
  $: finalPrice = hasDiscount ? product.discount_price_xaf : product?.unit_price_xaf;
  $: discountPct = hasDiscount
    ? Math.round(((product.unit_price_xaf - product.discount_price_xaf) / product.unit_price_xaf) * 100)
    : 0;
  $: inStock = product?.is_instock && (product?.stock_qty ?? 0) > 0;

  onMount(async () => {
    try {
      const r = await fetch(`/api/products/${productId}`);
      if (r.ok) {
        product = await r.json();
        if (product?.category) {
          const r2 = await fetch('/api/products');
          if (r2.ok) {
            const all = await r2.json();
            related = all.filter((p: any) => p.id !== product.id && p.category === product.category).slice(0, 4);
          }
        }
      } else {
        error = 'Produit introuvable';
      }
    } catch {
      error = 'Erreur de chargement';
    }
    loading = false;
  });

  function handleAddToCart() {
    addToCart(product, qty);
    addedFeedback = true;
    setTimeout(() => (addedFeedback = false), 2000);
  }

  function buyNow() {
    addToCart(product, qty);
    setTimeout(() => goto('/checkout'), 300);
  }
</script>

<svelte:head>
  {#if product}
    <title>{product.product_name} — STARC Enterprise</title>
    <meta name="description" content={product.description || product.product_name} />
  {/if}
</svelte:head>

{#if loading}
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-12">
    <div class="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div class="bg-slate-100 rounded-2xl h-96"></div>
      <div class="space-y-4">
        <div class="bg-slate-100 rounded h-6 w-1/3"></div>
        <div class="bg-slate-100 rounded h-10 w-full"></div>
        <div class="bg-slate-100 rounded h-24 w-full"></div>
        <div class="bg-slate-100 rounded h-12 w-1/2"></div>
      </div>
    </div>
  </div>
{:else if error}
  <div class="max-w-2xl mx-auto px-4 py-24 text-center">
    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-3xl text-red-400">✕</div>
    <h1 class="text-2xl font-black text-slate-900 mb-2">Produit introuvable</h1>
    <p class="text-sm text-slate-500 mb-6">Ce produit n'existe pas ou a été retiré.</p>
    <a href="/shop" class="inline-block px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#3B9AE1] text-white font-bold text-sm transition-colors">
      Retour à la boutique
    </a>
  </div>
{:else if product}
  <!-- Breadcrumb -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 text-xs text-slate-500">
      <a href="/" class="hover:text-[#3B9AE1]">Accueil</a>
      <span class="mx-1">/</span>
      <a href="/shop" class="hover:text-[#3B9AE1]">Boutique</a>
      {#if product.category}
        <span class="mx-1">/</span>
        <a href="/shop?cat={product.category}" class="hover:text-[#3B9AE1]">{product.category}</a>
      {/if}
      <span class="mx-1">/</span>
      <span class="text-slate-900 font-semibold truncate">{product.product_name}</span>
    </div>
  </div>

  <!-- Main content -->
  <section class="py-8 md:py-12 bg-white">
    <div class="max-w-7xl mx-auto px-4 md:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">

        <!-- Galerie -->
        <div>
          <div class="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative">
            {#if images.length > 0}
              <img src={images[activeImg]} alt={product.product_name} class="w-full h-full object-cover">
            {:else}
              <div class="w-full h-full flex items-center justify-center text-slate-300 text-6xl">◻</div>
            {/if}

            {#if inStock}
              <span class="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                INSTOCK · Dispo Douala
              </span>
            {:else if product.is_preorder}
              <span class="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-lg">
                Précommande Njangui
              </span>
            {/if}

            {#if hasDiscount}
              <span class="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-red-500 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                -{discountPct}%
              </span>
            {/if}
          </div>

          {#if images.length > 1}
            <div class="flex gap-2 mt-3 overflow-x-auto" style="scrollbar-width:none;">
              {#each images as img, i}
                <button on:click={() => activeImg = i}
                  class="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all {activeImg === i ? 'border-[#3B9AE1]' : 'border-slate-200 hover:border-slate-400'}">
                  <img src={img} alt="" class="w-full h-full object-cover">
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Infos produit -->
        <div>
          {#if product.category}
            <span class="inline-block text-[11px] font-bold uppercase tracking-wider text-[#3B9AE1] mb-2">
              {product.category}{#if product.brand} · {product.brand}{/if}
            </span>
          {/if}

          <h1 class="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-3">
            {product.product_name}
          </h1>

          <div class="flex items-center gap-3 text-xs text-slate-500 mb-5">
            {#if product.sku}<span>Réf. {product.sku}</span>{/if}
            {#if product.origin_country}<span>·</span><span>Origine {product.origin_country}</span>{/if}
            {#if product.views}<span>·</span><span>{product.views} vues</span>{/if}
          </div>

          <!-- Prix -->
          <div class="bg-slate-50 rounded-2xl p-5 mb-5">
            <div class="flex items-baseline gap-3 mb-1">
              <span class="text-3xl md:text-4xl font-black text-[#3B9AE1]">{formatXAF(finalPrice)}</span>
              <span class="text-sm font-bold text-slate-500">XAF</span>
              {#if hasDiscount}
                <span class="text-lg font-bold text-slate-400 line-through">{formatXAF(product.unit_price_xaf)}</span>
              {/if}
            </div>
            <p class="text-[11px] text-slate-500">
              Douane {product.customs_rate || 32}% indicative incluse
            </p>
          </div>

          <!-- Stock status -->
          <div class="flex items-center gap-3 mb-5 text-sm">
            {#if inStock}
              <span class="flex items-center gap-1.5 text-emerald-700 font-bold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                En stock · {product.stock_qty} unités au Hub Akwa
              </span>
            {:else if product.is_preorder}
              <span class="flex items-center gap-1.5 text-amber-700 font-bold">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                Précommande · Groupage Njangui
              </span>
            {:else}
              <span class="flex items-center gap-1.5 text-slate-500 font-bold">
                <span class="w-2 h-2 rounded-full bg-slate-400"></span>
                Rupture de stock
              </span>
            {/if}
          </div>

          <!-- Specs grid -->
          <div class="grid grid-cols-2 gap-3 mb-6">
            <div class="bg-white border border-slate-200 rounded-xl p-3">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Poids net</span>
              <span class="block text-sm font-black text-slate-900 mt-0.5">{product.weight_kg || '—'} kg</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-xl p-3">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Dimensions</span>
              <span class="block text-sm font-black text-slate-900 mt-0.5">
                {#if product.length_cm}{product.length_cm}×{product.width_cm}×{product.height_cm} cm{:else}—{/if}
              </span>
            </div>
            <div class="bg-white border border-slate-200 rounded-xl p-3">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Volume</span>
              <span class="block text-sm font-black text-slate-900 mt-0.5">{product.cbm || '—'} CBM</span>
            </div>
            <div class="bg-white border border-slate-200 rounded-xl p-3">
              <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Garantie</span>
              <span class="block text-sm font-black text-slate-900 mt-0.5">
                {#if product.warranty_months}{product.warranty_months} mois{:else}—{/if}
              </span>
            </div>
          </div>

          <!-- Quantity selector -->
          <div class="flex items-center gap-3 mb-5">
            <span class="text-sm font-bold text-slate-700">Quantité :</span>
            <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
              <button on:click={() => qty = Math.max(1, qty - 1)}
                class="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-700 font-bold">−</button>
              <input type="number" bind:value={qty} min="1"
                class="w-14 h-8 bg-transparent text-center text-sm font-black text-slate-900 focus:outline-none">
              <button on:click={() => qty = qty + 1}
                class="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-slate-200 transition-colors text-slate-700 font-bold">+</button>
            </div>
            {#if inStock}
              <span class="text-xs text-slate-500">{product.stock_qty} disponibles</span>
            {/if}
          </div>

          <!-- CTAs -->
          <div class="flex flex-col sm:flex-row gap-3 mb-6">
            <button on:click={handleAddToCart}
              class="flex-1 py-3.5 rounded-xl {addedFeedback ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'} text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
              {#if addedFeedback}
                ✓ Ajouté au panier
              {:else}
                🛒 Ajouter au panier
              {/if}
            </button>
            <button on:click={buyNow}
              class="flex-1 py-3.5 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] text-white font-bold text-sm transition-colors">
              Acheter maintenant
            </button>
          </div>

          <a href="https://wa.me/237600000000?text=Bonjour%20STARC%2C%20je%20m%27int%C3%A9resse%20au%20produit%3A%20{encodeURIComponent(product.product_name)}" target="_blank" rel="noopener"
            class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-sm transition-colors mb-6">
            💬 Demander plus d'infos sur WhatsApp
          </a>

          <!-- Garantie strip -->
          <div class="grid grid-cols-3 gap-2 pt-5 border-t border-slate-200">
            <div class="text-center">
              <div class="text-xl mb-1">🛡</div>
              <span class="text-[10px] font-bold text-slate-700 leading-tight block">Paiement sécurisé</span>
            </div>
            <div class="text-center">
              <div class="text-xl mb-1">📦</div>
              <span class="text-[10px] font-bold text-slate-700 leading-tight block">Hub Akwa Douala</span>
            </div>
            <div class="text-center">
              <div class="text-xl mb-1">↩</div>
              <span class="text-[10px] font-bold text-slate-700 leading-tight block">Retour si défaut</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description -->
      {#if product.description}
        <div class="mt-12 border-t border-slate-200 pt-8">
          <h2 class="text-lg font-black text-slate-900 mb-3">Description</h2>
          <p class="text-sm text-slate-700 leading-relaxed max-w-3xl whitespace-pre-wrap">{product.description}</p>
        </div>
      {/if}

      <!-- Specs table -->
      <div class="mt-10">
        <h2 class="text-lg font-black text-slate-900 mb-3">Fiche technique</h2>
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table class="w-full text-sm">
            <tbody class="divide-y divide-slate-100">
              {#if product.sku}<tr><td class="px-4 py-3 text-slate-500 font-semibold w-1/3">Référence</td><td class="px-4 py-3 text-slate-900">{product.sku}</td></tr>{/if}
              {#if product.category}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Catégorie</td><td class="px-4 py-3 text-slate-900">{product.category}</td></tr>{/if}
              {#if product.brand}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Marque</td><td class="px-4 py-3 text-slate-900">{product.brand}</td></tr>{/if}
              {#if product.origin_country}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Origine</td><td class="px-4 py-3 text-slate-900">{product.origin_country}</td></tr>{/if}
              <tr><td class="px-4 py-3 text-slate-500 font-semibold">Poids net</td><td class="px-4 py-3 text-slate-900">{product.weight_kg || '—'} kg</td></tr>
              {#if product.package_weight_kg}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Poids colis</td><td class="px-4 py-3 text-slate-900">{product.package_weight_kg} kg</td></tr>{/if}
              {#if product.length_cm}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Dimensions nettes</td><td class="px-4 py-3 text-slate-900">{product.length_cm} × {product.width_cm} × {product.height_cm} cm</td></tr>{/if}
              {#if product.package_length_cm}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Dimensions colis</td><td class="px-4 py-3 text-slate-900">{product.package_length_cm} × {product.package_width_cm} × {product.package_height_cm} cm</td></tr>{/if}
              <tr><td class="px-4 py-3 text-slate-500 font-semibold">Volume</td><td class="px-4 py-3 text-slate-900">{product.cbm || '—'} CBM</td></tr>
              <tr><td class="px-4 py-3 text-slate-500 font-semibold">Taux douane</td><td class="px-4 py-3 text-slate-900">{product.customs_rate || 32}%</td></tr>
              {#if product.hs_code}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Code HS</td><td class="px-4 py-3 text-slate-900 font-mono">{product.hs_code}</td></tr>{/if}
              {#if product.warranty_months}<tr><td class="px-4 py-3 text-slate-500 font-semibold">Garantie</td><td class="px-4 py-3 text-slate-900">{product.warranty_months} mois</td></tr>{/if}
              {#if product.moq_supplier}<tr><td class="px-4 py-3 text-slate-500 font-semibold">MOQ fournisseur</td><td class="px-4 py-3 text-slate-900">{product.moq_supplier} unités</td></tr>{/if}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Produits similaires -->
      {#if related.length > 0}
        <div class="mt-12 border-t border-slate-200 pt-8">
          <h2 class="text-lg font-black text-slate-900 mb-4">Produits similaires</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each related as r (r.id)}
              <a href="/product/{r.id}" class="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                <div class="aspect-square bg-slate-100 overflow-hidden">
                  {#if r.image_url}
                    <img src={r.image_url} alt={r.product_name} class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                  {:else}
                    <div class="w-full h-full flex items-center justify-center text-slate-300 text-4xl">◻</div>
                  {/if}
                </div>
                <div class="p-3">
                  <h3 class="text-xs font-bold text-slate-900 line-clamp-2 mb-2 min-h-[2rem]">{r.product_name}</h3>
                  <span class="text-sm font-black text-[#3B9AE1]">{formatXAF(r.unit_price_xaf)}<span class="text-[10px] text-slate-500 font-bold ml-1">XAF</span></span>
                </div>
              </a>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </section>
{/if}
