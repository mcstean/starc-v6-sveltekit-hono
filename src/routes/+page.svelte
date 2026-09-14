<script lang="ts">
  import { onMount } from 'svelte';
  let groups: any[] = [];
  let services: any[] = [];
  let hero: any = { title: '', subtitle: '', cta1_text: '', cta1_link: '/shop', cta2_text: '', cta2_link: '/preorder' };
  let form = { name: '', phone: '', email: '', service: '', message: '' };
  let sent = false;
  onMount(async () => {
    const [g, s, h] = await Promise.all([
      fetch('/api/groups').then(r => r.json()),
      fetch('/api/services').then(r => r.json()),
      fetch('/api/pages/home').then(r => r.json())
    ]);
    groups = g; services = s; hero = h;
  });
  async function submitLead(e: Event) {
    e.preventDefault();
    await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, source: 'home' }) });
    sent = true;
  }
  function daysLeft(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }
</script>

<section class="bg-gradient-to-br from-brand to-slate-700 text-white py-20">
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-4xl md:text-6xl font-bold mb-4">{hero.title}</h1>
    <p class="text-xl text-slate-200 mb-8">{hero.subtitle}</p>
    <div class="flex gap-3 flex-wrap">
      <a href={hero.cta1_link} class="btn-accent text-lg px-6 py-3">{hero.cta1_text}</a>
      <a href={hero.cta2_link} class="btn-outline bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-6 py-3">{hero.cta2_text}</a>
    </div>
  </div>
</section>

<section class="max-w-7xl mx-auto px-4 py-16">
  <h2 class="text-3xl font-bold mb-8 text-center">Comment fonctionne le groupage</h2>
  <div class="grid md:grid-cols-4 gap-6">
    {#each [['1','Rejoignez un groupe','Choisissez un groupe ouvert.'],['2','Commandez','Payez 30% ou 100%.'],['3','Groupage','Nous acheminons ensemble.'],['4','Livraison','Retrait Makepe ou domicile.']] as [n, t, d]}
      <div class="card text-center">
        <div class="w-12 h-12 rounded-full bg-brand-accent text-white font-bold text-xl flex items-center justify-center mx-auto mb-3">{n}</div>
        <h3 class="font-semibold mb-1">{t}</h3>
        <p class="text-sm text-slate-600">{d}</p>
      </div>
    {/each}
  </div>
</section>

<section class="bg-white py-16">
  <div class="max-w-7xl mx-auto px-4">
    <h2 class="text-3xl font-bold mb-8 text-center">Groupes actifs</h2>
    <div class="grid md:grid-cols-3 gap-6">
      {#each groups as g}
        <div class="card">
          <span class="badge bg-green-100 text-green-800">{g.status}</span>
          <h3 class="font-bold text-lg mt-2">{g.title}</h3>
          <p class="text-sm text-slate-600 mt-1">{g.origin_country} - {g.shipping_mode}</p>
          <div class="mt-3 text-sm">
            <p><strong>Cloture:</strong> {g.closing_date} ({daysLeft(g.closing_date)}j)</p>
            <p><strong>ETA:</strong> {g.eta_date}</p>
          </div>
          <a href="/preorder/{g.id}" class="btn-primary mt-4 w-full inline-block text-center">Voir le groupe</a>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="max-w-7xl mx-auto px-4 py-16">
  <h2 class="text-3xl font-bold mb-8 text-center">Nos services</h2>
  <div class="grid md:grid-cols-4 gap-6">
    {#each services as s}
      <a href="/services/{s.slug}" class="card hover:shadow-lg transition block">
        <h3 class="font-semibold mb-1">{s.title}</h3>
        <p class="text-sm text-slate-600">{s.description}</p>
      </a>
    {/each}
  </div>
</section>

<section class="bg-brand text-white py-16">
  <div class="max-w-3xl mx-auto px-4">
    <h2 class="text-3xl font-bold mb-6 text-center">Parlons de votre projet</h2>
    {#if sent}
      <div class="bg-green-500/20 border border-green-400 rounded-lg p-4 text-center">Merci ! Un conseiller vous contacte bientot.</div>
    {:else}
      <form on:submit={submitLead} class="grid md:grid-cols-2 gap-4">
        <input class="input text-brand" placeholder="Nom" bind:value={form.name} required />
        <input class="input text-brand" placeholder="Telephone (+237...)" bind:value={form.phone} required />
        <input class="input text-brand" placeholder="Email" bind:value={form.email} />
        <input class="input text-brand" placeholder="Service" bind:value={form.service} />
        <textarea class="input text-brand md:col-span-2" rows="3" placeholder="Message" bind:value={form.message}></textarea>
        <button class="btn-accent md:col-span-2">Envoyer</button>
      </form>
    {/if}
  </div>
</section>
