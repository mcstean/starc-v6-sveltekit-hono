<script lang="ts">
  import { onMount } from 'svelte';
  let zones: any[] = [];
  onMount(async () => { zones = await fetch('/api/delivery-zones').then(r => r.json()); });
</script>

<div class="max-w-3xl mx-auto px-4 py-10">
  <h1 class="text-3xl font-bold mb-6">Zones de livraison</h1>
  <div class="grid md:grid-cols-2 gap-4">
    {#each zones as z}
      <div class="card flex justify-between">
        <span class="font-semibold">{z.city}</span>
        <span class="text-brand-accent font-bold">{Number(z.fee).toLocaleString()} XAF</span>
      </div>
    {/each}
  </div>
</div>
