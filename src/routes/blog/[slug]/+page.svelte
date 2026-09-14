<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let post: any = null;
  onMount(async () => {
    post = await fetch(`/api/blog/${$page.params.slug}`).then(r => r.json());
  });
</script>

{#if post && post.title}
<div class="max-w-3xl mx-auto px-4 py-10">
  <h1 class="text-3xl font-bold mb-2">{post.title}</h1>
  <p class="text-xs text-slate-500 mb-6">{post.created_at}</p>
  <div class="card whitespace-pre-wrap">{post.content}</div>
</div>
{:else}
<div class="max-w-3xl mx-auto px-4 py-10"><p>Article introuvable.</p></div>
{/if}
