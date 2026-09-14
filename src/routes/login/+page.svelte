<script lang="ts">
  import { goto } from '$app/navigation';
  let phone = '';
  let otp = '';
  let step = 1;
  let error = '';
  let loading = false;
  function sendOTP(e: Event) { e.preventDefault(); if (!phone) return; step = 2; }
  async function verify(e: Event) {
    e.preventDefault();
    loading = true; error = '';
    const r = await fetch('/api/auth/otp', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    loading = false;
    if (!r.ok) { error = 'Code invalide'; return; }
    document.cookie = `starc_phone=${phone}; path=/; max-age=${60 * 60 * 24 * 30}`;
    goto('/my-account');
  }
</script>

<div class="max-w-md mx-auto px-4 py-16">
  <div class="card">
    <h1 class="text-2xl font-bold mb-4">Connexion</h1>
    {#if step === 1}
      <form on:submit={sendOTP} class="grid gap-3">
        <input class="input" placeholder="Telephone (+237...)" bind:value={phone} required />
        <button class="btn-primary">Recevoir le code</button>
      </form>
      <p class="text-xs text-slate-500 mt-3">Mode demo: OTP est 123456</p>
    {:else}
      <form on:submit={verify} class="grid gap-3">
        <p class="text-sm">Code envoye a {phone}</p>
        <input class="input" placeholder="123456" bind:value={otp} required />
        {#if error}<p class="text-red-500 text-sm">{error}</p>{/if}
        <button class="btn-primary" disabled={loading}>{loading ? '...' : 'Verifier'}</button>
      </form>
    {/if}
  </div>
</div>
