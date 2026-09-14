<script lang="ts">
  import { onMount } from 'svelte';
  let groups: any[] = [];
  onMount(async () => { groups = await fetch('/api/groups').then(r => r.json()); });
  function daysLeft(d: string) { return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)); }
</script>

<div class="max-w-7xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Groupes de precommande</h1>
  <div class="grid md:grid-cols-3 gap-6">
    {#each groups as g}
      <div class="card">
        <span class="badge bg-green-100 text-green-800">{g.status}</span>
        <h3 class="font-bold text-lg mt-2">{g.title}</h3>
        <p class="text-sm text-slate-600">{g.origin_country} - {g.shipping_mode}</p>
        <p class="mt-3 text-sm">Cloture: {g.closing_date} ({daysLeft(g.closing_date)}j)</p>
        <p class="text-sm">ETA: {g.eta_date}</p>
        <a href="/preorder/{g.id}" class="btn-primary mt-4 w-full inline-block text-center">Voir les produits</a>
      </div>
    {/each}
  </div>
</div>
