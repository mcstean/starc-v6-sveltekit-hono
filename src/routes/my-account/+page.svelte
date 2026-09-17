<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let me: any = null;
  let orders: any[] = [];
  let kobo: any = { balance: 0, transactions: [] };
  let loading = true;
  let activeTab: 'orders' | 'kobo' | 'profile' = 'orders';

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  const statusLabel: Record<string, { label: string; color: string }> = {
    PENDING:  { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
    RESERVED: { label: 'Réservé',   color: 'bg-sky-100 text-sky-800' },
    LOCKED:   { label: 'Verrouillé', color: 'bg-slate-200 text-slate-700' },
    ORDERED:  { label: 'Commandé',  color: 'bg-indigo-100 text-indigo-800' },
    SHIPPED:  { label: 'Expédié',   color: 'bg-purple-100 text-purple-800' },
    ARRIVED:  { label: 'Arrivé',    color: 'bg-emerald-100 text-emerald-800' }
  };

  onMount(async () => {
    try {
      const r = await fetch('/api/auth/me');
      if (!r.ok) { goto('/login'); return; }
      me = await r.json();
      const [ro, rk] = await Promise.all([fetch('/api/my/orders'), fetch('/api/my/kobo')]);
      if (ro.ok) orders = await ro.json();
      if (rk.ok) kobo = await rk.json();
    } catch { goto('/login'); }
    loading = false;
  });

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    goto('/');
  }

  function copyReferral() {
    if (!me?.referral_code) return;
    navigator.clipboard.writeText(me.referral_code);
  }
</script>

<svelte:head><title>Mon Compte — STARC Enterprise</title></svelte:head>

{#if loading}
  <div class="max-w-4xl mx-auto px-4 py-20 text-center">
    <div class="w-12 h-12 mx-auto border-4 border-slate-200 border-t-[#3B9AE1] rounded-full animate-spin"></div>
  </div>
{:else if me}
  <section class="bg-gradient-to-br from-sky-50 to-white border-b border-slate-200">
    <div class="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#3B9AE1] text-white flex items-center justify-center font-black text-xl md:text-2xl shrink-0">
          {(me.name || 'S').charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-xl md:text-2xl font-black text-slate-900 truncate">Bonjour {me.name}</h1>
          <p class="text-xs md:text-sm text-slate-600">+237 {me.phone}</p>
        </div>
        <button on:click={logout} class="shrink-0 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-colors">
          Déconnexion
        </button>
      </div>
      <div class="grid grid-cols-3 gap-3 mt-6">
        <div class="bg-white rounded-2xl p-4 border border-slate-200">
          <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Commandes</span>
          <span class="block text-2xl font-black text-slate-900 mt-1">{orders.length}</span>
        </div>
        <div class="bg-white rounded-2xl p-4 border border-slate-200">
          <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Total dépensé</span>
          <span class="block text-lg md:text-xl font-black text-[#3B9AE1] mt-1">{formatXAF(orders.reduce((s, o) => s + (o.deposit || 0), 0))}</span>
          <span class="text-[9px] text-slate-500">XAF versés</span>
        </div>
        <div class="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-4 border border-amber-200">
          <span class="block text-[10px] font-bold uppercase tracking-wider text-amber-700">KOBO</span>
          <span class="block text-2xl font-black text-amber-600 mt-1">{formatXAF(kobo.balance)}</span>
        </div>
      </div>
    </div>
  </section>

  <section class="bg-white border-b border-slate-200 sticky top-16 md:top-20 z-30">
    <div class="max-w-5xl mx-auto px-4 md:px-6">
      <div class="flex gap-1 py-3 overflow-x-auto" style="scrollbar-width:none;">
        <button on:click={() => activeTab = 'orders'}
          class="shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors {activeTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">
          📦 Mes commandes ({orders.length})
        </button>
        <button on:click={() => activeTab = 'kobo'}
          class="shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors {activeTab === 'kobo' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'}">
          ★ Portefeuille KOBO
        </button>
        <button on:click={() => activeTab = 'profile'}
          class="shrink-0 px-4 py-2 rounded-lg text-xs font-bold transition-colors {activeTab === 'profile' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}">
          👤 Mon profil
        </button>
      </div>
    </div>
  </section>

  <section class="py-8 md:py-12 bg-slate-50 min-h-[60vh]">
    <div class="max-w-5xl mx-auto px-4 md:px-6">

      {#if activeTab === 'orders'}
        {#if orders.length === 0}
          <div class="max-w-md mx-auto text-center py-16">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-slate-200 flex items-center justify-center text-3xl">📦</div>
            <h3 class="text-lg font-bold text-slate-900 mb-1">Aucune commande</h3>
            <p class="text-sm text-slate-500 mb-5">Vos futures commandes apparaîtront ici.</p>
            <a href="/shop" class="inline-block px-5 py-2.5 rounded-lg bg-[#3B9AE1] hover:bg-[#2980C0] text-white text-xs font-bold transition-colors">Découvrir la boutique</a>
          </div>
        {:else}
          <div class="space-y-4">
            {#each orders as o (o.receipt_number)}
              <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-1 rounded">{o.receipt_number}</span>
                    <span class="text-[10px] text-slate-500">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider {statusLabel[o.status]?.color || 'bg-slate-100 text-slate-700'}">
                    {statusLabel[o.status]?.label || o.status}
                  </span>
                </div>
                <div class="px-5 py-4 space-y-3">
                  {#each o.items as it}
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                        {#if it.image_url}
                          <img src={it.image_url} alt="" class="w-full h-full object-cover">
                        {:else}
                          <div class="w-full h-full flex items-center justify-center text-slate-300 text-lg">◻</div>
                        {/if}
                      </div>
                      <div class="flex-1 min-w-0">
                        <h4 class="text-xs font-bold text-slate-900 truncate">{it.product_name || 'Produit'}</h4>
                        <p class="text-[10px] text-slate-500">Qté {it.quantity} × {formatXAF(it.unit_price)} XAF</p>
                      </div>
                      <span class="text-xs font-black text-slate-700 shrink-0">{formatXAF((it.unit_price || 0) * it.quantity)}</span>
                    </div>
                  {/each}
                </div>
                <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                  <div class="text-[11px] text-slate-600">
                    <span class="font-bold text-slate-900">Total {formatXAF(o.total)} XAF</span>
                    <span class="mx-1">·</span>
                    Versé {formatXAF(o.deposit)}
                    {#if o.remaining > 0}<span class="mx-1">·</span><span class="text-amber-700 font-semibold">Reste {formatXAF(o.remaining)}</span>{/if}
                  </div>
                  <a href="/receipt/{o.receipt_number}" class="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-[#3B9AE1] text-white text-[10px] font-bold transition-colors">Voir le reçu →</a>
                </div>
              </div>
            {/each}
          </div>
        {/if}

      {:else if activeTab === 'kobo'}
        <div class="max-w-2xl mx-auto">
          <div class="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-6 text-white shadow-xl mb-6">
            <span class="text-xs font-bold uppercase tracking-wider opacity-90">Solde KOBO</span>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-4xl md:text-5xl font-black">{formatXAF(kobo.balance)}</span>
              <span class="text-sm font-bold opacity-90">KOBO</span>
            </div>
            <p class="text-xs opacity-90 mt-3">1 KOBO = 1 XAF déductible de vos frais de fret futurs.</p>
          </div>
          <h3 class="text-sm font-black text-slate-900 mb-3">Historique</h3>
          {#if kobo.transactions.length === 0}
            <div class="bg-white rounded-2xl border border-slate-200 p-6 text-center text-sm text-slate-500">Aucune transaction pour l'instant.</div>
          {:else}
            <div class="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {#each kobo.transactions as t}
                <div class="px-4 py-3 flex items-center justify-between">
                  <div>
                    <span class="text-xs font-bold text-slate-900">{t.reason || 'Transaction'}</span>
                    <p class="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <span class="text-sm font-black {t.amount > 0 ? 'text-emerald-600' : 'text-red-500'}">{t.amount > 0 ? '+' : ''}{formatXAF(t.amount)}</span>
                </div>
              {/each}
            </div>
          {/if}
        </div>

      {:else}
        <div class="max-w-2xl mx-auto space-y-5">
          <div class="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 class="text-sm font-black text-slate-900 mb-4">Mes informations</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Nom</span><span class="font-bold text-slate-900">{me.name || '—'}</span></div>
              <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Téléphone</span><span class="font-bold text-slate-900">+237 {me.phone}</span></div>
              <div class="flex justify-between py-2"><span class="text-slate-500">Membre depuis</span><span class="font-bold text-slate-900">{new Date(me.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span></div>
            </div>
          </div>
          {#if me.referral_code}
            <div class="bg-gradient-to-br from-sky-500 to-[#3B9AE1] rounded-2xl p-6 text-white">
              <span class="text-xs font-bold uppercase tracking-wider opacity-90">Parrainez vos amis</span>
              <p class="text-sm opacity-90 mt-2 mb-4">Gagnez 2% sur chaque commande qu'ils passent grâce à vous.</p>
              <div class="flex items-center gap-2 bg-white/15 backdrop-blur rounded-lg p-3">
                <span class="font-mono font-black text-lg flex-1">{me.referral_code}</span>
                <button on:click={copyReferral} class="px-3 py-1.5 rounded bg-white text-[#3B9AE1] text-xs font-bold">Copier</button>
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </section>
{/if}
