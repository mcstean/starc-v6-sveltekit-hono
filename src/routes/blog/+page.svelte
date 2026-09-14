<script lang="ts">
  import { onMount } from 'svelte';
  let posts: any[] = [];
  onMount(async () => { posts = await fetch('/api/blog').then(r => r.json()); });
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-6">Blog</h1>
  {#if !posts.length}
    <p class="text-slate-500">Aucun article pour le moment.</p>
  {:else}
    {#each posts as p}
      <a href="/blog/{p.slug}" class="card mb-3 block hover:shadow-lg">
        <h2 class="font-bold text-xl">{p.title}</h2>
        <p class="text-xs text-slate-500 mt-1">{p.created_at}</p>
      </a>
    {/each}
  {/if}
</div>
