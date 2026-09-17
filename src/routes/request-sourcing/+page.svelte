<script lang="ts">
  import { onMount } from 'svelte';

  let form = {
    product_wanted: '',
    description: '',
    budget: '' as string | number,
    customer_phone: '',
    customer_name: ''
  };

  let me: any = null;
  let submitting = false;
  let success: any = null;
  let error = '';

  const categories = [
    { v: 'Mode', i: '👗' }, { v: 'Textile', i: '🧵' }, { v: 'Chaussures', i: '👟' },
    { v: 'Electronics', i: '📱' }, { v: 'Lighting', i: '💡' }, { v: 'Household', i: '🏠' },
    { v: 'Beauty', i: '💄' }, { v: 'BTP', i: '🔧' }, { v: 'Furniture', i: '🪑' },
    { v: 'Autre', i: '📦' }
  ];
  let selectedCategory = 'Electronics';

  onMount(async () => {
    try {
      const r = await fetch('/api/auth/me');
      if (r.ok) {
        me = await r.json();
        form.customer_phone = me.phone || '';
        form.customer_name = me.name || '';
      }
    } catch {}
  });

  function validate(): boolean {
    error = '';
    if (!form.product_wanted.trim()) { error = 'Décrivez le produit recherché.'; return false; }
    if (!form.customer_phone.trim() || form.customer_phone.replace(/\D/g, '').length < 8) {
      error = 'Numéro de téléphone invalide.'; return false;
    }
    return true;
  }

  async function submit() {
    if (!validate()) return;
    submitting = true;
    error = '';

    try {
      const r = await fetch('/api/sourcing-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_wanted: form.product_wanted,
          description: `[${selectedCategory}] ${form.description}`,
          budget: form.budget ? Number(form.budget) : null,
          customer_phone: form.customer_phone.replace(/\D/g, ''),
          customer_name: form.customer_name
        })
      });
      const data = await r.json();
      if (r.ok && data.success) {
        success = data;
      } else {
        error = data.error || 'Erreur lors de l\'envoi.';
      }
    } catch {
      error = 'Erreur réseau. Réessayez.';
    }
    submitting = false;
  }

  function reset() {
    form.product_wanted = '';
    form.description = '';
    form.budget = '';
    success = null;
    error = '';
  }
</script>

<svelte:head>
  <title>Demander un sourcing — STARC Enterprise</title>
  <meta name="description" content="Vous cherchez un produit spécifique en Chine, Turquie ou Dubaï ? Décrivez-le, on le trouve pour vous." />
</svelte:head>

{#if success}
  <!-- ═══ CONFIRMATION ═══ -->
  <section class="py-16 md:py-24 bg-white">
    <div class="max-w-2xl mx-auto px-4 md:px-6 text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <span class="text-4xl">✓</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-3">Demande envoyée !</h1>
      <p class="text-base text-slate-600 mb-8 max-w-md mx-auto">
        Notre équipe va rechercher <strong>{form.product_wanted}</strong> chez nos fournisseurs.
        Vous recevrez une réponse sur WhatsApp sous <strong>48h</strong>.
      </p>

      <div class="bg-slate-50 rounded-2xl p-6 text-left mb-6">
        <div class="flex justify-between items-center pb-3 mb-3 border-b border-slate-200">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Référence</span>
          <span class="font-mono text-sm font-black text-slate-900">{success.id || 'SRC-' + Date.now().toString(36).toUpperCase()}</span>
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-600">Produit</span>
            <span class="font-bold text-slate-900 text-right">{form.product_wanted}</span>
          </div>
          {#if form.budget}
            <div class="flex justify-between">
              <span class="text-slate-600">Budget estimé</span>
              <span class="font-bold text-slate-900">{form.budget} XAF</span>
            </div>
          {/if}
          <div class="flex justify-between">
            <span class="text-slate-600">Contact</span>
            <span class="font-bold text-slate-900">+237 {form.customer_phone}</span>
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="https://wa.me/237600000000?text=Bonjour%20STARC%2C%20ma%20demande%20de%20sourcing%20concerne%20{encodeURIComponent(form.product_wanted)}"
          target="_blank" rel="noopener"
          class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors">
          💬 Envoyer un message WhatsApp
        </a>
        <button on:click={reset} class="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm transition-colors">
          Nouvelle demande
        </button>
        <a href="/shop" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors">
          Voir la boutique
        </a>
      </div>
    </div>
  </section>

{:else}
  <!-- ═══ HEADER ═══ -->
  <section class="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
    <div class="max-w-4xl mx-auto px-4 md:px-6 py-10 md:py-14">
      <div class="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <a href="/" class="hover:text-[#3B9AE1]">Accueil</a>
        <span>/</span>
        <span class="text-slate-900 font-semibold">Sourcing</span>
      </div>
      <div class="max-w-2xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B9AE1]/15 text-[#3B9AE1] text-[11px] font-bold uppercase tracking-wider mb-3">
          🔍 Facilitation Sourcing
        </span>
        <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
          Vous cherchez un produit spécifique ?
        </h1>
        <p class="text-base text-slate-600 leading-relaxed">
          Décrivez ce que vous voulez importer. Notre équipe cherche chez nos fournisseurs en Chine, Turquie et Dubaï, négocie le prix, et vous propose une offre avec fret groupé.
        </p>
      </div>
    </div>
  </section>

  <!-- ═══ HOW IT WORKS ═══ -->
  <section class="py-8 bg-white border-b border-slate-200">
    <div class="max-w-4xl mx-auto px-4 md:px-6">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {#each [
          { n: '1', t: 'Décrivez le produit', d: 'Nom, quantité souhaitée, budget indicatif', i: '📝' },
          { n: '2', t: 'Nous cherchons', d: 'Fournisseurs vérifiés + devis chiffré', i: '🔍' },
          { n: '3', t: 'Vous validez', d: 'Si ça vous convient, on lance l\'import', i: '🤝' }
        ] as s}
          <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-3 rounded-xl bg-sky-50 flex items-center justify-center text-2xl">{s.i}</div>
            <h3 class="text-sm font-black text-slate-900 mb-1">{s.n}. {s.t}</h3>
            <p class="text-xs text-slate-600 leading-relaxed">{s.d}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- ═══ FORM ═══ -->
  <section class="py-10 md:py-14 bg-slate-50">
    <div class="max-w-2xl mx-auto px-4 md:px-6">
      <div class="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">

        <h2 class="text-lg font-black text-slate-900 mb-6">Décrivez votre demande</h2>

        <!-- Catégorie -->
        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Catégorie</label>
          <div class="flex flex-wrap gap-2">
            {#each categories as c}
              <button type="button" on:click={() => selectedCategory = c.v}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all {selectedCategory === c.v ? 'bg-[#3B9AE1] text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>{c.i}</span>
                <span>{c.v}</span>
              </button>
            {/each}
          </div>
        </div>

        <!-- Produit -->
        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Produit recherché *
          </label>
          <input type="text" bind:value={form.product_wanted}
            placeholder="Ex: Perceuse à percussion sans fil 20V"
            class="w-full px-3 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
        </div>

        <!-- Description -->
        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Description détaillée
          </label>
          <textarea bind:value={form.description} rows="4"
            placeholder="Marque souhaitée, quantité, caractéristiques, couleur... Tout ce qui peut nous aider."
            class="w-full px-3 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent resize-none"></textarea>
          <p class="text-[10px] text-slate-500 mt-1">Plus vous êtes précis, plus nous pouvons trouver le bon produit.</p>
        </div>

        <!-- Budget -->
        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Budget estimé (optionnel)
          </label>
          <div class="flex">
            <input type="number" bind:value={form.budget} placeholder="500000"
              class="flex-1 px-3 py-3 rounded-l-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
            <span class="inline-flex items-center px-4 bg-slate-100 border border-l-0 border-slate-200 rounded-r-lg text-xs font-bold text-slate-600">
              XAF
            </span>
          </div>
          <p class="text-[10px] text-slate-500 mt-1">Un ordre de grandeur pour vous proposer des options adaptées.</p>
        </div>

        <!-- Contact -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Nom (optionnel)
            </label>
            <input type="text" bind:value={form.customer_name} placeholder="Votre nom"
              class="w-full px-3 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Téléphone WhatsApp *
            </label>
            <div class="flex">
              <span class="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-bold text-slate-600">🇨🇲 +237</span>
              <input type="tel" bind:value={form.customer_phone} placeholder="699 12 34 56" inputmode="numeric"
                class="flex-1 px-3 py-3 rounded-r-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
            </div>
          </div>
        </div>

        {#if error}
          <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-semibold text-red-800">
            ⚠ {error}
          </div>
        {/if}

        <button on:click={submit} disabled={submitting}
          class="w-full py-4 rounded-xl {submitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#3B9AE1] hover:bg-[#2980C0]'} text-white font-black text-sm transition-colors flex items-center justify-center gap-2">
          {#if submitting}
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            Envoi en cours…
          {:else}
            Envoyer ma demande
          {/if}
        </button>

        <p class="text-[10px] text-center text-slate-500 mt-4 leading-relaxed">
          Gratuit et sans engagement. Nous vous recontactons sous 48h avec un devis chiffré.
        </p>
      </div>

      <!-- Info card -->
      <div class="mt-5 bg-sky-50 border border-sky-100 rounded-2xl p-5 flex items-start gap-4">
        <div class="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shrink-0">💡</div>
        <div>
          <h3 class="text-sm font-black text-sky-900 mb-1">Vous avez des photos ?</h3>
          <p class="text-xs text-sky-800 leading-relaxed">
            Si vous avez des photos du produit, envoyez-les directement sur notre WhatsApp après avoir soumis ce formulaire. Ça nous aide à trouver plus vite.
          </p>
        </div>
      </div>
    </div>
  </section>
{/if}
