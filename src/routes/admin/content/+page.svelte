<script lang="ts">
  const PASSWORD = 'STARC2026!';
  let authed = false;
  let pass = '';
  let tab = 'products';
  let products: any[] = [];
  let services: any[] = [];
  let posts: any[] = [];
  let groups: any[] = [];
  let hero: any = {};
  let editing: any = null;
  let showForm = false;

  async function loadAll() {
    [products, services, posts, groups, hero] = await Promise.all([
      fetch('/api/admin/products').then(r => r.json()),
      fetch('/api/services').then(r => r.json()),
      fetch('/api/blog').then(r => r.json()),
      fetch('/api/groups').then(r => r.json()),
      fetch('/api/pages/home').then(r => r.json())
    ]);
  }

  function login(e: Event) {
    e.preventDefault();
    if (pass === PASSWORD) { authed = true; loadAll(); }
  }

  function newProduct() {
    editing = { product_name: '', sku: '', description: '', unit_price_xaf: 0, cost_price_xaf: 0,
      weight_kg: 0, length_cm: 0, width_cm: 0, height_cm: 0, customs_rate: 32,
      image_url: '', category: 'General', is_instock: false, stock_qty: 0,
      is_preorder: false, group_id: null, moq_needed: 0, moq_current: 0 };
    showForm = true;
  }

  function newService() {
    editing = { id: null, slug: '', title: '', description: '', image_url: '' };
    showForm = true;
  }

  function newPost() {
    editing = { id: null, slug: '', title: '', content: '' };
    showForm = true;
  }

  async function saveProduct() {
    const url = editing.id ? `/api/admin/products/${editing.id}` : '/api/admin/products';
    const method = editing.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    showForm = false; editing = null; loadAll();
  }

  async function saveService() {
    const url = editing.id ? `/api/admin/services/${editing.id}` : '/api/admin/services';
    const method = editing.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    showForm = false; editing = null; loadAll();
  }

  async function savePost() {
    const url = editing.id ? `/api/admin/blog/${editing.id}` : '/api/admin/blog';
    const method = editing.id ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    showForm = false; editing = null; loadAll();
  }

  async function saveHero() {
    await fetch('/api/admin/pages/home', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(hero) });
    alert('Accueil enregistre');
  }

  async function del(kind: string, id: number) {
    if (!confirm('Supprimer ?')) return;
    await fetch(`/api/admin/${kind}/${id}`, { method: 'DELETE' });
    loadAll();
  }

  async function uploadImage(e: Event, target: any, field: string) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f); fd.append('type', 'product');
    const r = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
    target[field] = r.url;
  }
</script>

{#if !authed}
<div class="max-w-md mx-auto py-20 px-4">
  <form class="card" on:submit={login}>
    <h1 class="text-2xl font-bold mb-4">CMS Admin</h1>
    <input type="password" class="input mb-3" placeholder="Mot de passe" bind:value={pass} />
    <button class="btn-primary w-full">Entrer</button>
  </form>
</div>
{:else}
<div class="max-w-7xl mx-auto px-4 py-6">
  <div class="flex justify-between items-center mb-4">
    <h1 class="text-3xl font-bold">Gestion de contenu</h1>
    <a href="/dashboard" class="btn-outline text-sm">Retour Dashboard</a>
  </div>

  <div class="flex flex-wrap gap-2 mb-6">
    {#each [['products','Produits'],['services','Services'],['blog','Blog'],['home','Accueil']] as [k, l]}
      <button class="btn {tab === k ? 'bg-brand text-white' : 'btn-outline'}" on:click={() => tab = k}>{l}</button>
    {/each}
  </div>

  {#if tab === 'products'}
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-xl font-bold">Produits ({products.length})</h2>
      <button class="btn-primary" on:click={newProduct}>+ Nouveau produit</button>
    </div>
    {#if showForm && editing && 'product_name' in editing}
      <div class="card mb-4 grid md:grid-cols-2 gap-3">
        <input class="input" placeholder="Nom" bind:value={editing.product_name} />
        <input class="input" placeholder="SKU" bind:value={editing.sku} />
        <input class="input" placeholder="Categorie" bind:value={editing.category} />
        <input class="input" type="number" placeholder="Prix vente XAF" bind:value={editing.unit_price_xaf} />
        <input class="input" type="number" placeholder="Cout XAF" bind:value={editing.cost_price_xaf} />
        <input class="input" type="number" placeholder="Poids kg" bind:value={editing.weight_kg} />
        <input class="input" type="number" placeholder="Long cm" bind:value={editing.length_cm} />
        <input class="input" type="number" placeholder="Larg cm" bind:value={editing.width_cm} />
        <input class="input" type="number" placeholder="Haut cm" bind:value={editing.height_cm} />
        <input class="input" type="number" placeholder="Douane %" bind:value={editing.customs_rate} />
        <input class="input" type="number" placeholder="Stock qty" bind:value={editing.stock_qty} />
        <input class="input" type="number" placeholder="MOQ besoin" bind:value={editing.moq_needed} />
        <input class="input" type="number" placeholder="MOQ actuel" bind:value={editing.moq_current} />
        <select class="input" bind:value={editing.group_id}>
          <option value={null}>— Aucun groupe —</option>
          {#each groups as g}<option value={g.id}>{g.title}</option>{/each}
        </select>
        <textarea class="input md:col-span-2" rows="3" placeholder="Description" bind:value={editing.description}></textarea>
        <div class="md:col-span-2">
          <label class="label">Image produit</label>
          <input class="input" placeholder="URL image" bind:value={editing.image_url} />
          <input type="file" class="input mt-2" on:change={(e) => uploadImage(e, editing, 'image_url')} />
          {#if editing.image_url}<img src={editing.image_url} alt="" class="w-24 h-24 object-cover mt-2 rounded" />{/if}
        </div>
        <label class="flex items-center gap-2"><input type="checkbox" bind:checked={editing.is_instock} /> En stock</label>
        <label class="flex items-center gap-2"><input type="checkbox" bind:checked={editing.is_preorder} /> Precommande</label>
        <div class="md:col-span-2 flex gap-2">
          <button class="btn-primary" on:click={saveProduct}>Enregistrer</button>
          <button class="btn-outline" on:click={() => { showForm = false; editing = null; }}>Annuler</button>
        </div>
      </div>
    {/if}
    <div class="card overflow-auto">
      <table class="w-full text-sm">
        <thead><tr><th class="text-left">ID</th><th class="text-left">Nom</th><th>SKU</th><th>Prix</th><th>Stock</th><th></th></tr></thead>
        <tbody>
          {#each products as p}
            <tr class="border-b">
              <td>{p.id}</td>
              <td>{p.product_name}</td>
              <td>{p.sku}</td>
              <td>{Number(p.unit_price_xaf).toLocaleString()}</td>
              <td>{p.stock_qty}</td>
              <td class="text-right">
                <button class="text-blue-600 text-xs mr-2" on:click={() => { editing = { ...p, is_instock: !!p.is_instock, is_preorder: !!p.is_preorder }; showForm = true; }}>Editer</button>
                <button class="text-red-600 text-xs" on:click={() => del('products', p.id)}>Suppr</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if tab === 'services'}
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-xl font-bold">Services ({services.length})</h2>
      <button class="btn-primary" on:click={newService}>+ Nouveau service</button>
    </div>
    {#if showForm && editing && 'slug' in editing && !('content' in editing)}
      <div class="card mb-4 grid gap-3">
        <input class="input" placeholder="Slug (ex: sourcing)" bind:value={editing.slug} />
        <input class="input" placeholder="Titre" bind:value={editing.title} />
        <textarea class="input" rows="3" placeholder="Description" bind:value={editing.description}></textarea>
        <input class="input" placeholder="URL image" bind:value={editing.image_url} />
        <div class="flex gap-2">
          <button class="btn-primary" on:click={saveService}>Enregistrer</button>
          <button class="btn-outline" on:click={() => { showForm = false; editing = null; }}>Annuler</button>
        </div>
      </div>
    {/if}
    {#each services as s}
      <div class="card mb-2 flex justify-between items-center">
        <div><p class="font-semibold">{s.title}</p><p class="text-xs text-slate-500">/{s.slug}</p></div>
        <div>
          <button class="text-blue-600 text-xs mr-2" on:click={() => { editing = { ...s }; showForm = true; }}>Editer</button>
          <button class="text-red-600 text-xs" on:click={() => del('services', s.id)}>Suppr</button>
        </div>
      </div>
    {/each}
  {/if}

  {#if tab === 'blog'}
    <div class="flex justify-between items-center mb-3">
      <h2 class="text-xl font-bold">Articles ({posts.length})</h2>
      <button class="btn-primary" on:click={newPost}>+ Nouvel article</button>
    </div>
    {#if showForm && editing && 'content' in editing}
      <div class="card mb-4 grid gap-3">
        <input class="input" placeholder="Slug (ex: bienvenue)" bind:value={editing.slug} />
        <input class="input" placeholder="Titre" bind:value={editing.title} />
        <textarea class="input" rows="10" placeholder="Contenu (markdown accepte)" bind:value={editing.content}></textarea>
        <div class="flex gap-2">
          <button class="btn-primary" on:click={savePost}>Enregistrer</button>
          <button class="btn-outline" on:click={() => { showForm = false; editing = null; }}>Annuler</button>
        </div>
      </div>
    {/if}
    {#each posts as p}
      <div class="card mb-2 flex justify-between items-center">
        <div><p class="font-semibold">{p.title}</p><p class="text-xs text-slate-500">/{p.slug}</p></div>
        <div>
          <button class="text-blue-600 text-xs mr-2" on:click={async () => { const full = await fetch(`/api/blog/${p.slug}`).then(r => r.json()); editing = full; showForm = true; }}>Editer</button>
          <button class="text-red-600 text-xs" on:click={() => del('blog', p.id)}>Suppr</button>
        </div>
      </div>
    {/each}
  {/if}

  {#if tab === 'home'}
    <div class="card max-w-2xl grid gap-3">
      <h2 class="text-xl font-bold">Page d'accueil</h2>
      <label class="label">Titre principal</label>
      <input class="input" bind:value={hero.title} />
      <label class="label">Sous-titre</label>
      <textarea class="input" rows="2" bind:value={hero.subtitle}></textarea>
      <label class="label">Bouton 1 — texte</label>
      <input class="input" bind:value={hero.cta1_text} />
      <label class="label">Bouton 1 — lien</label>
      <input class="input" bind:value={hero.cta1_link} />
      <label class="label">Bouton 2 — texte</label>
      <input class="input" bind:value={hero.cta2_text} />
      <label class="label">Bouton 2 — lien</label>
      <input class="input" bind:value={hero.cta2_link} />
      <button class="btn-primary" on:click={saveHero}>Enregistrer</button>
    </div>
  {/if}
</div>
{/if}
