<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cart } from '$lib/stores';

  let items: any[] = [];
  let submitting = false;
  let orderSuccess: any = null;
  let formError = '';

  // Form
  let form = {
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_mode: 'pickup', // pickup | home
    delivery_address: '',
    delivery_city: 'Douala',
    payment_mode: 'DEPOSIT_30', // DEPOSIT_30 | FULL_100
    payment_method: 'MOMO', // MOMO | OM | CASH
    notes: ''
  };

  const formatXAF = (n: number) => (n || 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');

  // Subscribe to cart
  onMount(() => {
    const unsub = cart.subscribe((c: any[]) => {
      items = c || [];
    });
    return unsub;
  });

  // Computed totals
  $: subtotal = items.reduce((s, i) => s + ((i.product?.unit_price_xaf || 0) * (i.qty || 0)), 0);
  $: totalWeight = items.reduce((s, i) => s + ((i.product?.weight_kg || 0) * (i.qty || 0)), 0);
  $: totalCbm = items.reduce((s, i) => s + ((i.product?.cbm || 0) * (i.qty || 0)), 0);
  $: shippingFee = form.delivery_mode === 'home' ? 2500 : 0;
  $: total = subtotal + shippingFee;
  $: deposit = form.payment_mode === 'DEPOSIT_30' ? Math.round(total * 0.3) : total;
  $: remaining = total - deposit;
  $: koboBonus = form.payment_mode === 'FULL_100' ? Math.round(total * 0.05) : 0;

  function updateQty(idx: number, newQty: number) {
    if (newQty < 1) return removeItem(idx);
    cart.update((c: any[]) => {
      const copy = [...c];
      copy[idx] = { ...copy[idx], qty: newQty };
      return copy;
    });
  }

  function removeItem(idx: number) {
    cart.update((c: any[]) => c.filter((_: any, i: number) => i !== idx));
  }

  function validate(): boolean {
    formError = '';
    if (!form.customer_name.trim()) { formError = 'Veuillez entrer votre nom complet.'; return false; }
    if (!form.customer_phone.trim() || form.customer_phone.replace(/\D/g, '').length < 8) {
      formError = 'Numéro de téléphone invalide (ex: 699 12 34 56).'; return false;
    }
    if (form.delivery_mode === 'home' && !form.delivery_address.trim()) {
      formError = 'Veuillez entrer votre adresse de livraison.'; return false;
    }
    if (items.length === 0) { formError = 'Votre panier est vide.'; return false; }
    return true;
  }

  async function submitOrder() {
    if (!validate()) return;
    submitting = true;
    formError = '';

    try {
      const payload = {
        ...form,
        items: items.map((i: any) => ({
          product_id: i.product?.id,
          product_name: i.product?.product_name,
          qty: i.qty,
          unit_price: i.product?.unit_price_xaf,
          weight_kg: (i.product?.weight_kg || 0) * i.qty,
          cbm: (i.product?.cbm || 0) * i.qty
        })),
        subtotal,
        shipping_fee: shippingFee,
        total_price: total,
        deposit_paid: deposit,
        remaining,
        deposit_percent: form.payment_mode === 'DEPOSIT_30' ? 30 : 100,
        weight_total_kg: totalWeight,
        cbm_total: totalCbm,
        order_type: 'INSTOCK_SALE'
      };

      const r = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (r.ok) {
        const data = await r.json();
        orderSuccess = data;
        cart.set([]);
      } else {
        const err = await r.json().catch(() => ({}));
        formError = err.error || 'Erreur lors de la commande. Réessayez.';
      }
    } catch (e: any) {
      formError = 'Erreur réseau. Vérifiez votre connexion.';
    }
    submitting = false;
  }

  function backToShop() {
    goto('/shop');
  }
</script>

<svelte:head>
  <title>Checkout — STARC Enterprise</title>
</svelte:head>

{#if orderSuccess}
  <!-- ═══ SUCCESS ═══ -->
  <section class="py-16 md:py-24 bg-white">
    <div class="max-w-2xl mx-auto px-4 md:px-6 text-center">
      <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
        <span class="text-4xl">✓</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-black text-slate-900 mb-3">Commande confirmée !</h1>
      <p class="text-base text-slate-600 mb-8">
        Merci {form.customer_name}. Votre commande a bien été enregistrée. Nous vous contacterons sur WhatsApp au <strong>{form.customer_phone}</strong>.
      </p>

      <div class="bg-slate-50 rounded-2xl p-6 text-left mb-6">
        <div class="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Référence</span>
          <span class="font-mono text-sm font-black text-slate-900">{orderSuccess.receipt_number || 'En attente'}</span>
        </div>
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm text-slate-600">Total commande</span>
          <span class="text-sm font-black text-slate-900">{formatXAF(orderSuccess.total || 0)} XAF</span>
        </div>
        <div class="flex justify-between items-center mb-3">
          <span class="text-sm text-slate-600">Acompte à verser</span>
          <span class="text-lg font-black text-[#3B9AE1]">{formatXAF(orderSuccess.deposit || 0)} XAF</span>
        </div>
        {#if (orderSuccess.remaining || 0) > 0}
          <div class="flex justify-between items-center">
            <span class="text-sm text-slate-600">Reste à payer</span>
            <span class="text-sm font-bold text-slate-700">{formatXAF(orderSuccess.remaining || 0)} XAF</span>
          </div>
        {/if}
      </div>

      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
        <h3 class="text-sm font-black text-amber-900 mb-2">📱 Prochaine étape : le paiement</h3>
        <p class="text-xs text-amber-800 leading-relaxed">
          Pour confirmer votre commande, envoyez l'acompte de <strong>{formatXAF(orderSuccess.deposit || 0)} XAF</strong> au numéro suivant :
        </p>
        <div class="mt-3 space-y-1.5 text-xs text-amber-900">
          <div class="flex items-center gap-2">
            <span class="font-bold">MTN MoMo :</span>
            <span class="font-mono">6XX XX XX XX</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="font-bold">Orange Money :</span>
            <span class="font-mono">6XX XX XX XX</span>
          </div>
        </div>
        <p class="text-xs text-amber-800 mt-3">
          Référence à mentionner : <strong class="font-mono">{orderSuccess.receipt_number || 'STARC-2026-XXXX'}</strong>
        </p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="https://wa.me/237600000000?text=Commande%20{orderSuccess.receipt_number}" target="_blank" rel="noopener"
          class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm transition-colors">
          💬 Confirmer sur WhatsApp
        </a>
        <a href="/my-account" class="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors">
          Mon compte
        </a>
        <button on:click={backToShop} class="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm transition-colors">
          Continuer les achats
        </button>
      </div>
    </div>
  </section>

{:else if items.length === 0}
  <!-- ═══ PANIER VIDE ═══ -->
  <section class="py-20 md:py-28 bg-white">
    <div class="max-w-md mx-auto px-4 md:px-6 text-center">
      <div class="w-20 h-20 mx-auto mb-5 rounded-full bg-slate-100 flex items-center justify-center text-4xl text-slate-300">🛒</div>
      <h1 class="text-2xl font-black text-slate-900 mb-2">Votre panier est vide</h1>
      <p class="text-sm text-slate-500 mb-6">Parcourez notre boutique et ajoutez des produits à votre panier.</p>
      <a href="/shop" class="inline-block px-6 py-3 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] text-white font-bold text-sm transition-colors">
        Découvrir la boutique
      </a>
    </div>
  </section>

{:else}
  <!-- ═══ CHECKOUT ═══ -->
  <section class="bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <a href="/" class="hover:text-[#3B9AE1]">Accueil</a>
        <span>/</span>
        <a href="/shop" class="hover:text-[#3B9AE1]">Boutique</a>
        <span>/</span>
        <span class="text-slate-900 font-semibold">Checkout</span>
      </div>
      <h1 class="text-2xl md:text-3xl font-black text-slate-900">Finaliser votre commande</h1>
    </div>
  </section>

  <section class="py-8 md:py-12 bg-slate-50">
    <div class="max-w-7xl mx-auto px-4 md:px-6">
      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">

        <!-- ════ COLONNE GAUCHE : FORMULAIRE ════ -->
        <div class="lg:col-span-3 space-y-5">

          <!-- Contact -->
          <div class="bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
            <div class="flex items-center gap-2 mb-5">
              <div class="w-7 h-7 rounded-full bg-[#3B9AE1] text-white flex items-center justify-center text-xs font-black">1</div>
              <h2 class="text-base font-black text-slate-900">Vos coordonnées</h2>
            </div>

            <div class="space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nom complet *</label>
                <input type="text" bind:value={form.customer_name} placeholder="Ex: Marie Ngono"
                  class="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Téléphone WhatsApp *</label>
                <div class="flex">
                  <span class="inline-flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-xs font-bold text-slate-600">🇨🇲 +237</span>
                  <input type="tel" bind:value={form.customer_phone} placeholder="699 12 34 56"
                    class="flex-1 px-3 py-2.5 rounded-r-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
                </div>
                <p class="text-[10px] text-slate-500 mt-1">Nous vous contacterons sur ce numéro pour confirmer.</p>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email (optionnel)</label>
                <input type="email" bind:value={form.customer_email} placeholder="marie@example.com"
                  class="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent">
              </div>
            </div>
          </div>

          <!-- Livraison -->
          <div class="bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
            <div class="flex items-center gap-2 mb-5">
              <div class="w-7 h-7 rounded-full bg-[#3B9AE1] text-white flex items-center justify-center text-xs font-black">2</div>
              <h2 class="text-base font-black text-slate-900">Mode de réception</h2>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button on:click={() => form.delivery_mode = 'pickup'}
                class="p-4 rounded-xl border-2 text-left transition-all {form.delivery_mode === 'pickup' ? 'border-[#3B9AE1] bg-sky-50' : 'border-slate-200 hover:border-slate-300'}">
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">📍</div>
                  <div class="flex-1">
                    <span class="block text-sm font-black text-slate-900">Retrait Akwa</span>
                    <span class="block text-[11px] text-slate-500 mt-0.5">Boulevard de la Liberté</span>
                    <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Gratuit</span>
                  </div>
                </div>
              </button>

              <button on:click={() => form.delivery_mode = 'home'}
                class="p-4 rounded-xl border-2 text-left transition-all {form.delivery_mode === 'home' ? 'border-[#3B9AE1] bg-sky-50' : 'border-slate-200 hover:border-slate-300'}">
                <div class="flex items-start gap-3">
                  <div class="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-lg shrink-0">🚚</div>
                  <div class="flex-1">
                    <span class="block text-sm font-black text-slate-900">Livraison à domicile</span>
                    <span class="block text-[11px] text-slate-500 mt-0.5">Douala intra-muros</span>
                    <span class="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">2 500 XAF</span>
                  </div>
                </div>
              </button>
            </div>

            {#if form.delivery_mode === 'home'}
              <div class="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Ville</label>
                  <select bind:value={form.delivery_city}
                    class="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1]">
                    <option value="Douala">Douala</option>
                    <option value="Yaoundé">Yaoundé (+ frais)</option>
                    <option value="Bafoussam">Bafoussam (+ frais)</option>
                    <option value="Autre">Autre ville (nous contacter)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Adresse complète *</label>
                  <textarea bind:value={form.delivery_address} rows="2" placeholder="Quartier, rue, point de repère..."
                    class="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent resize-none"></textarea>
                </div>
              </div>
            {/if}
          </div>

          <!-- Paiement -->
          <div class="bg-white rounded-2xl p-5 md:p-6 border border-slate-200">
            <div class="flex items-center gap-2 mb-5">
              <div class="w-7 h-7 rounded-full bg-[#3B9AE1] text-white flex items-center justify-center text-xs font-black">3</div>
              <h2 class="text-base font-black text-slate-900">Paiement</h2>
            </div>

            <!-- Deposit choice -->
            <div class="mb-5">
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Comment souhaitez-vous payer ?</span>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button on:click={() => form.payment_mode = 'DEPOSIT_30'}
                  class="p-4 rounded-xl border-2 text-left transition-all {form.payment_mode === 'DEPOSIT_30' ? 'border-[#3B9AE1] bg-sky-50' : 'border-slate-200 hover:border-slate-300'}">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-black text-slate-900">Acompte 30%</span>
                    <span class="w-5 h-5 rounded-full border-2 {form.payment_mode === 'DEPOSIT_30' ? 'border-[#3B9AE1] bg-[#3B9AE1]' : 'border-slate-300'} flex items-center justify-center">
                      {#if form.payment_mode === 'DEPOSIT_30'}<span class="w-2 h-2 rounded-full bg-white"></span>{/if}
                    </span>
                  </div>
                  <span class="block text-xs text-slate-600">Versez {formatXAF(Math.round(total * 0.3))} XAF maintenant, le reste au retrait.</span>
                </button>

                <button on:click={() => form.payment_mode = 'FULL_100'}
                  class="p-4 rounded-xl border-2 text-left transition-all relative {form.payment_mode === 'FULL_100' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}">
                  <span class="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black uppercase tracking-wider">+5% KOBO</span>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-black text-slate-900">Paiement complet</span>
                    <span class="w-5 h-5 rounded-full border-2 {form.payment_mode === 'FULL_100' ? 'border-amber-400 bg-amber-400' : 'border-slate-300'} flex items-center justify-center">
                      {#if form.payment_mode === 'FULL_100'}<span class="w-2 h-2 rounded-full bg-white"></span>{/if}
                    </span>
                  </div>
                  <span class="block text-xs text-slate-600">Payez {formatXAF(total)} XAF, recevez <strong class="text-amber-700">{formatXAF(koboBonus)} KOBO</strong>.</span>
                </button>
              </div>
            </div>

            <!-- Payment method -->
            <div>
              <span class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Moyen de paiement</span>
              <div class="grid grid-cols-3 gap-2">
                <button on:click={() => form.payment_method = 'MOMO'}
                  class="p-3 rounded-lg border-2 text-center transition-all {form.payment_method === 'MOMO' ? 'border-amber-400 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}">
                  <span class="block text-lg mb-1">🟡</span>
                  <span class="block text-[10px] font-bold text-slate-900">MTN MoMo</span>
                </button>
                <button on:click={() => form.payment_method = 'OM'}
                  class="p-3 rounded-lg border-2 text-center transition-all {form.payment_method === 'OM' ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}">
                  <span class="block text-lg mb-1">🟠</span>
                  <span class="block text-[10px] font-bold text-slate-900">Orange Money</span>
                </button>
                <button on:click={() => form.payment_method = 'CASH'}
                  class="p-3 rounded-lg border-2 text-center transition-all {form.payment_method === 'CASH' ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}">
                  <span class="block text-lg mb-1">💵</span>
                  <span class="block text-[10px] font-bold text-slate-900">Espèces Akwa</span>
                </button>
              </div>
            </div>

            <!-- Notes -->
            <div class="mt-5">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Notes (optionnel)</label>
              <textarea bind:value={form.notes} rows="2" placeholder="Instructions particulières, questions..."
                class="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B9AE1] focus:border-transparent resize-none"></textarea>
            </div>
          </div>

        </div>

        <!-- ════ COLONNE DROITE : RÉCAP ════ -->
        <div class="lg:col-span-2">
          <div class="lg:sticky lg:top-24 space-y-4">

            <!-- Panier -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200">
              <h2 class="text-sm font-black text-slate-900 mb-4 flex items-center justify-between">
                <span>Votre panier</span>
                <span class="text-xs font-bold text-slate-500">{items.length} article{items.length > 1 ? 's' : ''}</span>
              </h2>

              <div class="space-y-3 max-h-72 overflow-y-auto pr-1">
                {#each items as item, i (i)}
                  <div class="flex gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div class="w-14 h-14 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                      {#if item.product?.image_url}
                        <img src={item.product.image_url} alt="" class="w-full h-full object-cover">
                      {:else}
                        <div class="w-full h-full flex items-center justify-center text-slate-300">◻</div>
                      {/if}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h3 class="text-xs font-bold text-slate-900 line-clamp-2">{item.product?.product_name}</h3>
                      <p class="text-[10px] text-slate-500 mt-0.5">{item.product?.weight_kg || 0} kg / unité</p>
                      <div class="flex items-center justify-between mt-1.5">
                        <div class="flex items-center gap-1 bg-slate-100 rounded p-0.5">
                          <button on:click={() => updateQty(i, item.qty - 1)}
                            class="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-bold text-slate-700 hover:bg-slate-200">−</button>
                          <span class="w-6 text-center text-[11px] font-black text-slate-900">{item.qty}</span>
                          <button on:click={() => updateQty(i, item.qty + 1)}
                            class="w-5 h-5 rounded bg-white flex items-center justify-center text-[10px] font-bold text-slate-700 hover:bg-slate-200">+</button>
                        </div>
                        <span class="text-xs font-black text-[#3B9AE1]">{formatXAF((item.product?.unit_price_xaf || 0) * item.qty)}</span>
                      </div>
                    </div>
                    <button on:click={() => removeItem(i)} class="text-slate-300 hover:text-red-500 shrink-0 self-start" aria-label="Retirer">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                {/each}
              </div>
            </div>

            <!-- Totaux -->
            <div class="bg-white rounded-2xl p-5 border border-slate-200">
              <h2 class="text-sm font-black text-slate-900 mb-4">Récapitulatif</h2>

              <div class="space-y-2.5 text-sm">
                <div class="flex justify-between text-slate-600">
                  <span>Sous-total</span>
                  <span class="font-bold text-slate-900">{formatXAF(subtotal)} XAF</span>
                </div>
                {#if shippingFee > 0}
                  <div class="flex justify-between text-slate-600">
                    <span>Livraison</span>
                    <span class="font-bold text-slate-900">{formatXAF(shippingFee)} XAF</span>
                  </div>
                {:else}
                  <div class="flex justify-between text-slate-600">
                    <span>Retrait Akwa</span>
                    <span class="font-bold text-emerald-600">Gratuit</span>
                  </div>
                {/if}

                <div class="border-t border-slate-100 pt-3 mt-3">
                  <div class="flex justify-between items-baseline">
                    <span class="text-base font-black text-slate-900">Total</span>
                    <span class="text-xl font-black text-slate-900">{formatXAF(total)} XAF</span>
                  </div>
                </div>
              </div>

              <!-- Specs panier -->
              <div class="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
                <div class="bg-slate-50 rounded-lg py-2">
                  <span class="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Poids total</span>
                  <span class="block text-xs font-black text-slate-900">{totalWeight.toFixed(1)} kg</span>
                </div>
                <div class="bg-slate-50 rounded-lg py-2">
                  <span class="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Volume total</span>
                  <span class="block text-xs font-black text-slate-900">{totalCbm.toFixed(4)} CBM</span>
                </div>
              </div>

              <!-- Deposit summary -->
              <div class="mt-4 p-4 rounded-xl bg-sky-50 border border-sky-100">
                <div class="flex justify-between items-baseline mb-1">
                  <span class="text-xs font-bold uppercase tracking-wider text-sky-900">À verser maintenant</span>
                  <span class="text-lg font-black text-[#3B9AE1]">{formatXAF(deposit)} XAF</span>
                </div>
                {#if remaining > 0}
                  <div class="flex justify-between items-baseline">
                    <span class="text-[11px] text-sky-800">Reste au retrait</span>
                    <span class="text-xs font-bold text-sky-900">{formatXAF(remaining)} XAF</span>
                  </div>
                {/if}
                {#if koboBonus > 0}
                  <div class="mt-2 pt-2 border-t border-sky-200 flex items-center gap-1.5 text-[11px] text-amber-700 font-bold">
                    <span>★</span>
                    <span>Vous gagnerez {formatXAF(koboBonus)} KOBO</span>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Submit -->
            {#if formError}
              <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 font-semibold">
                ⚠ {formError}
              </div>
            {/if}

            <button on:click={submitOrder} disabled={submitting}
              class="w-full py-4 rounded-xl {submitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-900 hover:bg-[#3B9AE1]'} text-white font-black text-sm transition-colors flex items-center justify-center gap-2">
              {#if submitting}
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Traitement en cours…
              {:else}
                Confirmer la commande
              {/if}
            </button>

            <p class="text-[10px] text-center text-slate-500 leading-relaxed">
              En confirmant, vous acceptez nos conditions générales. Vous serez contacté par WhatsApp pour finaliser le paiement.
            </p>
          </div>
        </div>

      </div>
    </div>
  </section>
{/if}
