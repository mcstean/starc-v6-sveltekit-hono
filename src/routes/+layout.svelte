<script lang="ts">
  import '../app.css';
  import { cart } from '$lib/stores';
  let count = 0;
  cart.subscribe(c => count = c.reduce((s, i) => s + i.qty, 0));

  let mobileOpen = false;
  const closeMenu = () => { mobileOpen = false; };

  const navLinks = [
    { href: '/visibility', label: 'Visibilité' },
    { href: '/shop',       label: 'Groupage' },
    { href: '/preorder',   label: 'Boutique' },
    { href: '/services',   label: 'Services' },
    { href: '/track',      label: 'Suivi' }
  ];

  const WHATSAPP_URL = 'https://wa.me/237600000000?text=Bonjour%20STARC%20ENTERPRISE%2C%20je%20souhaite%20des%20informations';
</script>

<header class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
  <div class="h-16 md:h-20 max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
    <a href="/" class="flex items-center shrink-0" on:click={closeMenu}>
      <img src="/logo-starc.png" alt="STARC Enterprise" class="h-8 md:h-10 w-auto">
    </a>

    <nav class="hidden xl:flex items-center gap-1">
      {#each navLinks as link}
        <a href={link.href} class="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors text-sm font-semibold">
          {link.label}
        </a>
      {/each}
    </nav>

    <div class="flex items-center gap-2">
      <a href={WHATSAPP_URL} target="_blank" rel="noopener" class="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>WhatsApp</span>
      </a>

      <div class="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
        <span>★</span>
        <span>1,250</span>
      </div>

      <a href="/checkout" class="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors" aria-label="Panier">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
        {#if count > 0}
          <span class="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
        {/if}
      </a>

      <a href="/my-account" class="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3B9AE1] hover:bg-[#2980C0] text-white text-xs font-bold transition-colors">
        <span>Mon Compte</span>
      </a>

      <button on:click={() => mobileOpen = !mobileOpen} class="xl:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Menu">
        {#if mobileOpen}
          <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        {:else}
          <svg class="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
        {/if}
      </button>
    </div>
  </div>

  {#if mobileOpen}
    <div class="xl:hidden border-t border-slate-200 bg-white shadow-lg">
      <nav class="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
        {#each navLinks as link}
          <a href={link.href} on:click={closeMenu} class="px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors">
            {link.label}
          </a>
        {/each}
        <div class="border-t border-slate-100 mt-2 pt-2 flex flex-col gap-1">
          <a href="/my-account" on:click={closeMenu} class="px-4 py-3 rounded-lg bg-[#3B9AE1] text-white font-semibold text-sm text-center">
            Mon Compte
          </a>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener" on:click={closeMenu} class="px-4 py-3 rounded-lg bg-emerald-50 text-emerald-800 font-semibold text-sm flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>WhatsApp Direct</span>
          </a>
        </div>
      </nav>
    </div>
  {/if}
</header>

<main class="pt-16 md:pt-20 min-h-screen">
  <slot />
</main>

<a href={WHATSAPP_URL} target="_blank" rel="noopener" class="fixed bottom-6 right-6 z-50 group" aria-label="WhatsApp">
  <div class="hidden sm:block absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 bg-slate-900/95 text-white text-xs font-semibold rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
    Discuter avec le Hub Akwa
  </div>
  <div class="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-all ring-4 ring-white">
    <span class="absolute -top-1 -right-1 flex h-4 w-4">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
    </span>
    <svg class="w-7 h-7 fill-current" viewBox="0 0 24 24">
      <path d="M12.031 2C6.495 2 2 6.494 2 12.029c0 1.996.586 3.86 1.6 5.438L2 22l4.71-1.542a9.98 9.98 0 0 0 5.321 1.572h.004c5.535 0 10.03-4.494 10.03-10.029A10.03 10.03 0 0 0 12.031 2zm0 18.36a8.31 8.31 0 0 1-4.238-1.16l-.304-.18-3.137 1.028 1.047-3.058-.198-.315a8.307 8.307 0 0 1-1.272-4.646c0-4.6 3.743-8.343 8.347-8.343a8.31 8.31 0 0 1 5.9 2.446 8.31 8.31 0 0 1 2.446 5.9c0 4.604-3.743 8.348-8.348 8.348zm4.573-6.242c-.25-.125-1.482-.732-1.712-.816-.23-.083-.397-.125-.564.125-.167.25-.648.816-.794.983-.146.167-.292.188-.542.063s-1.06-.39-2.019-1.246c-.746-.665-1.25-1.487-1.396-1.737-.146-.25-.016-.385.11-.51.112-.112.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.021-.438s-.564-1.36-.772-1.862c-.203-.49-.41-.423-.564-.431-.146-.008-.313-.01-.48-.01s-.438.063-.667.313c-.23.25-.875.855-.875 2.085s.896 2.418 1.021 2.585c.125.167 1.763 2.692 4.271 3.775.597.258 1.063.412 1.427.528.6.19 1.146.163 1.578.099.48-.072 1.482-.605 1.69-1.189.209-.584.209-1.085.146-1.189-.062-.104-.23-.167-.48-.292z"/>
    </svg>
  </div>
</a>

<footer class="bg-slate-50 border-t border-slate-200">
  <div class="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
      <div class="md:col-span-2">
        <img src="/logo-starc.png" alt="STARC Enterprise" class="h-8 w-auto mb-3">
        <p class="text-sm text-slate-600 max-w-md leading-relaxed">
          On vous rend visible, puis on vous fait importer ensemble. La plateforme facilitatrice de Douala pour toute la sous-région CEMAC.
        </p>
      </div>
      <div>
        <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Solutions</h4>
        <a href="/visibility" class="block text-sm text-slate-600 hover:text-[#3B9AE1] mb-1.5">Visibilité SEO</a>
        <a href="/shop" class="block text-sm text-slate-600 hover:text-[#3B9AE1] mb-1.5">Groupage Njangui</a>
        <a href="/preorder" class="block text-sm text-slate-600 hover:text-[#3B9AE1] mb-1.5">Boutique Communautaire</a>
        <a href="/track" class="block text-sm text-slate-600 hover:text-[#3B9AE1] mb-1.5">Suivi CBM</a>
      </div>
      <div>
        <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Agence Akwa</h4>
        <p class="text-sm text-slate-600 mb-2 leading-relaxed">Boulevard de la Liberté, Akwa<br>Douala, Cameroun</p>
        <p class="text-sm text-slate-600">Lun - Sam : 08h - 18h30</p>
      </div>
    </div>
    <div class="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
      <span>© STARC ENTERPRISE 2026 · Douala, Cameroun</span>
      <div class="flex items-center gap-2">
        <span class="px-2 py-1 rounded bg-white border border-slate-200">MTN MoMo</span>
        <span class="px-2 py-1 rounded bg-white border border-slate-200">Orange Money</span>
      </div>
    </div>
  </div>
</footer>
