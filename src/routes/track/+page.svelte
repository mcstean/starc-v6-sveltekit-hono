<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let query = '';
  let receipt: any = null;
  let loading = false;
  let error = '';
  let searched = false;

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  const STEPS = [
    { key: 'PENDING',  label: 'Enregistrée',  icon: '📝', desc: 'Commande reçue' },
    { key: 'RESERVED', label: 'Réservée',     icon: '✅', desc: 'Acompte reçu' },
    { key: 'LOCKED',   label: 'Verrouillée',  icon: '🔒', desc: 'Confirmée' },
    { key: 'ORDERED',  label: 'Commandée',    icon: '📦', desc: 'Fournisseur' },
    { key: 'SHIPPED',  label: 'Expédiée',     icon: '🚚', desc: 'En transit' },
    { key: 'ARRIVED',  label: 'Arrivée',      icon: '🎉', desc: 'Prête au Hub' }
  ];

  $: currentStepIdx = receipt ? STEPS.findIndex(s => s.key === receipt.status) : -1;
  $: if (receipt && currentStepIdx === -1) currentStepIdx = 0;

  onMount(async () => {
    // Pré-remplit depuis ?q=REFERENCE dans l'URL
    const q = $page.url.searchParams.get('q');
    if (q) {
      query = q;
      await lookup(q);
    }
  });

  async function lookup(q?: string) {
    const ref = (q || query).trim();
    if (!ref) { error = 'Entrez une référence ou un numéro'; return; }

    loading = true;
    error = '';
    receipt = null;
    searched = true;

    try {
      // 1. Essaie comme référence de reçu (STARC-YYYY-NNNN)
      if (/^STARC-/i.test(ref)) {
        const upper = ref.toUpperCase();
        const r = await fetch(`/api/receipts/${upper}`);
        if (r.ok) {
          receipt = await r.json();
        } else {
          error = 'Aucune commande trouvée avec cette référence.';
        }
      } else {
        // 2. Sinon, cherche par téléphone
        const clean = ref.replace(/\D/g, '');
        if (clean.length < 8) {
          error = 'Numéro invalide. Ex: 699123456 ou STARC-2026-0001.';
        } else {
          const r = await fetch(`/api/track/by-phone/${clean}`);
          if (r.ok) {
            const data = await r.json();
            if (data.orders && data.orders.length > 0) {
              receipt = data.orders[0]; // la plus récente
            } else {
              error = 'Aucune commande trouvée pour ce numéro.';
            }
          } else {
            error = 'Erreur de recherche.';
          }
        }
      }
    } catch {
      error = 'Erreur réseau. Réessayez.';
    }
    loading = false;
  }
</script>

<svelte:head><title>Suivi de commande — STARC Enterprise</title></svelte:head>

<!-- Header de page -->
<section class="bg-gradient-to-b from-sky-50 to-white border-b border-slate-200">
  <div class="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16 text-center">
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B9AE1]/15 text-[#3B9AE1] text-[11px] font-bold uppercase tracking-wider mb-4">
      📍 Suivi en direct
    </div>
    <h1 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">
      Où est ma commande ?
    </h1>
    <p class="text-base text-slate-600 max-w-xl mx-auto">
      Entrez votre référence STARC ou votre numéro WhatsApp pour suivre l'avancement de votre colis.
    </p>
  </div>
</section>

<!-- Recherche -->
<section class="py-8 md:py-10 bg-white border-b border-slate-200">
  <div class="max-w-2xl mx-auto px-4 md:px-6">
    <div class="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        bind:value={query}
        on:keydown={(e) => e.key === 'Enter' && lookup()}
        placeholder="STARC-2026-0001 ou 699123456"
        class="flex-1 px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
      <button
        on:click={() => lookup()}
        disabled={loading}
        class="px-6 py-3.5 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] disabled:bg-slate-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shrink-0">
        {#if loading}
          <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        {:else}
          🔍 Rechercher
        {/if}
      </button>
    </div>
    <p class="text-[11px] text-slate-500 mt-2 text-center">
      La référence se trouve sur votre reçu WhatsApp ou dans votre espace client.
    </p>
  </div>
</section>

<!-- Résultat -->
<section class="py-10 md:py-14 bg-slate-50 min-h-[400px]">
  <div class="max-w-4xl mx-auto px-4 md:px-6">

    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-white flex items-center justify-center text-2xl">⚠</div>
        <p class="text-sm font-semibold text-red-800">{error}</p>
        <p class="text-xs text-red-600 mt-2">Vérifiez votre saisie ou contactez-nous sur WhatsApp.</p>
      </div>

    {:else if receipt}
      <!-- Carte principale -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mb-6">

        <!-- Header carte -->
        <div class="px-5 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-gradient-to-br from-sky-50 to-white">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Référence</span>
            <div class="font-mono text-base md:text-lg font-black text-slate-900">{receipt.receipt_number}</div>
          </div>
          <div class="text-right">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Statut actuel</span>
            <span class="inline-block px-3 py-1 rounded-full bg-[#3B9AE1] text-white text-xs font-bold uppercase tracking-wider">
              {STEPS[currentStepIdx]?.label || receipt.status}
            </span>
          </div>
        </div>

        <!-- Timeline -->
        <div class="px-5 md:px-6 py-6 md:py-8">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-5">Progression</h3>

          <div class="relative">
            <!-- Barre de progression globale -->
            <div class="absolute left-0 right-0 top-6 h-1 bg-slate-200 rounded-full" style="margin-left: 24px; margin-right: 24px;"></div>
            <div class="absolute top-6 h-1 bg-[#3B9AE1] rounded-full transition-all duration-700"
              style="left: 24px; right: calc(100% - 24px - ({currentStepIdx} / ({STEPS.length} - 1)) * (100% - 48px)); max-width: calc(100% - 48px);"></div>

            <!-- Étapes -->
            <div class="grid grid-cols-6 gap-1 relative">
              {#each STEPS as step, i}
                {@const reached = i <= currentStepIdx}
                {@const isCurrent = i === currentStepIdx}
                <div class="flex flex-col items-center text-center">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all duration-500
                    {reached ? 'bg-[#3B9AE1] text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-slate-300'}
                    {isCurrent ? 'ring-4 ring-[#3B9AE1]/20 scale-110' : ''}">
                    {#if reached && !isCurrent}
                      <span class="text-white">✓</span>
                    {:else}
                      <span>{step.icon}</span>
                    {/if}
                  </div>
                  <span class="text-[10px] md:text-xs font-bold mt-2 {reached ? 'text-slate-900' : 'text-slate-400'}">
                    {step.label}
                  </span>
                  <span class="text-[9px] text-slate-400 hidden md:block mt-0.5">{step.desc}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>

        <!-- Détails commande -->
        <div class="px-5 md:px-6 py-5 border-t border-slate-100 bg-slate-50">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Détails</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <span class="block text-[10px] text-slate-500 font-semibold uppercase">Client</span>
              <span class="block text-sm font-bold text-slate-900">{receipt.customer_name || '—'}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 font-semibold uppercase">Téléphone</span>
              <span class="block text-sm font-bold text-slate-900">+237 {receipt.customer_phone}</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 font-semibold uppercase">Date commande</span>
              <span class="block text-sm font-bold text-slate-900">
                {new Date(receipt.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 font-semibold uppercase">Total</span>
              <span class="block text-sm font-bold text-slate-900">{formatXAF(receipt.total)} XAF</span>
            </div>
            <div>
              <span class="block text-[10px] text-slate-500 font-semibold uppercase">Acompte versé</span>
              <span class="block text-sm font-bold text-[#3B9AE1]">{formatXAF(receipt.deposit)} XAF</span>
            </div>
            {#if receipt.remaining > 0}
              <div>
                <span class="block text-[10px] text-slate-500 font-semibold uppercase">Reste à payer</span>
                <span class="block text-sm font-bold text-amber-700">{formatXAF(receipt.remaining)} XAF</span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Articles -->
        {#if receipt.items && receipt.items.length > 0}
          <div class="px-5 md:px-6 py-5 border-t border-slate-100">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Articles ({receipt.items.length})
            </h3>
            <div class="space-y-2">
              {#each receipt.items as it}
                <div class="flex items-center justify-between text-sm">
                  <span class="text-slate-700">
                    <span class="font-bold">Qté {it.quantity}</span>
                    <span class="text-slate-500 mx-1">·</span>
                    Produit #{it.product_id}
                  </span>
                  <span class="font-bold text-slate-900">{formatXAF(it.line_total)} XAF</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- CTA -->
        <div class="px-5 md:px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
          <a href="/receipt/{receipt.receipt_number}" class="flex-1 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-colors">
            📄 Voir le reçu complet
          </a>
          <a href="https://wa.me/237600000000?text=Bonjour%20STARC%2C%20je%20souhaite%20un%20suivi%20de%20la%20commande%20{receipt.receipt_number}"
            target="_blank" rel="noopener"
            class="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold text-center transition-colors">
            💬 Contacter sur WhatsApp
          </a>
        </div>
      </div>

    {:else if !searched}
      <div class="text-center py-10">
        <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-4xl">📦</div>
        <h3 class="text-lg font-bold text-slate-900 mb-2">Prêt à suivre votre colis</h3>
        <p class="text-sm text-slate-500 max-w-md mx-auto">
          Entrez votre référence STARC (visible sur votre reçu) ou votre numéro de téléphone pour voir l'avancement.
        </p>
      </div>
    {/if}
  </div>
</section>

<!-- Info bas de page -->
<section class="py-10 bg-white border-t border-slate-200">
  <div class="max-w-3xl mx-auto px-4 md:px-6">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
      <div>
        <div class="text-3xl mb-2">📱</div>
        <h4 class="text-sm font-black text-slate-900 mb-1">Notifié à chaque étape</h4>
        <p class="text-xs text-slate-600">Vous recevez un message WhatsApp à chaque changement de statut.</p>
      </div>
      <div>
        <div class="text-3xl mb-2">🎯</div>
        <h4 class="text-sm font-black text-slate-900 mb-1">Suivi transparent</h4>
        <p class="text-xs text-slate-600">Six étapes précises depuis l'enregistrement jusqu'au retrait au Hub Akwa.</p>
      </div>
      <div>
        <div class="text-3xl mb-2">🤝</div>
        <h4 class="text-sm font-black text-slate-900 mb-1">Support direct</h4>
        <p class="text-xs text-slate-600">Une question ? Notre équipe est sur WhatsApp 7j/7.</p>
      </div>
    </div>
  </div>
</section>
