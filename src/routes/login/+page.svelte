<script lang="ts">
  import { goto } from '$app/navigation';
  let phone = '';
  let name = '';
  let needsName = false;
  let loading = false;
  let error = '';

  async function submit(e: Event) {
    e.preventDefault();
    error = '';
    const clean = phone.replace(/\D/g, '');
    if (clean.length < 8) { error = 'Entrez un numéro valide (ex: 699123456)'; return; }
    if (needsName && !name.trim()) { error = 'Entrez votre nom complet'; return; }
    loading = true;
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: clean, name: needsName ? name.trim() : '' })
      });
      const data = await r.json();
      if (data.needs_name && !needsName) { needsName = true; loading = false; return; }
      if (r.ok && data.success) { goto('/my-account'); }
      else { error = data.error || 'Erreur de connexion'; loading = false; }
    } catch { error = 'Erreur réseau. Réessayez.'; loading = false; }
  }
</script>

<svelte:head><title>Connexion — STARC Enterprise</title></svelte:head>

<section class="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50 py-16 px-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <img src="/logo-starc.png" alt="STARC" class="h-12 w-auto mx-auto mb-4">
      <h1 class="text-2xl md:text-3xl font-black text-slate-900 mb-2">
        {needsName ? 'Créez votre compte' : 'Bienvenue sur STARC'}
      </h1>
      <p class="text-sm text-slate-600">
        {needsName ? 'Un dernier détail pour finaliser votre inscription.' : 'Entrez votre numéro pour accéder à votre espace.'}
      </p>
    </div>
    <form on:submit={submit} class="bg-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-200">
      <div class="mb-5">
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Numéro WhatsApp</label>
        <div class="flex">
          <span class="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-sm font-bold text-slate-600">🇨🇲 +237</span>
          <input type="tel" bind:value={phone} placeholder="699 12 34 56" autocomplete="tel" disabled={needsName}
            class="flex-1 px-3 py-3 rounded-r-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent disabled:opacity-60">
        </div>
      </div>
      {#if needsName}
        <div class="mb-5">
          <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Nom complet</label>
          <input type="text" bind:value={name} placeholder="Ex: Marie Ngono" autocomplete="name"
            class="w-full px-3 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
          <p class="text-[10px] text-slate-500 mt-1.5">Ce nom apparaîtra sur vos reçus.</p>
        </div>
      {/if}
      {#if error}
        <div class="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-xs font-semibold text-red-800">⚠ {error}</div>
      {/if}
      <button type="submit" disabled={loading}
        class="w-full py-3.5 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] disabled:bg-slate-300 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2">
        {#if loading}
          <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          Connexion…
        {:else if needsName}
          Créer mon compte
        {:else}
          Continuer
        {/if}
      </button>
      <p class="text-[11px] text-center text-slate-500 mt-4 leading-relaxed">Pas de mot de passe. Votre numéro WhatsApp vous identifie.</p>
    </form>
  </div>
</section>
