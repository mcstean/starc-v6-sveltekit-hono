import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export type CartItem = {
  product: any;      // objet produit complet depuis D1
  qty: number;
};

// ─────────── Persistance localStorage ───────────
function persistent<T>(key: string, initial: T) {
  const saved = browser ? localStorage.getItem(key) : null;
  const store = writable<T>(saved ? JSON.parse(saved) : initial);
  if (browser) store.subscribe(v => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  });
  return store;
}

export const cart = persistent<CartItem[]>('starc_cart', []);

// ─────────── Helpers ───────────
export function addToCart(product: any, qty: number = 1) {
  if (!product?.id) return;
  cart.update(items => {
    const i = items.findIndex(x => x.product?.id === product.id);
    if (i >= 0) {
      const copy = [...items];
      copy[i] = { ...copy[i], qty: copy[i].qty + qty };
      return copy;
    }
    return [...items, { product, qty }];
  });
}

export function removeFromCart(productId: number) {
  cart.update(items => items.filter(x => x.product?.id !== productId));
}

export function updateQty(productId: number, qty: number) {
  if (qty < 1) return removeFromCart(productId);
  cart.update(items => items.map(x =>
    x.product?.id === productId ? { ...x, qty } : x
  ));
}

export function clearCart() {
  cart.set([]);
}

// ─────────── Dérivés ───────────
export const cartCount = derived(cart, $cart =>
  $cart.reduce((s, i) => s + (i.qty || 0), 0)
);

export const cartSubtotal = derived(cart, $cart =>
  $cart.reduce((s, i) => s + ((i.product?.unit_price_xaf || 0) * (i.qty || 0)), 0)
);

export const cartWeight = derived(cart, $cart =>
  $cart.reduce((s, i) => s + ((i.product?.weight_kg || 0) * (i.qty || 0)), 0)
);

export const cartCbm = derived(cart, $cart =>
  $cart.reduce((s, i) => s + ((i.product?.cbm || 0) * (i.qty || 0)), 0)
);
