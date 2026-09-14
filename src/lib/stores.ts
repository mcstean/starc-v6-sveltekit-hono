import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export type CartItem = {
  product_id: number; name: string; price: number; qty: number;
  weight_kg: number; cbm: number; image_url?: string;
  group_id?: number | null; is_preorder: boolean;
};

function persistent<T>(key: string, initial: T) {
  const saved = browser ? localStorage.getItem(key) : null;
  const store = writable<T>(saved ? JSON.parse(saved) : initial);
  if (browser) store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
  return store;
}

export const cart = persistent<CartItem[]>('starc_cart', []);

export function addToCart(item: CartItem) {
  cart.update(items => {
    const i = items.findIndex(x => x.product_id === item.product_id);
    if (i >= 0) { items[i].qty += item.qty; return items; }
    return [...items, item];
  });
}
export function removeFromCart(id: number) { cart.update(items => items.filter(x => x.product_id !== id)); }
export function clearCart() { cart.set([]); }
