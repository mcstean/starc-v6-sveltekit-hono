<script lang="ts">
  const PASSWORD = 'STARC2026!';
  let authed = false;
  let pass = '';
  let tab = 'crm';
  let stats: any = {};
  let leads: any[] = [];
  let orders: any[] = [];
  let inventory: any[] = [];
  let groups: any[] = [];
  let receipts: any[] = [];
  let sourcing: any[] = [];
  let team: any[] = [];
  let zones: any[] = [];
  let logs: any[] = [];
  let settings = { shipping_rate: 2500, customs_rate: 32 };
  const KANBAN = ['new', 'contacted', 'qualified', 'won', 'lost'];
  async function loadAll() {
    [stats, leads, orders, inventory, groups, receipts, sourcing, team, zones, logs, settings] = await Promise.all([
      fetch('/api/dashboard/stats').then(r => r.json()),
      fetch('/api/leads').then(r => r.json()),
      fetch('/api/orders').then(r => r.json()),
      fetch('/api/inventory').then(r => r.json()),
      fetch('/api/groups').then(r => r.json()),
      fetch('/api/receipts').then(r => r.json()),
      fetch('/api/sourcing-requests').then(r => r.json()),
      fetch('/api/team').then(r => r.json()),
      fetch('/api/delivery-zones').then(r => r.json()),
      fetch('/api/whatsapp/logs').then(r => r.json()),
      fetch('/api/settings').then(r => r.json())
    ]);
  }
  function login(e: Event) {
    e.preventDefault();
    if (pass === PASSWORD) { authed = true; loadAll(); }
  }
  async function saveSettings() {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
    alert('Enregistre');
  }
  async function broadcast(group: any) {
    const msg = prompt('Message pour le groupe:', `Mise a jour ${group.title}: `);
    if (!msg) return;
    const ordersInGroup = orders.filter(o => o.group_id === group.id);
    for (const o of ordersInGroup) {
      await fetch('/api/whatsapp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: o.customer_phone, message: msg }) });
    }
    alert('Envoye a ' + ordersInGroup.length + ' client(s)');
  }
  async function changeGroupStatus(group: any, status: string) {
    await fetch(`/api/groups/${group.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadAll();
  }
  async function updateLead(id: number, status: string) {
    await fetch(`/api/leads/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    loadAll();
  }
</script>

{#if !authed}
<div class="max-w-md mx-auto py-20 px-4">
  <form class="card" on:submit={login}>
    <h1 class="text-2xl font-bold mb-4">Admin</h1>
    <input type="password" class="input mb-3" placeholder="Mot de passe" bind:value={pass} />
    <button class="btn-primary w-full">Entrer</button>
  </form>
</div>
{:else}
<div class="max-w-7xl mx-auto px-4 py-6">
  <div class="flex justify-between items-center mb-4 flex-wrap gap-2">
    <h1 class="text-3xl font-bold">Dashboard</h1>
    <a href="/admin/content" class="btn-accent text-sm">📝 Gerer le contenu (CMS)</a>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
    {#each [['Leads', stats.leads],['Commandes', stats.orders],['Revenu', Number(stats.revenue).toLocaleString() + ' XAF'],['Clients', stats.customers],['Stock bas', stats.low_stock],['Groupes', stats.open_groups]] as [l, v]}
      <div class="card"><p class="text-xs text-slate-500">{l}</p><p class="text-xl font-bold">{v}</p></div>
    {/each}
  </div>
  <div class="flex flex-wrap gap-2 mb-6">
    {#each [['crm','CRM'],['inventory','Inventaire'],['groups','Groupes'],['orders','Commandes'],['receipts','Recus'],['sourcing','Sourcing'],['team','Equipe'],['zones','Livraison'],['settings','Parametres'],['logs','Logs WhatsApp']] as [k, l]}
      <button class="btn {tab === k ? 'bg-brand text-white' : 'btn-outline'}" on:click={() => tab = k}>{l}</button>
    {/each}
  </div>
  {#if tab === 'crm'}
    <div class="grid md:grid-cols-5 gap-3">
      {#each KANBAN as k}
        <div class="card">
          <h3 class="font-bold mb-2 capitalize">{k}</h3>
          {#each leads.filter(l => l.status === k) as l}
            <div class="border rounded p-2 mb-2 text-sm">
              <p class="font-semibold">{l.name}</p>
              <p class="text-xs text-slate-500">{l.phone}</p>
              <a href="https://wa.me/{l.phone}" target="_blank" class="text-xs text-green-600">WhatsApp</a>
              <select class="input text-xs mt-1" on:change={(e) => updateLead(l.id, e.currentTarget.value)}>
                <option value="">Move...</option>
                {#each KANBAN as s}<option value={s}>{s}</option>{/each}
              </select>
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
  {#if tab === 'inventory'}
    <div class="card overflow-auto">
      <table class="w-full text-sm">
        <thead><tr><th class="text-left">Produit</th><th>Stock</th><th>Reserve</th><th>Vendu</th><th>Valeur</th></tr></thead>
        <tbody>
          {#each inventory as i}
            <tr class={i.qty_instock <= i.low_stock_alert ? 'bg-red-50' : ''}>
              <td>{i.product_name}</td><td class="text-center">{i.qty_instock}</td>
              <td class="text-center">{i.qty_reserved}</td><td class="text-center">{i.qty_sold}</td>
              <td class="text-right">{Number(i.qty_instock * i.cost_price_xaf).toLocaleString()} XAF</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  {#if tab === 'groups'}
    {#each groups as g}
      <div class="card mb-3">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 class="font-bold">{g.title}</h3>
            <p class="text-sm text-slate-500">{g.origin_country} - {g.shipping_mode} - {g.status}</p>
          </div>
          <div class="flex gap-2">
            <select class="input text-sm" value={g.status} on:change={(e) => changeGroupStatus(g, e.currentTarget.value)}>
              {#each ['OPEN','CLOSED','ORDERED','SHIPPED','ARRIVED'] as s}<option value={s}>{s}</option>{/each}
            </select>
            <button class="btn-outline text-sm" on:click={() => broadcast(g)}>WhatsApp broadcast</button>
          </div>
        </div>
      </div>
    {/each}
  {/if}
  {#if tab === 'orders'}
    <div class="card overflow-auto">
      <table class="w-full text-sm">
        <thead><tr><th class="text-left">Recu</th><th>Client</th><th>Total</th><th>Statut</th></tr></thead>
        <tbody>
          {#each orders as o}
            <tr><td>{o.receipt_number}</td><td>{o.customer_name} ({o.customer_phone})</td><td>{Number(o.total_xaf).toLocaleString()} XAF</td><td>{o.status}</td></tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  {#if tab === 'receipts'}
    {#each receipts as r}
      <div class="card mb-2 flex justify-between">
        <span>{r.receipt_number} - {Number(r.total_xaf).toLocaleString()} XAF</span>
        <a href="/receipt/{r.order_id}" target="_blank" class="text-brand-accent text-sm">Ouvrir</a>
      </div>
    {/each}
  {/if}
  {#if tab === 'sourcing'}
    {#each sourcing as s}
      <div class="card mb-2">
        <p class="font-semibold">{s.product_wanted} - {s.customer_phone}</p>
        <p class="text-sm">{s.description}</p>
        <p class="text-xs text-slate-500">Statut: {s.status}</p>
      </div>
    {/each}
  {/if}
  {#if tab === 'team'}
    {#each team as t}
      <div class="card mb-2">
        <p><strong>{t.name}</strong> - {t.role} - {t.phone}</p>
        <p class="text-sm">Code: <strong class="text-brand-accent">{t.referral_code}</strong> - Commission {t.commission_rate}%</p>
      </div>
    {/each}
  {/if}
  {#if tab === 'zones'}
    {#each zones as z}
      <div class="card mb-2 flex justify-between">
        <span>{z.city}</span><span class="font-bold">{Number(z.fee).toLocaleString()} XAF</span>
      </div>
    {/each}
  {/if}
  {#if tab === 'settings'}
    <div class="card max-w-md grid gap-3">
      <label class="label">Fret par kg (XAF)</label>
      <input type="number" class="input" bind:value={settings.shipping_rate} />
      <label class="label">Taux douane (%)</label>
      <input type="number" class="input" bind:value={settings.customs_rate} />
      <button class="btn-primary" on:click={saveSettings}>Enregistrer</button>
    </div>
  {/if}
  {#if tab === 'logs'}
    <div class="card overflow-auto max-h-96">
      {#each logs as l}
        <div class="border-b py-1 text-sm">
          <span class="font-mono text-xs">{l.created_at}</span> - <strong>{l.phone}</strong> [{l.type}/{l.status}]: {l.message}
        </div>
      {/each}
    </div>
  {/if}
</div>
{/if}
