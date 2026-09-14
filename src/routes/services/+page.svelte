<script lang="ts">
  import { onMount } from 'svelte';
  let services: any[] = [];
  onMount(async () => { services = await fetch('/api/services').then(r => r.json()); });
</script>

<div class="max-w-5xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Nos services</h1>
  <div class="grid md:grid-cols-2 gap-6">
    {#each services as s}
      <a href="/services/{s.slug}" class="card hover:shadow-lg block">
        <h2 class="font-bold text-xl mb-2">{s.title}</h2>
        <p class="text-slate-600">{s.description}</p>
      </a>
    {/each}
  </div>
</div>
