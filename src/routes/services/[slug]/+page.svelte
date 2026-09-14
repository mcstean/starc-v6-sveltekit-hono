<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let service: any = null;
  onMount(async () => {
    const s = await fetch('/api/services').then(r => r.json());
    service = s.find((x: any) => x.slug === $page.params.slug);
  });
</script>

{#if service}
<div class="max-w-3xl mx-auto px-4 py-10">
  <h1 class="text-3xl font-bold mb-4">{service.title}</h1>
  <div class="card"><p>{service.description}</p></div>
  <a href="/" class="btn-primary mt-6 inline-block">Demander un devis</a>
</div>
{:else}
<div class="max-w-3xl mx-auto px-4 py-10"><p>Service introuvable.</p></div>
{/if}
