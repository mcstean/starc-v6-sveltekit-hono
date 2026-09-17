<script lang="ts">
  import { onMount } from 'svelte';

  let authed = false;
  let checking = true;
  let password = '';
  let loginError = '';
  let loggingIn = false;

  let activeTab: 'overview' | 'sourcing' | 'carts' | 'orders' = 'overview';
  let stats: any = null;
  let recentOrders: any[] = [];
  let recentSourcing: any[] = [];
  let sourcingLeads: any[] = [];
  let cartLeads: any[] = [];
  let orders: any[] = [];
  let loading = true;

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  const statusColor: Record<string, string> = {
    PENDING:  'bg-amber-100 text-amber-800',
    RESERVED: 'bg-sky-100 text-sky-800',
    LOCKED:   'bg-slate-200 text-slate-700',
    ORDERED:  'bg-indigo-100 text-indigo-800',
    SHIPPED:  'bg-purple-100 text-purple-800',
    ARRIVED:  'bg-emerald-100 text-emerald-800',
    new:      'bg-red-100 text-red-800',
    quoted:   'bg-sky-100 text-sky-800',
    won:      'bg-emerald-100 text-emerald-800',
    lost:     'bg-slate-200 text-slate-700'
  };

  onMount(async () => {
    try {
      const r = await fetch('/api/admin/check');
      if (r.ok) {
        const d = await r.json();
        authed = d.authenticated === true;
        if (authed) await loadData();
      }
    } catch {}
    checking = false;
    loading = false;
  });

  async function login(e: Event) {
    e.preventDefault();
    loginError = '';
    loggingIn = true;
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (r.ok) {
        authed = true;
        password = '';
        await loadData();
      } else {
        const d = await r.json().catch(() => ({}));
        loginError = d.error || 'Mot de passe invalide';
      }
    } catch {
      loginError = 'Erreur réseau';
    }
    loggingIn = false;
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    authed = false;
    stats = null;
  }

  async function loadData() {
    loading = true;
    try {
      const r = await fetch('/api/admin/stats');
      if (r.ok) {
        const d = await r.json();
        stats = d.stats;
        recentOrders = d.recent_orders || [];
        recentSourcing = d.recent_sourcing || [];
      }
    } catch {}
    loading = false;
  }

  async function loadTab(tab: string) {
    activeTab = tab as any;
    if (tab === 'sourcing' && sourcingLeads.length === 0) {
      const r = await fetch('/api/admin/sourcing-leads');
      if (r.ok) sourcingLeads = await r.json();
    }
    if (tab === 'carts' && cartLeads.length === 0) {
      const r = await fetch('/api/admin/cart-leads');
      if (r.ok) cartLeads = await r.json();
    }
    if (tab === 'orders' && orders.length === 0) {
      const r = await fetch('/api/admin/orders');
      if (r.ok) orders = await r.json();
    }
  }

  function waLink(phone: string, msg: string) {
    const clean = (phone || '').replace(/\D/g, '');
    const final = clean.startsWith('237') ? clean : '237' + clean;
    return `https://wa.me/${final}?text=${encodeURIComponent(msg)}`;
  }

  function timeAgo(iso: string): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "à l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    return `il y a ${d}j`;
  }
</script>

<svelte:head>
  <title>Admin — STARC Enterprise</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if checking}
  <div class="min-h-screen flex items-center justify-center bg-slate-900">
    <div class="w-12 h-12 border-4 border-slate-700 border-t-[#3B9AE1] rounded-full animate-spin"></div>
  </div>

{:else if !authed}
  <!-- ═══ LOGIN GATE ═══ -->
  <section class="min-h-screen flex items-center justify-center bg-slate-900 px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-6">
        <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#3B9AE1]/20 flex items-center justify-center">
          <span class="text-3xl">🔒</span>
        </div>
        <h1 class="text-2xl font-black text-white mb-1">Admin STARC</h1>
        <p class="text-xs text-slate-400">Accès réservé</p>
      </div>

      <form on:submit={login} class="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Mot de passe</label>
        <input type="password" bind:value={password} autocomplete="current-password" autofocus
          class="w-full px-3 py-3 rounded-lg bg-slate-900 border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">

        {#if loginError}
          <div class="mt-3 bg-red-900/30 border border-red-800 rounded-lg p-2.5 text-xs font-semibold text-red-300">⚠ {loginError}</div>
        {/if}

        <button type="submit" disabled={loggingIn}
          class="w-full mt-4 py-3 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] disabled:bg-slate-600 text-white font-bold text-sm transition-colors">
          {loggingIn ? 'Connexion…' : 'Entrer'}
        </button>
      </form>
    </div>
  </section>

{:else}
  <!-- ═══ DASHBOARD ═══ -->
  <div class="min-h-screen bg-slate-100">
    <!-- Header -->
    <header class="bg-slate-900 text-white sticky top-0 z-40 shadow-lg">
      <div class="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-[#3B9AE1] flex items-center justify-center text-sm font-black">S</div>
          <div>
            <h1 class="text-sm font-black leading-tight">STARC Admin</h1>
            <p class="text-[10px] text-slate-400 leading-tight">Tableau de bord</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button on:click={loadData} class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-colors">↻ Actualiser</button>
          <button on:click={logout} class="px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-200 text-xs font-bold transition-colors">Déconnexion</button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 md:px-6 py-6">

      {#if loading}
        <div class="text-center py-20"><div class="w-10 h-10 mx-auto border-4 border-slate-200 border-t-[#3B9AE1] rounded-full animate-spin"></div></div>
      {:else}
        <!-- Stats cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div class="bg-white rounded-2xl p-4 border border-slate-200">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Commandes</span>
            <span class="block text-2xl font-black text-slate-900 mt-1">{stats?.total_orders || 0}</span>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-slate-200">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Clients</span>
            <span class="block text-2xl font-black text-slate-900 mt-1">{stats?.total_customers || 0}</span>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-red-200">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-red-600">Sourcing neuf</span>
            <span class="block text-2xl font-black text-red-600 mt-1">{stats?.new_sourcing || 0}</span>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-amber-200">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-amber-700">Paniers abandon.</span>
            <span class="block text-2xl font-black text-amber-600 mt-1">{stats?.abandoned_carts || 0}</span>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-emerald-200">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">Encaissé</span>
            <span class="block text-lg font-black text-emerald-600 mt-1">{formatXAF(stats?.total_revenue)}</span>
            <span class="text-[9px] text-slate-500">XAF acomptes</span>
          </div>
          <div class="bg-white rounded-2xl p-4 border border-amber-200">
            <span class="block text-[10px] font-bold uppercase tracking-wider text-amber-700">Valeur perd.</span>
            <span class="block text-lg font-black text-amber-600 mt-1">{formatXAF(stats?.abandoned_value)}</span>
            <span class="text-[9px] text-slate-500">XAF paniers</span>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white rounded-2xl border border-slate-200 mb-5">
          <div class="flex overflow-x-auto border-b border-slate-200" style="scrollbar-width:none;">
            <button on:click={() => loadTab('overview')}
              class="shrink-0 px-5 py-3 text-xs font-bold transition-colors border-b-2 {activeTab === 'overview' ? 'border-[#3B9AE1] text-[#3B9AE1]' : 'border-transparent text-slate-600 hover:text-slate-900'}">
              📊 Vue d'ensemble
            </button>
            <button on:click={() => loadTab('sourcing')}
              class="shrink-0 px-5 py-3 text-xs font-bold transition-colors border-b-2 {activeTab === 'sourcing' ? 'border-[#3B9AE1] text-[#3B9AE1]' : 'border-transparent text-slate-600 hover:text-slate-900'}">
              🔍 Sourcing ({stats?.new_sourcing || 0})
            </button>
            <button on:click={() => loadTab('carts')}
              class="shrink-0 px-5 py-3 text-xs font-bold transition-colors border-b-2 {activeTab === 'carts' ? 'border-[#3B9AE1] text-[#3B9AE1]' : 'border-transparent text-slate-600 hover:text-slate-900'}">
              🛒 Paniers abandonnés ({stats?.abandoned_carts || 0})
            </button>
            <button on:click={() => loadTab('orders')}
              class="shrink-0 px-5 py-3 text-xs font-bold transition-colors border-b-2 {activeTab === 'orders' ? 'border-[#3B9AE1] text-[#3B9AE1]' : 'border-transparent text-slate-600 hover:text-slate-900'}">
              📦 Commandes ({stats?.total_orders || 0})
            </button>
          </div>

          <!-- ═══ OVERVIEW ═══ -->
          {#if activeTab === 'overview'}
            <div class="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Dernières commandes</h3>
                {#if recentOrders.length === 0}
                  <p class="text-sm text-slate-400 py-6 text-center">Aucune commande</p>
                {:else}
                  <div class="space-y-2">
                    {#each recentOrders as o}
                      <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                        <div class="min-w-0 flex-1">
                          <span class="font-mono text-[11px] font-bold text-slate-900 block truncate">{o.receipt_number}</span>
                          <span class="text-[11px] text-slate-600">{o.customer_name}</span>
                        </div>
                        <span class="text-xs font-black text-slate-900 shrink-0">{formatXAF(o.total_xaf)}</span>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>

              <div>
                <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Dernières demandes sourcing</h3>
                {#if recentSourcing.length === 0}
                  <p class="text-sm text-slate-400 py-6 text-center">Aucune demande</p>
                {:else}
                  <div class="space-y-2">
                    {#each recentSourcing as s}
                      <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg">
                        <div class="min-w-0 flex-1">
                          <span class="text-[11px] font-bold text-slate-900 block truncate">{s.product_wanted}</span>
                          <span class="text-[11px] text-slate-600">+237 {s.customer_phone}</span>
                        </div>
                        <a href={waLink(s.customer_phone, `Bonjour, c'est STARC concernant votre demande sourcing: ${s.product_wanted}`)}
                          target="_blank" rel="noopener"
                          class="shrink-0 px-2 py-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold">
                          💬
                        </a>
                      </div>
                    {/each}
                  </div>
                {/if}
              </div>
            </div>

          <!-- ═══ SOURCING LEADS ═══ -->
          {:else if activeTab === 'sourcing'}
            <div class="p-5">
              {#if sourcingLeads.length === 0}
                <div class="text-center py-12">
                  <div class="text-4xl mb-3">🔍</div>
                  <p class="text-sm text-slate-500">Aucune demande sourcing pour l'instant.</p>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each sourcingLeads as s}
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-mono text-[10px] font-bold text-slate-500">SRC-{String(s.id).padStart(6, '0')}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusColor[s.status] || 'bg-slate-200 text-slate-700'}">{s.status}</span>
                            <span class="text-[10px] text-slate-500">{timeAgo(s.created_at)}</span>
                          </div>
                          <h4 class="text-sm font-black text-slate-900">{s.product_wanted}</h4>
                          {#if s.description}<p class="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{s.description}</p>{/if}
                          <div class="flex items-center gap-3 mt-2 text-[11px] text-slate-600">
                            <span>📞 +237 {s.customer_phone}</span>
                            {#if s.budget}<span>💰 {formatXAF(s.budget)} XAF</span>{/if}
                          </div>
                        </div>
                        <a href={waLink(s.customer_phone, `Bonjour, c'est STARC concernant votre demande sourcing: "${s.product_wanted}". Puis-je vous proposer un devis ?`)}
                          target="_blank" rel="noopener"
                          class="shrink-0 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5">
                          💬 Relancer
                        </a>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          <!-- ═══ ABANDONED CARTS ═══ -->
          {:else if activeTab === 'carts'}
            <div class="p-5">
              {#if cartLeads.length === 0}
                <div class="text-center py-12">
                  <div class="text-4xl mb-3">🛒</div>
                  <p class="text-sm text-slate-500">Aucun panier abandonné pour l'instant.</p>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each cartLeads as cl}
                    <div class="bg-slate-50 rounded-xl p-4 border border-amber-200">
                      <div class="flex items-start justify-between gap-3 flex-wrap">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="text-sm font-black text-slate-900">{cl.customer_name || 'Visiteur'}</span>
                            <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">{cl.stage}</span>
                            <span class="text-[10px] text-slate-500">{timeAgo(cl.last_activity_at)}</span>
                          </div>
                          <div class="text-[11px] text-slate-600 space-y-0.5">
                            <div>📞 +237 {cl.customer_phone}</div>
                            <div>🛒 {cl.items_count} article(s) · 💰 {formatXAF(cl.total_xaf)} XAF</div>
                          </div>
                        </div>
                        <a href={waLink(cl.customer_phone, `Bonjour ${cl.customer_name || ''}, je vois que vous avez laissé ${cl.items_count} article(s) dans votre panier chez STARC. Je peux vous aider à finaliser votre commande ?`)}
                          target="_blank" rel="noopener"
                          class="shrink-0 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1.5">
                          💬 Relancer
                        </a>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>

          <!-- ═══ ORDERS ═══ -->
          {:else if activeTab === 'orders'}
            <div class="p-5">
              {#if orders.length === 0}
                <div class="text-center py-12">
                  <div class="text-4xl mb-3">📦</div>
                  <p class="text-sm text-slate-500">Aucune commande pour l'instant.</p>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each orders as o}
                    <div class="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <div class="flex items-start justify-between gap-3 flex-wrap mb-2">
                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2 mb-1 flex-wrap">
                            <span class="font-mono text-[11px] font-black text-slate-900">{o.receipt_number}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase {statusColor[o.status] || 'bg-slate-200 text-slate-700'}">{o.status}</span>
                            <span class="text-[10px] text-slate-500">{timeAgo(o.created_at)}</span>
                          </div>
                          <div class="text-xs text-slate-700 font-bold">{o.customer_name}</div>
                          <div class="text-[11px] text-slate-600">📞 +237 {o.customer_phone} · {o.delivery_mode === 'pickup' ? 'Retrait Akwa' : 'Domicile'}</div>
                        </div>
                        <a href={waLink(o.customer_phone, `Bonjour ${o.customer_name}, votre commande ${o.receipt_number} chez STARC. Comment puis-je vous aider ?`)}
                          target="_blank" rel="noopener"
                          class="shrink-0 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold">
                          💬
                        </a>
                      </div>

                      <!-- Items -->
                      <div class="space-y-1 mt-2 pt-2 border-t border-slate-200">
                        {#each o.items as it}
                          <div class="flex items-center justify-between text-[11px]">
                            <span class="text-slate-700">Qté {it.quantity} × {it.product_name || 'Produit'}</span>
                            <span class="font-bold text-slate-900">{formatXAF((it.unit_price || 0) * it.quantity)}</span>
                          </div>
                        {/each}
                        <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200">
                          <span class="font-bold text-slate-700">Total · Versé {formatXAF(o.deposit)}</span>
                          <span class="font-black text-[#3B9AE1]">{formatXAF(o.total)} XAF</span>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}

    </main>
  </div>
{/if}
