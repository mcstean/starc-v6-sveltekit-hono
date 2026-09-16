<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  // ─────────── Data (loaded from D1 via API) ───────────
  let hero = {
    title1: 'Vous avez déjà une boutique physique ?',
    title2: 'On vous aide à avoir une boutique en ligne — et on vous accompagne.',
    subtitle: 'Google Maps, Facebook, WhatsApp, TikTok & Instagram : on vous rend visible partout. Ces plateformes sont gratuites — vous payez seulement notre expertise. Paiement MoMo & Orange Money intégré. Puis on vous regroupe pour importer ensemble moins cher.',
    cta1_text: 'Devenir Visible — Local SEO', cta1_link: '/visibility',
    cta2_text: 'Voir Groupes Ouverts', cta2_link: '/shop'
  };
  let products: any[] = [];
  let groups: any[] = [];

  // ─────────── Carousels ───────────
  let packTrack: HTMLElement;
  let testiTrack: HTMLElement;
  let activePack = 0;
  let activeTesti = 0;
  let testiTimer: any;

  // ─────────── Static content ───────────
  const platforms = [
    { name: 'Google Maps', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', color: 'text-blue-600' },
    { name: 'Facebook', icon: 'M20 2H4a2 2 0 00-2 2v16a2 2 0 002 2h8.5v-7h-2.3v-2.7h2.3V9.8c0-2.2 1.3-3.4 3.3-3.4.9 0 1.7.1 2 .1v2.5h-1.4c-1.1 0-1.3.5-1.3 1.3v1.7h2.6l-.3 2.7h-2.3V22H20a2 2 0 002-2V4a2 2 0 00-2-2z', color: 'text-[#1877F2]' },
    { name: 'WhatsApp', icon: 'M12.031 2C6.495 2 2 6.494 2 12.029c0 1.996.586 3.86 1.6 5.438L2 22l4.71-1.542a9.98 9.98 0 005.321 1.572c5.535 0 10.03-4.494 10.03-10.029S17.566 2 12.031 2z', color: 'text-emerald-600' },
    { name: 'TikTok', icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z', color: 'text-black' },
    { name: 'Instagram', icon: 'M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.05.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.05.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 01-1.38-.9 3.7 3.7 0 01-.9-1.38c-.16-.42-.36-1.05-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07zm0 3.68a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm6.4-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z', color: 'text-[#E1306C]' }
  ];

  const packs = [
    { n: 0, name: 'Visibilité Base', price: 25000, negotiable: true, badge: 'Découverte',
      items: ['Fiche Google Maps vérifiée', 'Profil WhatsApp Business pro', 'Catalogue 10 articles', '1h de coaching agence Akwa'], kobo: 250 },
    { n: 1, name: 'Test Boss', price: 35000, badge: 'Rapide',
      items: ['Tout du Pack 0', 'Page Facebook Pro calibrée', 'Catalogue 20 articles + MoMo', 'Message de bienvenue WhatsApp'], kobo: 350 },
    { n: 2, name: 'Starter', price: 75000, badge: 'Recommandé', featured: true,
      items: ['5 plateformes complètes (Google, FB, WA, TikTok, IG)', 'Catalogue 50 produits synchronisé', 'SEO local par quartier (Akwa, Bonapriso)', 'Boutons paiement MTN MoMo & Orange Money', 'Suivi hebdo pendant 30 jours'], kobo: 750 },
    { n: 3, name: 'Pro', price: 150000, badge: 'Croissance',
      items: ['Tout du Pack 2', 'Bot WhatsApp conversationnel 24/7', 'Campagne Meta Ads ciblée Douala (budget exclu)', 'Shooting photo pro 15 articles'], kobo: 1500 },
    { n: 4, name: 'Full Boss Clone Factory', price: 350000, badge: 'Total',
      items: ['Déploiement multi-points Douala + Yaoundé', 'E-shop complet passerelle MoMo/OM', 'Account Manager dédié Akwa', 'Priorité absolue conteneur Njangui'], kobo: 3500 }
  ];

  const testimonials = [
    { initials: 'MK', name: 'Mireille K.', role: 'Boutique Akwa · Mode Féminine', color: 'bg-[#3B9AE1]',
      msg1: "Vraiment merci STARC ! Depuis la fiche Google Maps et le catalogue WhatsApp, les gens qui cherchent boutique à Akwa m'appellent direct. Mon CA a doublé en 3 semaines.",
      msg2: "Et le groupage Istanbul est arrivé sans casse au port. Tarif exact 2 500 F/kg respecté.", when: "Aujourd'hui · 14:12" },
    { initials: 'BT', name: 'Boris T.', role: 'Bonamoussadi · Électronique', color: 'bg-slate-700',
      msg1: "J'avais peur des arnaques de transit maritime en Chine. Avec STARC, le Njangui à 800 XAF/kg m'a permis de faire venir 350 kg d'accessoires sans payer un conteneur entier.",
      msg2: "Suivi clair et retrait propre à l'agence du Boulevard de la Liberté.", when: "Hier · 09:44" },
    { initials: 'SN', name: 'Sandrine N.', role: 'Bépanda · Parfumerie', color: 'bg-amber-500',
      msg1: "Le lien MoMo & Orange Money direct a mis fin aux faux reçus Photoshop. Maintenant tout est automatique et sécurisé.",
      msg2: "Et j'ai déjà 400 points KOBO cumulés sur mes expéditions Dubaï !", when: "Il y a 3 jours · 18:02" },
    { initials: 'EK', name: 'Emmanuel K.', role: 'Akwa · Déco & Rideaux', color: 'bg-emerald-600',
      msg1: "J'avais une boutique physique sans fiche Google pendant 3 ans. STARC m'a configuré le Starter en 5 jours.",
      msg2: "Maintenant les clients qui cherchent 'rideaux turcs Douala' m'appellent directement.", when: "Il y a 5 jours" }
  ];

  const faqsLeft = [
    { q: 'Dois-je payer un abonnement mensuel ?', a: "Non. Les plateformes (Google Maps, Meta, TikTok) sont gratuites d'accès. Vous ne réglez chez STARC qu'une prestation ponctuelle d'ingénierie et de configuration SEO." },
    { q: 'Comment validez-vous Google Maps sans courrier postal ?', a: "Nous utilisons nos accréditations locales et protocoles de vérification vidéo directe géo-taguée par nos agents basés à Akwa. Référencement effectif en 48h à 72h." },
    { q: 'Prenez-vous une commission sur les paiements MoMo ?', a: "Aucune commission. Les boutons de paiement Mobile Money et Orange Money installés pointent à 100% sur votre propre compte marchand." },
    { q: 'Si mon compte WhatsApp ou Facebook est bloqué ?', a: "Nous configurons selon les politiques anti-spam officielles de Meta. En cas de litige, notre bureau d'Akwa assiste directement les marchands." }
  ];

  const faqsRight = [
    { q: 'Que se passe-t-il si un groupage n\'atteint pas 100% ?', a: "STARC garantit les départs réguliers : dès que le quota minimal (70%) est atteint, nous complétons la réserve avec nos stocks propres. Votre marchandise n'est jamais bloquée." },
    { q: 'Le prix au kilo comprend-il les frais de douane ?', a: "Oui. Nos tarifs Njangui (ex: 800 XAF/kg Guangzhou) intègrent le fret maritime ET le dédouanement complet standard. Aucun frais caché à l'arrivée." },
    { q: 'Puis-je réexpédier vers Yaoundé ou Ndjamena ?', a: "Oui. Une fois votre lot réceptionné à Akwa, nos transporteurs partenaires assurent le dispatching vers toutes les villes du Cameroun et pays CEMAC." },
    { q: 'À quoi servent les points KOBO ?', a: "Les KOBO sont des crédits fidélité (1 KOBO = 1 XAF) utilisables pour réduire directement vos factures de fret futures ou financer des campagnes publicitaires locales." }
  ];

  // ─────────── Lifecycle ───────────
  onMount(async () => {
    try { const r = await fetch('/api/pages/home'); if (r.ok) hero = { ...hero, ...(await r.json()) }; } catch {}
    try { const r = await fetch('/api/products'); if (r.ok) products = await r.json(); } catch {}
    try { const r = await fetch('/api/groups'); if (r.ok) groups = await r.json(); } catch {}
    startTestiAutoScroll();
  });

  onDestroy(() => clearInterval(testiTimer));

  // ─────────── Carousel helpers ───────────
  function scrollPacks(dir: number) {
    if (!packTrack) return;
    packTrack.scrollBy({ left: dir * 340, behavior: 'smooth' });
  }
  function gotoPack(i: number) {
    if (!packTrack) return;
    const el = packTrack.querySelectorAll('.pack-card')[i] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    activePack = i;
  }

  function stepTesti(dir: 'next' | 'prev') {
    if (!testiTrack || testimonials.length === 0) return;
    activeTesti = (activeTesti + (dir === 'next' ? 1 : -1) + testimonials.length) % testimonials.length;
    const el = testiTrack.querySelectorAll('.testi-card')[activeTesti] as HTMLElement;
    if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
  function startTestiAutoScroll() {
    clearInterval(testiTimer);
    testiTimer = setInterval(() => stepTesti('next'), 4500);
  }
  function stopTestiAutoScroll() { clearInterval(testiTimer); }

  function formatXAF(n: number): string {
    return n.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');
  }
</script>

<svelte:head>
  <title>STARC Enterprise — Devenez visible, importez ensemble | Douala</title>
  <meta name="description" content="Plateforme de facilitation à Douala. Visibilité Google/Facebook/WhatsApp/TikTok/Instagram + groupage d'import Chine, Turquie, Dubaï." />
</svelte:head>

<!-- ════════════ HERO ════════════ -->
<section class="relative bg-gradient-to-b from-sky-50/60 via-slate-50 to-white pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
  <div class="absolute -top-24 right-0 w-[500px] h-[500px] bg-[#3B9AE1]/10 rounded-full blur-3xl pointer-events-none"></div>
  <div class="max-w-7xl mx-auto px-4 md:px-6 relative">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

      <!-- Left 60% -->
      <div class="lg:col-span-7">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-200 mb-5">
          <span>🇨🇲</span>
          <span class="text-[11px] font-bold uppercase tracking-wider text-slate-600">Douala · Local SEO Specialist</span>
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        </div>

        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.08] mb-5">
          {hero.title1}
          <span class="block text-[#3B9AE1] mt-2">{hero.title2}</span>
        </h1>

        <!-- Platform badges -->
        <div class="flex flex-wrap gap-2 mb-6">
          {#each platforms as p}
            <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-sm border border-slate-200">
              <svg class="w-4 h-4 {p.color}" viewBox="0 0 24 24" fill="currentColor"><path d={p.icon}/></svg>
              <span class="text-xs font-semibold text-slate-700">{p.name}</span>
            </div>
          {/each}
        </div>

        <p class="text-base md:text-lg text-slate-600 max-w-2xl leading-relaxed mb-7">
          {hero.subtitle}
        </p>

        <div class="flex flex-col sm:flex-row gap-3">
          <a href={hero.cta1_link} class="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#3B9AE1] hover:bg-[#2980C0] text-white font-bold shadow-md hover:shadow-lg transition-all">
            <span>{hero.cta1_text}</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
          </a>
          <a href={hero.cta2_link} class="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-sm transition-all">
            <span>👥</span>
            <span>{hero.cta2_text}</span>
          </a>
        </div>

        <div class="flex flex-wrap items-center gap-4 mt-6 text-xs text-slate-500">
          <span class="flex items-center gap-1.5"><span class="text-emerald-600">✓</span> Sans abonnement mensuel</span>
          <span class="flex items-center gap-1.5"><span class="text-amber-500">★</span> +150 KOBO offerts</span>
          <span class="flex items-center gap-1.5"><span class="text-blue-600">◆</span> MoMo / OM acceptés</span>
        </div>
      </div>

      <!-- Right 40% : phone + whatsapp preview -->
      <div class="lg:col-span-5 relative flex justify-center lg:justify-end">
        <div class="relative w-[300px] md:w-[330px] bg-white rounded-[36px] p-3 shadow-2xl border border-slate-200">
          <div class="bg-slate-50 rounded-[28px] p-4 flex flex-col gap-3">
            <div class="flex justify-between items-center px-1 text-[10px] font-semibold text-slate-500">
              <span>10:42</span><div class="w-14 h-3.5 bg-slate-300 rounded-full"></div><span>●●●</span>
            </div>

            <!-- Google Maps card -->
            <div class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-100">
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="flex items-center gap-1">
                    <span class="text-sm font-bold text-slate-900">Kamer Tech & Chic</span>
                    <span class="text-[#3B9AE1]">✓</span>
                  </div>
                  <span class="text-[10px] text-slate-500">Boulevard de la Liberté · Ouvert 24/7</span>
                </div>
                <span class="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">Vérifié</span>
              </div>
              <div class="flex items-center gap-1.5 mb-2 text-xs">
                <span class="text-amber-500">★★★★★</span>
                <span class="font-bold text-slate-900">5.0</span>
                <span class="text-slate-500 text-[10px]">(142 avis)</span>
              </div>
              <div class="grid grid-cols-3 gap-1 py-2 text-center text-[9px] font-bold text-[#3B9AE1]">
                <div class="bg-blue-50 rounded py-1.5">+412% appels</div>
                <div class="bg-blue-50 rounded py-1.5">3.8k vues</div>
                <div class="bg-blue-50 rounded py-1.5">Top #1 Akwa</div>
              </div>
            </div>

            <!-- WhatsApp biz card -->
            <div class="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
              <div class="flex items-center gap-2 mb-2">
                <div class="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">SC</div>
                <div>
                  <span class="text-xs font-bold text-slate-900 block">Catalogue STARC Biz</span>
                  <span class="text-[9px] text-emerald-600">En ligne · Paiement Direct</span>
                </div>
              </div>
              <div class="bg-slate-50 rounded-lg p-2 text-[10px] text-slate-700 leading-snug">
                « Bonjour ! Commande 2x Colis vérifiée. Lien Orange Money généré. »
              </div>
            </div>
          </div>
        </div>

        <!-- Floating stat -->
        <div class="absolute -top-3 -left-3 bg-white rounded-2xl p-3 shadow-xl flex items-center gap-2 border border-slate-100">
          <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 text-lg">◉</div>
          <div>
            <span class="text-sm font-black text-slate-900 block leading-none">14 850</span>
            <span class="text-[10px] text-slate-500">Recherches / mois</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ════════════ STATS BAR ════════════ -->
<section class="bg-slate-900 text-white py-6">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 divide-slate-800 md:divide-x">
      <div class="text-center md:text-left px-2">
        <div class="text-3xl md:text-4xl font-black text-[#3B9AE1]">12<span class="text-amber-400 text-lg ml-1">HQ</span></div>
        <div class="text-xs font-semibold text-slate-300 mt-1">Conteneurs livrés</div>
        <div class="text-[10px] text-slate-500">Port Autonome de Douala</div>
      </div>
      <div class="text-center md:text-left px-2">
        <div class="text-3xl md:text-4xl font-black">500+</div>
        <div class="text-xs font-semibold text-slate-300 mt-1">Commerçants accompagnés</div>
        <div class="text-[10px] text-slate-500">Akwa, Bonamoussadi, Yaoundé</div>
      </div>
      <div class="text-center md:text-left px-2">
        <div class="text-3xl md:text-4xl font-black text-amber-400">5</div>
        <div class="text-xs font-semibold text-slate-300 mt-1">Plateformes maîtrisées</div>
        <div class="text-[10px] text-slate-500">Google · Meta · TikTok · WA · IG</div>
      </div>
      <div class="text-center md:text-left px-2">
        <div class="flex items-center justify-center md:justify-start gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span class="text-2xl md:text-3xl font-black">Hub Akwa</span>
        </div>
        <div class="text-xs font-semibold text-slate-300 mt-1">Agence physique Douala</div>
        <div class="text-[10px] text-slate-500">Support 7j/7 direct</div>
      </div>
    </div>
  </div>
</section>

<!-- ════════════ DIVISION 1 : CAROUSEL PACKS ════════════ -->
<section class="py-16 md:py-20 bg-slate-50" id="visibilite">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
      <div class="max-w-2xl">
        <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#3B9AE1]/15 text-[#3B9AE1] text-[11px] font-bold uppercase tracking-wider mb-3">
          <span>◆</span> Division 1 · Local SEO
        </div>
        <h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          GESTION PRÉSENCE EN LIGNE
        </h2>
        <p class="text-lg text-slate-600 mt-2">
          Devenez trouvable partout. 5 plateformes, aucun abonnement, vous payez seulement notre expertise.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button on:click={() => scrollPacks(-1)} aria-label="Précédent" class="w-11 h-11 rounded-full bg-white hover:bg-slate-900 hover:text-white text-slate-900 flex items-center justify-center shadow-sm border border-slate-200 transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button on:click={() => scrollPacks(1)} aria-label="Suivant" class="w-11 h-11 rounded-full bg-slate-900 hover:bg-[#3B9AE1] text-white flex items-center justify-center shadow-sm transition-all">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>

    <!-- Bonus banner -->
    <div class="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">★</div>
        <span class="text-sm font-bold text-amber-900">
          Bonus Fidélité : +150 KOBO offerts pour tout acompte versé via MTN MoMo ou Orange Money.
        </span>
      </div>
      <span class="px-3 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider shrink-0">Offre actuelle</span>
    </div>

    <!-- Carousel track -->
    <div bind:this={packTrack} class="flex gap-5 overflow-x-auto pb-6 scroll-smooth snap-x snap-mandatory" style="scrollbar-width:none;">
      {#each packs as p (p.n)}
        <div class="pack-card w-[290px] md:w-[310px] shrink-0 snap-start bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-lg transition-all {p.featured ? 'ring-2 ring-[#3B9AE1] relative' : ''}">
          {#if p.featured}
            <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase tracking-wider">★ Recommandé</div>
          {/if}
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pack {p.n}</span>
              <span class="px-2 py-0.5 rounded-full {p.negotiable ? 'bg-amber-100 text-amber-800' : p.featured ? 'bg-[#3B9AE1] text-white' : 'bg-slate-100 text-slate-700'} text-[10px] font-bold uppercase">{p.badge}</span>
            </div>
            <h3 class="text-xl font-black text-slate-900 mb-1">{p.name}</h3>
            <div class="flex items-baseline gap-1 mb-5">
              <span class="text-3xl font-black text-[#3B9AE1]">{formatXAF(p.price)}</span>
              <span class="text-xs font-bold text-slate-500 uppercase">XAF</span>
            </div>
            <ul class="flex flex-col gap-2.5 mb-5 text-xs text-slate-700">
              {#each p.items as it}
                <li class="flex items-start gap-2">
                  <span class="text-emerald-600 shrink-0 mt-0.5">✓</span>
                  <span>{it}</span>
                </li>
              {/each}
            </ul>
          </div>
          <div class="pt-3 border-t border-slate-100">
            <div class="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-1 rounded text-center mb-3">
              +{formatXAF(p.kobo)} KOBO crédités
            </div>
            <a href="/visibility" class="block w-full py-2.5 rounded-lg {p.featured ? 'bg-[#3B9AE1] hover:bg-[#2980C0] text-white' : 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800'} text-center text-xs font-bold transition-colors">
              Choisir ce pack
            </a>
          </div>
        </div>
      {/each}
    </div>

    <!-- Dots -->
    <div class="flex justify-center gap-2 mt-2">
      {#each packs as p, i}
        <button on:click={() => gotoPack(i)} aria-label="Pack {i}" class="h-2.5 rounded-full transition-all {activePack === i ? 'w-6 bg-[#3B9AE1]' : 'w-2.5 bg-slate-300 hover:bg-slate-400'}"></button>
      {/each}
    </div>
  </div>
</section>

<!-- ════════════ DIVISION 2 : GROUPES NJANGUI ════════════ -->
<section class="py-16 md:py-20 bg-white" id="njangui">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="max-w-3xl mb-10">
      <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider mb-3">
        <span>⚓</span> Division 2 · Logistique
      </div>
      <h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
        Vous êtes visible, maintenant importez ensemble moins cher
      </h2>
      <p class="text-lg text-slate-600 mt-2">
        Le principe du Njangui camerounais appliqué au conteneur. Mettez vos volumes en commun pour débloquer les tarifs réservés aux mastodontes.
      </p>
    </div>

    <!-- 4 steps -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
      {#each [{n:'01', t:'Proposez poids & dim.', d:'Renseignez votre marchandise, CBM estimé et provenance.'},{n:'02', t:'Recherche co-importateurs', d:'STARC agrège les commerçants de Douala sur la même ligne.'},{n:'03', t:'Acompte 30% sécurisé', d:'Versement séquestre MoMo ou Orange Money pro.'},{n:'04', t:'Clôture & dédouanement', d:'Départ immédiat. Retrait au Hub Akwa.'}] as s}
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative overflow-hidden">
          <span class="absolute top-2 right-3 text-4xl font-black text-slate-200 select-none">{s.n}</span>
          <div class="w-9 h-9 rounded-lg bg-[#3B9AE1]/15 text-[#3B9AE1] flex items-center justify-center mb-3 font-bold text-sm">{s.n}</div>
          <h3 class="text-sm font-bold text-slate-900 mb-1">{s.t}</h3>
          <p class="text-xs text-slate-600 leading-relaxed">{s.d}</p>
        </div>
      {/each}
    </div>

    <!-- Live groups -->
    {#if groups.length === 0}
      <div class="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <p class="text-slate-500 text-sm">Aucun groupage ouvert pour l'instant. Revenez bientôt !</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {#each groups.slice(0, 3) as g (g.id)}
          <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="text-2xl">{g.origin_country === 'Turkey' ? '🇹🇷' : g.origin_country === 'China' ? '🇨🇳' : '🇦🇪'}</span>
                  <div>
                    <span class="text-sm font-black text-slate-900 block">{g.origin_country}</span>
                    <span class="text-[10px] text-slate-500">→ Douala</span>
                  </div>
                </div>
                <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                  {g.shipping_mode === 'AIR' ? '✈️ Air' : '🚢 Mer'}
                </span>
              </div>
              <h3 class="text-base font-extrabold text-slate-900 mb-3">{g.title}</h3>
              <div class="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl mb-3 text-xs">
                <div>
                  <span class="text-slate-500 block text-[10px]">Tarif / kg</span>
                  <span class="font-bold text-[#3B9AE1] text-sm">{formatXAF(g.shipping_cost_per_kg || 2500)} XAF</span>
                </div>
                <div>
                  <span class="text-slate-500 block text-[10px]">Cumul actuel</span>
                  <span class="font-bold text-slate-900 text-sm">{g.total_weight_kg || 0} kg</span>
                </div>
              </div>
            </div>
            <a href="/preorder/{g.id}" class="block w-full py-2.5 rounded-xl bg-slate-900 hover:bg-[#3B9AE1] text-white text-xs font-bold text-center transition-colors">
              Rejoindre ce groupage
            </a>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- ════════════ BOUTIQUE PREVIEW ════════════ -->
<section class="py-16 md:py-20 bg-slate-50" id="boutique">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
      <div>
        <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#3B9AE1]/15 text-[#3B9AE1] text-[11px] font-bold uppercase tracking-wider mb-3">
          <span>◆</span> Boutique
        </div>
        <h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Boutique & Opportunités</h2>
        <p class="text-base text-slate-600 mt-1">Produits au Hub Akwa ou en cours d'acheminement.</p>
      </div>
      <a href="/shop" class="text-sm font-bold text-[#3B9AE1] hover:underline">Voir tout →</a>
    </div>

    {#if products.length === 0}
      <div class="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center">
        <p class="text-slate-500 text-sm">Chargement des produits…</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {#each products.slice(0, 4) as p (p.id)}
          <a href="/product/{p.id}" class="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col">
            <div class="relative h-40 bg-slate-100">
              {#if p.image_url}
                <img src={p.image_url} alt={p.product_name} class="w-full h-full object-cover">
              {:else}
                <div class="w-full h-full flex items-center justify-center text-slate-300 text-4xl">◻</div>
              {/if}
              <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full {p.is_instock ? 'bg-emerald-600' : 'bg-amber-500'} text-white text-[10px] font-bold uppercase">
                {p.is_instock ? 'INSTOCK' : 'PRÉCOMMANDE'}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900 line-clamp-2 mb-2">{p.product_name}</h3>
                <div class="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
                  <span>{p.weight_kg || '?'} kg</span>
                  <span>·</span>
                  <span>{p.length_cm || '?'}×{p.width_cm || '?'}×{p.height_cm || '?'} cm</span>
                </div>
                {#if p.cbm}<span class="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mb-2">CBM {p.cbm}</span>{/if}
              </div>
              <div class="flex items-baseline justify-between pt-2 border-t border-slate-100">
                <span class="text-base font-black text-[#3B9AE1]">{formatXAF(p.unit_price_xaf)} <span class="text-[10px] text-slate-500 font-bold">XAF</span></span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</section>

<!-- ════════════ TESTIMONIALS AUTO-SCROLL ════════════ -->
<section class="py-16 md:py-20 bg-white overflow-hidden"
         on:mouseenter={stopTestiAutoScroll}
         on:mouseleave={startTestiAutoScroll}>
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
      <div>
        <span class="text-[11px] font-bold uppercase tracking-wider text-[#3B9AE1]">Preuve tangible</span>
        <h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1">Ce que disent les commerçants</h2>
        <p class="text-base text-slate-600 mt-1">Retours d'expérience vérifiés sur notre ligne WhatsApp.</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Défilement auto</span>
        <button on:click={() => { stopTestiAutoScroll(); stepTesti('prev'); startTestiAutoScroll(); }} class="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-all" aria-label="Précédent">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button on:click={() => { stopTestiAutoScroll(); stepTesti('next'); startTestiAutoScroll(); }} class="w-10 h-10 rounded-full bg-slate-900 hover:bg-[#3B9AE1] text-white flex items-center justify-center transition-all" aria-label="Suivant">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>

    <div bind:this={testiTrack} class="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth" style="scrollbar-width:none;">
      {#each testimonials as t (t.name)}
        <div class="testi-card w-[320px] md:w-[380px] shrink-0 snap-start bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div class="flex items-center gap-3 pb-3 mb-3 border-b border-slate-200">
            <div class="w-9 h-9 rounded-full {t.color} text-white flex items-center justify-center font-bold text-xs">{t.initials}</div>
            <div>
              <span class="text-xs font-bold text-slate-900 block">{t.name}</span>
              <span class="text-[10px] text-slate-500">{t.role}</span>
            </div>
            <span class="ml-auto text-emerald-600 text-xs">✓</span>
          </div>
          <div class="space-y-2.5 text-xs">
            <div class="bg-white rounded-xl rounded-tl-none p-3 text-slate-700 leading-relaxed">{t.msg1}</div>
            <div class="bg-emerald-50 rounded-xl rounded-tr-none p-2.5 text-emerald-900 leading-relaxed ml-4">{t.msg2}</div>
          </div>
          <div class="flex justify-between items-center mt-4 pt-3 border-t border-slate-200 text-[10px] text-slate-500">
            <span>{t.when}</span>
            <span class="text-emerald-600 font-bold">✓✓ Lu</span>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- ════════════ FAQ 2 COLONNES ════════════ -->
<section class="py-16 md:py-20 bg-slate-50">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <span class="text-[11px] font-bold uppercase tracking-wider text-[#3B9AE1]">Questions fréquentes</span>
      <h2 class="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mt-1">Réponses claires, sans détour</h2>
    </div>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-black text-[#3B9AE1] uppercase tracking-wider mb-1">1 · Visibilité & SEO</h3>
        {#each faqsLeft as f}
          <details class="group bg-white rounded-xl border border-slate-200 overflow-hidden">
            <summary class="cursor-pointer px-4 py-3.5 font-bold text-sm text-slate-900 flex justify-between items-center hover:bg-slate-50">
              <span>{f.q}</span>
              <span class="text-[#3B9AE1] group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p class="px-4 pb-4 text-xs text-slate-600 leading-relaxed">{f.a}</p>
          </details>
        {/each}
      </div>
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-black text-amber-600 uppercase tracking-wider mb-1">2 · Groupage Njangui</h3>
        {#each faqsRight as f}
          <details class="group bg-white rounded-xl border border-slate-200 overflow-hidden">
            <summary class="cursor-pointer px-4 py-3.5 font-bold text-sm text-slate-900 flex justify-between items-center hover:bg-slate-50">
              <span>{f.q}</span>
              <span class="text-amber-500 group-open:rotate-45 transition-transform text-lg leading-none">+</span>
            </summary>
            <p class="px-4 pb-4 text-xs text-slate-600 leading-relaxed">{f.a}</p>
          </details>
        {/each}
      </div>
    </div>
  </div>
</section>

<!-- ════════════ FINAL CTA ════════════ -->
<section class="py-16 md:py-20 bg-gradient-to-br from-[#3B9AE1] to-[#2980C0] text-white">
  <div class="max-w-7xl mx-auto px-4 md:px-6">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      <div class="lg:col-span-7">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-[11px] font-bold uppercase tracking-wider mb-4">
          <span class="w-1.5 h-1.5 rounded-full bg-white"></span> Permanence Akwa · Réponse rapide
        </div>
        <h2 class="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
          Passez de l'ombre à la vente dès cette semaine.
        </h2>
        <p class="text-base md:text-lg text-white/90 max-w-xl mb-6">
          Activez votre présence sur les 5 plateformes ou suivez votre conteneur en direct depuis Douala.
        </p>
        <div class="flex flex-wrap gap-3">
          <a href="https://wa.me/237600000000" target="_blank" rel="noopener" class="px-6 py-3.5 rounded-xl bg-white text-[#3B9AE1] hover:bg-slate-100 font-bold shadow-lg transition-all">
            💬 Parler à un spécialiste
          </a>
          <a href="#visibilite" class="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-all">
            Consulter la grille
          </a>
        </div>
      </div>
      <div class="lg:col-span-5">
        <div class="bg-white text-slate-900 rounded-2xl p-6 shadow-2xl">
          <div class="flex items-center gap-2 mb-3">
            <span class="text-2xl">◉</span>
            <h3 class="text-sm font-black">Suivi rapide de colis</h3>
          </div>
          <p class="text-xs text-slate-600 mb-4">Entrez votre référence STARC pour localiser votre conteneur.</p>
          <div class="flex gap-2">
            <input type="text" placeholder="ST-XXX-2026-XXX" class="flex-1 px-3 py-2.5 rounded-lg bg-slate-100 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3B9AE1]">
            <button class="px-4 py-2.5 rounded-lg bg-[#3B9AE1] hover:bg-[#2980C0] text-white text-xs font-bold transition-colors">Chercher</button>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
            <span>Hub Akwa actif</span>
            <span class="text-[#3B9AE1] font-bold">Port Douala</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
