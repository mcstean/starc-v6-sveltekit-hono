<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let receipt: any = null;
  let loading = true;
  let error = '';

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  onMount(async () => {
    const num = $page.params.id;
    try {
      const r = await fetch(`/api/receipts/${num}`);
      if (r.ok) {
        receipt = await r.json();
      } else {
        error = 'Reçu introuvable';
      }
    } catch {
      error = 'Erreur de chargement';
    }
    loading = false;
  });
</script>

<svelte:head>
  <title>{receipt ? `Reçu ${receipt.receipt_number} — STARC` : 'Reçu — STARC'}</title>
</svelte:head>

{#if loading}
  <div class="max-w-2xl mx-auto px-4 py-20 text-center">
    <div class="w-12 h-12 mx-auto border-4 border-slate-200 border-t-[#3B9AE1] rounded-full animate-spin"></div>
  </div>
{:else if error}
  <section class="max-w-2xl mx-auto px-4 py-20 text-center">
    <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center text-3xl text-red-400">✕</div>
    <h1 class="text-2xl font-black text-slate-900 mb-2">{error}</h1>
    <p class="text-sm text-slate-500 mb-6">Vérifiez votre référence ou contactez-nous sur WhatsApp.</p>
    <a href="/shop" class="inline-block px-6 py-3 rounded-xl bg-slate-900 hover:bg-[#3B9AE1] text-white font-bold text-sm transition-colors">
      Retour à la boutique
    </a>
  </section>
{:else if receipt}
  <section class="py-10 md:py-16 bg-white">
    <div class="max-w-2xl mx-auto px-4 md:px-6">
      <div class="text-center mb-8">
        <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-100 flex items-center justify-center">
          <span class="text-4xl">✓</span>
        </div>
        <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-2">Commande confirmée</h1>
        <p class="text-sm text-slate-600">
          Merci <strong>{receipt.customer_name}</strong>. Nous vous contacterons au <strong>{receipt.customer_phone}</strong>.
        </p>
      </div>

      <!-- Récap -->
      <div class="bg-slate-50 rounded-2xl p-5 mb-5">
        <div class="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Référence</span>
          <span class="font-mono text-sm font-black text-slate-900">{receipt.receipt_number}</span>
        </div>

        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-600">Articles</span>
            <span class="font-bold text-slate-900">{receipt.items_count}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Total commande</span>
            <span class="font-black text-slate-900">{formatXAF(receipt.total)} XAF</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-600">Acompte versé</span>
            <span class="font-black text-[#3B9AE1] text-lg">{formatXAF(receipt.deposit)} XAF</span>
          </div>
          {#if receipt.remaining > 0}
            <div class="flex justify-between">
              <span class="text-slate-600">Reste à payer</span>
              <span class="font-bold text-slate-700">{formatXAF(receipt.remaining)} XAF</span>
            </div>
          {/if}
          <div class="flex justify-between pt-3 border-t border-slate-200 text-xs">
            <span class="text-slate-500">Statut</span>
            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">{receipt.status}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">Paiement</span>
            <span class="font-semibold text-slate-700">{receipt.payment_mode === 'DEPOSIT_30' ? 'Acompte 30%' : 'Paiement complet'}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">Réception</span>
            <span class="font-semibold text-slate-700">{receipt.delivery_mode === 'pickup' ? 'Retrait Akwa' : 'Livraison domicile'}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-500">Date</span>
            <span class="font-mono text-slate-600">{new Date(receipt.created_at).toLocaleString('fr-FR')}</span>
          </div>
        </div>
      </div>

      <!-- Instructions paiement -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <h3 class="text-sm font-black text-amber-900 mb-2">📱 Prochaine étape</h3>
        <p class="text-xs text-amber-800 leading-relaxed mb-3">
          Envoyez l'acompte de <strong>{formatXAF(receipt.deposit)} XAF</strong> :
        </p>
        <div class="space-y-1 text-xs text-amber-900">
          <div class="flex items-center gap-2"><span class="font-bold">MTN MoMo :</span><span class="font-mono">6XX XX XX XX</span></div>
          <div class="flex items-center gap-2"><span class="font-bold">Orange Money :</span><span class="font-mono">6XX XX XX XX</span></div>
        </div>
        <p class="text-xs text-amber-800 mt-3">
          Référence : <strong class="font-mono">{receipt.receipt_number}</strong>
        </p>
      </div>

      <!-- Boutons -->
      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="https://wa.me/237600000000?text=Bonjour%20STARC%2C%20commande%20{receipt.receipt_number}"
          target="_blank" rel="noopener"
          class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm text-center transition-colors">
          💬 Confirmer sur WhatsApp
        </a>
        <a href="/shop" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm text-center transition-colors">
          Continuer les achats
        </a>
      </div>

      <p class="text-[10px] text-center text-slate-500 mt-6">
        💾 Sauvegardez cette page ou cette référence pour retrouver votre commande.
      </p>
    </div>
  </section>
{/if}
