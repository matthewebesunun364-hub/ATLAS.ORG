/* ===========================================================
   AYOOLA ENTERPRISES - home page
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, C = S.C, $ = S.$, $$ = S.$$;

  /* ---------- HERO SLIDER ---------- */
  const slides = document.querySelector('[data-slides]');
  if (slides) {
    const total = slides.children.length;
    const dots = document.querySelector('[data-dots]');
    let i = 0, timer;

    for (let n = 0; n < total; n++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to slide ' + (n + 1));
      b.addEventListener('click', () => go(n));
      dots.appendChild(b);
    }

    function go(n) {
      i = (n + total) % total;
      slides.style.transform = 'translateX(-' + i * 100 + '%)';
      Array.prototype.forEach.call(dots.children, (d, k) => d.classList.toggle('on', k === i));
      restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(i + 1), 6000);
    }

    $$('[data-slide]').forEach((b) =>
      b.addEventListener('click', () => go(i + Number(b.dataset.slide))));

    go(0);
  }

  /* ---------- CATEGORY TILES ---------- */
  const catBox = document.querySelector('[data-cats]');
  if (catBox) {
    catBox.innerHTML = A.CATEGORIES.map(function (c) {
      const n = A.PRODUCTS.filter((p) => p.cat === c.id).length;
      return '<a href="category.html?cat=' + c.id + '">' +
        '<span class="e">' + c.emoji + '</span>' +
        '<b>' + S.esc(c.name) + '</b>' +
        '<small>' + S.esc(c.note) + '</small>' +
        '<small class="count-n">' + n + ' items</small>' +
      '</a>';
    }).join('');
  }

  /* ---------- DELIVERY AREAS ---------- */
  const areaBox = document.querySelector('[data-areas]');
  if (areaBox && C.areas) {
    areaBox.innerHTML = C.areas.map((a) => '<li>' + S.esc(a) + '</li>').join('');
  }

  /* ---------- SORTED LISTS ---------- */
  const byDiscount = () => A.PRODUCTS.filter((p) => A.discount(p) > 0)
    .sort((a, b) => A.discount(b) - A.discount(a));
  const bySold = () => A.PRODUCTS.slice().sort((a, b) => A.sold(b) - A.sold(a));

  const lists = {
    deals:   byDiscount().slice(0, 10),
    popular: bySold().slice(0, 10),
    best:    A.PRODUCTS.filter((p) => p.cat === 'foodstuffs').slice(0, 8),
    new:     A.PRODUCTS.slice(-10).reverse(),
  };

  Object.keys(lists).forEach((key) => {
    S.renderGrid(document.querySelector('[data-panel-grid="' + key + '"]'), lists[key]);
  });

  S.renderGrid(document.querySelector('[data-deals]'), byDiscount().slice(0, 4));
  S.renderGrid(document.querySelector('[data-best]'),
    A.PRODUCTS.filter((p) => p.cat === 'foodstuffs').sort((a, b) => A.sold(b) - A.sold(a)).slice(0, 4));
  S.renderGrid(document.querySelector('[data-bundles]'), A.PRODUCTS.filter((p) => p.cat === 'bundles'));

  /* ---------- TABS ---------- */
  const tabs = document.querySelector('[data-tabs]');
  if (tabs) {
    tabs.addEventListener('click', function (e) {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      const key = b.dataset.tab;
      $$('[data-tab]', tabs).forEach((x) => x.classList.toggle('on', x === b));
      $$('[data-panel]').forEach((p) => p.classList.toggle('on', p.dataset.panel === key));
    });
  }

  /* ---------- FLASH SALE ---------- */
  const flash = document.querySelector('[data-flash]');
  if (flash) {
    const rows = byDiscount().slice(0, 10);
    if (rows.length) {
      S.renderGrid(document.querySelector('[data-flash-row]'), rows);
      flash.hidden = false;
      tick();
      setInterval(tick, 1000);
    }

    function tick() {
      const end = C.flashSaleEnds ? new Date(C.flashSaleEnds).getTime() : midnight();
      const left = Math.max(0, Math.floor((end - Date.now()) / 1000));
      const set = function (sel, v) {
        const el = document.querySelector(sel);
        if (el) el.textContent = String(v).padStart(2, '0');
      };
      set('[data-countdown] [data-h]', Math.floor(left / 3600));
      set('[data-countdown] [data-m]', Math.floor((left % 3600) / 60));
      set('[data-countdown] [data-s]', left % 60);
    }
    /* no date configured: a 24h cycle that resets at midnight */
    function midnight() {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    }
  }

  /* ---------- FAQ + FAQPage schema ---------- */
  const FAQ = [
    { q: 'Do you deliver food in Akure?',
      a: 'Yes. We deliver anywhere inside Akure with our own rider. Order before 2pm for same-day delivery. ' +
         'Delivery is ' + A.money(C.deliveryFee) + ', and free on orders above ' + A.money(C.freeDeliveryOver) + '.' },
    { q: 'What areas of Akure do you cover?',
      a: 'Akure township, Alagbaka, Ibara, Oke-Ako, Ilesha, Ile Alafia, the Oba Palace area, Ado Ekiti road ' +
         'and Federal Palace way. If you are just outside Akure, message us first and we will tell you.' },
    { q: 'Can I pay by card, bank transfer or cash?',
      a: 'All three. Pay online by card or bank transfer at checkout, or choose cash on delivery and pay our ' +
         'rider when the food arrives.' },
    { q: 'Do you sell wholesale as well as retail?',
      a: 'Yes. Single bags for the house, full cartons, kegs and bundles for shops and restaurants. Send us a ' +
         'quote request and we will price the whole basket.' },
    { q: 'Do you deliver frozen fish and chicken?',
      a: 'Yes. Tilapia, croaker, mackerel, prawns, cuttle fish, whole chicken, turkey, gizzard and breast, ' +
         'packed in insulated boxes so they stay frozen on the way to you.' },
    { q: 'How do I order for a party or event?',
      a: 'Send your budget, the number of guests and the venue address. We build the basket, call you to agree ' +
         'it, then you pay. Drinks crates and family bundles are the most popular.' },
  ];

  const faqBox = document.querySelector('[data-faq]');
  if (faqBox) {
    faqBox.innerHTML = FAQ.map(function (f, n) {
      return '<div class="panel-box" style="padding:1rem">' +
        '<h3 style="font-family:var(--serif);font-size:1.05rem;margin-bottom:.4rem">' +
          S.esc(f.q) + '</h3>' +
        '<p style="font-size:.82rem;color:var(--muted)">' + S.esc(f.a) + '</p>' +
      '</div>';
    }).join('');

    const ld = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  }
});
