<script lang="ts">
  import '../app.css';
  import { cart } from '$lib/stores';
  let count = 0;
  cart.subscribe(c => count = c.reduce((s, i) => s + i.qty, 0));
</script>

<header class="bg-white border-b border-slate-200 sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="font-bold text-xl text-brand">STARC<span class="text-brand-accent">.CM</span></a>
    <nav class="hidden md:flex gap-6 text-sm font-medium">
      <a href="/shop" class="hover:text-brand-accent">Shop</a>
      <a href="/services" class="hover:text-brand-accent">Services</a>
      <a href="/preorder" class="hover:text-brand-accent">Precommande</a>
      <a href="/request-sourcing" class="hover:text-brand-accent">Sourcing</a>
      <a href="/blog" class="hover:text-brand-accent">Blog</a>
      <a href="/delivery" class="hover:text-brand-accent">Livraison</a>
    </nav>
    <div class="flex items-center gap-3">
      <a href="/checkout" class="relative btn-outline text-sm">Panier
        {#if count > 0}<span class="absolute -top-2 -right-2 bg-brand-accent text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">{count}</span>{/if}
      </a>
      <a href="/my-account" class="btn-primary text-sm">Mon Compte</a>
    </div>
  </div>
</header>

<main class="min-h-screen"><slot /></main>

<footer class="bg-brand text-white mt-16">
  <div class="max-w-7xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm">
    <div>
      <h3 class="font-bold text-lg mb-2">STARC.CM</h3>
      <p>NJANGUI - KOBO - NGOMA KOBO</p>
      <p class="mt-2 text-slate-300">Douala, Cameroun</p>
    </div>
    <div>
      <h4 class="font-semibold mb-2">Liens</h4>
      <a href="/shop" class="block text-slate-300 hover:text-white">Boutique</a>
      <a href="/services" class="block text-slate-300 hover:text-white">Services</a>
      <a href="/dashboard" class="block text-slate-300 hover:text-white">Admin</a>
    </div>
    <div>
      <h4 class="font-semibold mb-2">Contact</h4>
      <p class="text-slate-300">WhatsApp: +237 6XX XXX XXX</p>
    </div>
  </div>
</footer>
