<script lang="ts">
  import { onMount } from 'svelte';
  import { cart, clearCart, removeFromCart } from '$lib/stores';
  let items: any[] = [];
  cart.subscribe(v => items = v);
  let zones: any[] = [];
  let form = {
    name: '', phone: '', email: '', city: 'Douala',
    delivery_mode: 'pickup', delivery_address: '',
    payment_mode: 'DEPOSIT_30', payment_method: 'Campay',
    insurance: false, recruiter_code: ''
  };
  let submitting = false;
  onMount(async () => { zones = await fetch('/api/delivery-zones').then(r => r.json()); });
  $: subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  $: shipping = items.reduce((s, i) => s + i.weight_kg * 2500 * i.qty, 0);
  $: customs = subtotal * 0.32;
  $: insurance = form.insurance ? subtotal * 0.03 : 0;
  $: deliveryFee = form.delivery_mode === 'domicile' ? (zones.find(z => z.city === form.city)?.fee ?? 2000) : 0;
  $: total = subtotal + shipping + customs + insurance + deliveryFee;
  $: paid = form.payment_mode === 'FULL_100' ? total : total * 0.30;
  $: remaining = total - paid;
  async function submit(e: Event) {
    e.preventDefault();
    if (!items.length) return;
    submitting = true;
    const r = await fetch('/api/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { name: form.name, phone: form.phone, email: form.email, city: form.city },
        items: items.map(i => ({ product_id: i.product_id, qty: i.qty })),
        delivery_mode: form.delivery_mode, delivery_address: form.delivery_address,
        payment_mode: form.payment_mode, payment_method: form.payment_method,
        insurance: form.insurance, recruiter_code: form.recruiter_code
      })
    });
    const receipt = await r.json();
    clearCart();
    submitting = false;
    if (receipt.order_id) location.href = '/receipt/' + receipt.order_id;
    else alert('Erreur: ' + JSON.stringify(receipt));
  }
</script>

<div class="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
  <div>
    <h1 class="text-2xl font-bold mb-4">Panier</h1>
    {#if !items.length}
      <p>Votre panier est vide. <a href="/shop" class="text-brand-accent">Aller a la boutique</a></p>
    {:else}
      {#each items as i}
        <div class="card mb-3 flex justify-between items-center">
          <div>
            <p class="font-semibold">{i.name}</p>
            <p class="text-sm text-slate-500">{i.qty} x {i.price.toLocaleString()} XAF</p>
          </div>
          <button class="text-red-500 text-sm" on:click={() => removeFromCart(i.product_id)}>Retirer</button>
        </div>
      {/each}
    {/if}
  </div>
  <form on:submit={submit} class="card">
    <h2 class="text-xl font-bold mb-4">Informations</h2>
    <div class="grid gap-3">
      <input class="input" placeholder="Nom complet" bind:value={form.name} required />
      <input class="input" placeholder="Telephone (+237...)" bind:value={form.phone} required />
      <input class="input" placeholder="Email" bind:value={form.email} />
      <select class="input" bind:value={form.city}>
        {#each zones as z}<option value={z.city}>{z.city}</option>{/each}
      </select>
      <div>
        <label class="label">Livraison</label>
        <div class="flex gap-3">
          <label><input type="radio" bind:group={form.delivery_mode} value="pickup" /> Retrait Makepe</label>
          <label><input type="radio" bind:group={form.delivery_mode} value="domicile" /> Domicile</label>
        </div>
      </div>
      {#if form.delivery_mode === 'domicile'}
        <input class="input" placeholder="Adresse" bind:value={form.delivery_address} />
      {/if}
      <div>
        <label class="label">Paiement</label>
        <div class="flex gap-3">
          <label><input type="radio" bind:group={form.payment_mode} value="DEPOSIT_30" /> Acompte 30%</label>
          <label><input type="radio" bind:group={form.payment_mode} value="FULL_100" /> 100% (+5% KOBO)</label>
        </div>
      </div>
      <label class="flex items-center gap-2"><input type="checkbox" bind:checked={form.insurance} /> Assurance +3%</label>
      <input class="input" placeholder="Code parrain (optionnel)" bind:value={form.recruiter_code} />
    </div>
    <div class="mt-5 border-t pt-4 space-y-1 text-sm">
      <p>Sous-total: <strong>{subtotal.toLocaleString()} XAF</strong></p>
      <p>Fret: <strong>{shipping.toLocaleString()} XAF</strong></p>
      <p>Douane: <strong>{customs.toLocaleString()} XAF</strong></p>
      <p>Assurance: <strong>{insurance.toLocaleString()} XAF</strong></p>
      <p>Livraison: <strong>{deliveryFee.toLocaleString()} XAF</strong></p>
      <p class="text-lg pt-2 border-t">Total: <strong class="text-brand-accent">{total.toLocaleString()} XAF</strong></p>
      <p>Paye: <strong>{paid.toLocaleString()} XAF</strong></p>
      <p>Reste: <strong>{remaining.toLocaleString()} XAF</strong></p>
    </div>
    <button class="btn-accent w-full mt-4 py-3" disabled={submitting || !items.length}>
      {submitting ? 'Traitement...' : 'Confirmer & Payer (Campay)'}
    </button>
  </form>
</div>
