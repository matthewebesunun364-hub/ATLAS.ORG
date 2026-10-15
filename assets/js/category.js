/* ===========================================================
   AYOOLA ENTERPRISES - category / search / listing page
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, $ = S.$, $$ = S.$$;

  const params = new URLSearchParams(location.search);
  const state = {
    q: (params.get('q') || '').trim(),
    cats: params.get('cat') ? [params.get('cat')] : [],
    brands: [],
    range: '',
    deal: false,
    big: false,
    sort: params.get('sort') || 'featured',
    page: 1,
    per: 24,
  };

  /* ---------- facets ---------- */
  const catBox = $('[data-facet-cat]');
  catBox.innerHTML = A.CATEGORIES.map((c) => {
    const n = A.PRODUCTS.filter((p) => p.cat === c.id).length;
    return '<label><input type="checkbox" name="cat" value="' + c.id + '"' +
      (state.cats.indexOf(c.id) > -1 ? ' checked' : '') + '> ' +
      S.esc(c.name) + '<span class="cnt">' + n + '</span></label>';
  }).join('');

  const brands = A.PRODUCTS.map((p) => p.brand).filter((v, i, a) => v && a.indexOf(v) === i).sort();
  $('[data-facet-brand]').innerHTML = brands.map((b) => {
    const n = A.PRODUCTS.filter((p) => p.brand === b).length;
    return '<label><input type="checkbox" name="brand" value="' + S.esc(b) + '"> ' +
      S.esc(b) + '<span class="cnt">' + n + '</span></label>';
  }).join('');

  /* ---------- heading / breadcrumbs / per-category SEO ---------- */
  const SEO = {
    foodstuffs: {
      title: 'Foodstuff in Akure | Rice, Beans, Semo, Yam | Ayoola Enterprise',
      desc: 'Buy foodstuff in Akure: parboiled rice, brown beans, semo, yam, garri, egusi, amala and ripe plantain. Wholesale and retail prices with delivery across Akure, Ondo State.',
      h: 'Foodstuff and groceries in Akure',
      intro: 'Rice, beans, semo, yam, garri, egusi, amala flour and ripe plantain, sold by the bag or the bowl. Order online for delivery anywhere in Akure.',
    },
    frozen: {
      title: 'Frozen Foods in Akure | Frozen Fish and Prawns | Ayoola Enterprise',
      desc: 'Frozen food supplier in Akure: whole tilapia, mackerel, croaker, prawns, cuttle fish and shark. Packed cold and delivered across Akure, Ondo State.',
      h: 'Frozen foods in Akure',
      intro: 'Whole tilapia, mackerel, croaker, prawns, cuttle fish and shark, kept frozen and delivered in insulated boxes anywhere in Akure.',
    },
    poultry: {
      title: 'Frozen Chicken and Poultry in Akure | Ayoola Enterprise',
      desc: 'Frozen chicken in Akure: whole chicken cartons, turkey, chicken gizzard and boneless breast. Wholesale and retail supply delivered across Akure, Ondo State.',
      h: 'Frozen chicken and poultry in Akure',
      intro: 'Whole chicken in 10kg and 20kg cartons, turkey, gizzard and boneless breast, delivered frozen across Akure.',
    },
    drinks: {
      title: 'Drinks in Akure | Soft Drinks, Malt, Juice and Water | Ayoola Enterprise',
      desc: 'Buy drinks in Akure: Coca-Cola, malt, fruit juice, table water, energy drinks, Fanta and wine, sold by the bottle, the dozen or the full crate.',
      h: 'Drinks and beverages in Akure',
      intro: 'Soft drinks, malt, juice, table water, energy drinks and wine, sold singly, by the twelve or by the full crate for events in Akure.',
    },
    oils: {
      title: 'Palm Oil, Tomato Paste and Seasoning Cubes in Akure | Ayoola Enterprise',
      desc: 'Buy palm oil, soya oil, tomato paste, seasoning cubes and blended spices in Akure. Retail and 25L keg sizes with delivery across Akure, Ondo State.',
      h: 'Oils and seasoning in Akure',
      intro: 'Palm oil by the 5L or 25L keg, soya oil, tomato paste, bouillon cubes and blended herbs and spices for stews and fried rice.',
    },
    noodles: {
      title: 'Noodles and Pasta in Akure | Indomie, Spaghetti | Ayoola Enterprise',
      desc: 'Buy noodles and pasta in Akure: Indomie cartons, spaghetti, dry noodles and pasta. Wholesale and retail supply with delivery across Akure, Ondo State.',
      h: 'Noodles and pasta in Akure',
      intro: 'Indomie by the carton, spaghetti, dry noodles and pasta, for homes, offices and food businesses in Akure.',
    },
    snacks: {
      title: 'Groceries in Akure | Sugar, Biscuits, Milk, Salt and Tins | Ayoola Enterprise',
      desc: 'Buy groceries in Akure: granulated sugar, biscuits, evaporated and powdered milk, table salt and tinned tomato. Delivered across Akure, Ondo State.',
      h: 'Groceries and everyday essentials in Akure',
      intro: 'Sugar, biscuits, evaporated and powdered milk, table salt and tinned tomato for tea, pap, baking and cooking.',
    },
    bundles: {
      title: 'Wholesale Food Bundles in Akure | Shop Starter Packs | Ayoola Enterprise',
      desc: 'Pre-packed wholesale food bundles in Akure for shops, restaurants and events: shop starter packs, family baskets, drinks crates and frozen fish bundles.',
      h: 'Wholesale food bundles in Akure',
      intro: 'Pre-packed baskets for a retail shop, a month of food for a family, mixed drinks crates and frozen fish packs, all at one wholesale rate.',
    },
  };

  function paintHead() {
    const one = state.cats.length === 1 ? A.cat(state.cats[0]) : null;
    const seo = one ? SEO[one.id] : null;
    const title = seo ? seo.title
                : state.q ? 'Search results for ' + state.q + ' | Ayoola Enterprise'
                : 'Buy foodstuff, groceries and frozen foods in Akure | Ayoola Enterprise';
    const desc = seo ? seo.desc
               : 'Browse foodstuffs, frozen fish, poultry, drinks, oils, snacks and wholesale bundles from Ayoola Enterprise in Akure, Ondo State. Delivery across Akure.';

    document.title = title;

    const md = document.querySelector('meta[name=description]');
    if (md) md.setAttribute('content', desc);
    const ogT = document.querySelector('meta[property="og:title"]');
    if (ogT) ogT.setAttribute('content', title);
    const ogD = document.querySelector('meta[property="og:description"]');
    if (ogD) ogD.setAttribute('content', desc);

    /* self-canonicalise only a real category page, never a search result */
    if (seo) {
      const url = 'https://ayoola-enterprise.pages.dev/category.html?cat=' + one.id;
      let can = document.querySelector('link[rel=canonical]');
      if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
      can.href = url;
      const ogU = document.querySelector('meta[property="og:url"]');
      if (ogU) ogU.setAttribute('content', url);
      injectCategorySchema(one, seo);
    }

    $('[data-crumbs]').innerHTML =
      '<a href="index.html">Home</a><span>&rsaquo;</span>' +
      (one ? '<a href="category.html">' + S.esc(one.name) + '</a>' : '<span>All products</span>');

    const h = document.createElement('div');
    h.className = 'sec-h';
    h.innerHTML = '<h1>' + S.esc(seo ? seo.h : (state.q ? 'Search results' : 'All products in Akure')) + '</h1>' +
      '<span class="more">' + S.esc(one ? one.note : 'Foodstuff, groceries, frozen foods and drinks') + '</span>';
    $('.shop').parentNode.insertBefore(h, $('.shop'));

    /* one short, useful paragraph per category page */
    if (seo) {
      const box = document.createElement('div');
      box.className = 'ribbon-strip';
      box.setAttribute('data-cat-intro', '');
      box.style.marginBottom = '1rem';
      box.innerHTML = '<span class="mono">About this category</span><span>' + S.esc(seo.intro) +
        ' <a href="contact.html" style="color:var(--accent-text)">Call 08060157605</a> or ' +
        '<a href="wholesale.html#quote" style="color:var(--accent-text)">ask for a bulk price</a>.</span>';
      const shop = $('.shop');
      shop.parentNode.insertBefore(box, shop);
    }
  }

  function injectCategorySchema(cat, seo) {
    const prev = document.getElementById('cat-schema');
    if (prev) prev.remove();
    const items = A.PRODUCTS.filter((p) => p.cat === cat.id);
    const ld = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: seo.h,
          url: 'https://ayoola-enterprise.pages.dev/category.html?cat=' + cat.id,
          inLanguage: 'en-NG',
          description: seo.desc,
          about: {
            '@type': 'Store',
            name: A.CONFIG.company,
            address: {
              '@type': 'PostalAddress',
              addressLocality: A.CONFIG.city,
              addressRegion: A.CONFIG.state,
              addressCountry: 'NG',
            },
          },
        },
        {
          '@type': 'ItemList',
          itemListElement: items.map((p, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: p.name,
            url: 'https://ayoola-enterprise.pages.dev/product.html?id=' + p.id,
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://ayoola-enterprise.pages.dev/' },
            { '@type': 'ListItem', position: 2, name: 'All products', item: 'https://ayoola-enterprise.pages.dev/category.html' },
            { '@type': 'ListItem', position: 3, name: cat.name, item: 'https://ayoola-enterprise.pages.dev/category.html?cat=' + cat.id },
          ],
        },
      ],
    };
    const tag = document.createElement('script');
    tag.type = 'application/ld+json';
    tag.id = 'cat-schema';
    tag.textContent = JSON.stringify(ld);
    document.head.appendChild(tag);
  }


  /* ---------- filtering ---------- */
  function match(p) {
    if (state.cats.length && state.cats.indexOf(p.cat) === -1) return false;
    if (state.brands.length && state.brands.indexOf(p.brand) === -1) return false;
    if (state.deal && !A.discount(p)) return false;
    if (state.big && A.from(p) < 20000) return false;

    if (state.range) {
      const bits = state.range.split('-');
      const lo = Number(bits[0]), hi = Number(bits[1]);
      const price = A.from(p);
      if (price < lo || price > hi) return false;
    }

    const term = state.q.toLowerCase();
    if (term) {
      const hay = (p.name + ' ' + p.brand + ' ' + p.cat + ' ' + p.sizes.map((s) => s.label).join(' ')).toLowerCase();
      if (hay.indexOf(term) === -1) return false;
    }
    return true;
  }

  function sorted(list) {
    const l = list.slice();
    if (state.sort === 'sold') l.sort((a, b) => A.sold(b) - A.sold(a));
    else if (state.sort === 'discount') l.sort((a, b) => A.discount(b) - A.discount(a));
    else if (state.sort === 'low') l.sort((a, b) => A.from(a) - A.from(b));
    else if (state.sort === 'high') l.sort((a, b) => A.from(b) - A.from(a));
    else if (state.sort === 'az') l.sort((a, b) => a.name.localeCompare(b.name));
    return l;
  }

  function render() {
    const all = sorted(A.PRODUCTS.filter(match));
    const pages = Math.max(1, Math.ceil(all.length / state.per));
    if (state.page > pages) state.page = pages;
    const slice = all.slice((state.page - 1) * state.per, state.page * state.per);

    $('[data-count]').textContent = all.length + (all.length === 1 ? ' product found' : ' products found');
    $('[data-empty]').hidden = all.length > 0;
    S.renderGrid($('[data-grid]'), slice);
    paintChips();
    paintPages(pages);
  }

  function paintChips() {
    const chips = [];
    state.cats.forEach((c) => chips.push(['cat', c, A.cat(c) ? A.cat(c).name : c]));
    state.brands.forEach((b) => chips.push(['brand', b, b]));
    if (state.range) {
      const b = state.range.split('-');
      chips.push(['range', '', A.money(b[0]) + ' – ' + A.money(b[1])]);
    }
    if (state.deal) chips.push(['deal', '1', 'On sale only']);
    if (state.big) chips.push(['big', '1', 'Bulk / wholesale']);
    if (state.q) chips.push(['q', '', 'Search: ' + state.q]);

    $('[data-chips]').innerHTML = chips.map((c) =>
      '<span class="chip">' + S.esc(c[2]) + ' <button type="button" data-drop="' +
      c[0] + '|' + S.esc(c[1]) + '" aria-label="Remove filter">×</button></span>').join('');
  }

  function paintPages(pages) {
    if (pages <= 1) { $('[data-pages]').innerHTML = ''; return; }
    let html = '<button type="button" data-go="' + (state.page - 1) + '"' +
      (state.page === 1 ? ' disabled' : '') + '>&lsaquo;</button>';
    for (let n = 1; n <= pages; n++) {
      html += '<button type="button" class="' + (n === state.page ? 'on' : '') + '" data-go="' + n + '">' + n + '</button>';
    }
    html += '<button type="button" data-go="' + (state.page + 1) + '"' +
      (state.page === pages ? ' disabled' : '') + '>&rsaquo;</button>';
    $('[data-pages]').innerHTML = html;
    $('[data-pages]').scrollIntoView({ block: 'nearest' });
  }

  /* ---------- events ---------- */
  $('[data-facets]').addEventListener('change', function (e) {
    const t = e.target;
    if (t.name === 'cat') state.cats = $$('input[name=cat]:checked', this).map((i) => i.value);
    else if (t.name === 'brand') state.brands = $$('input[name=brand]:checked', this).map((i) => i.value);
    else if (t.name === 'pr') state.range = t.value;
    else if (t.name === 'deal') state.deal = t.checked;
    else if (t.name === 'big') state.big = t.checked;
    state.page = 1;
    render();
    closeFilters();
  });

  $('#sort').addEventListener('change', function () {
    state.sort = this.value;
    state.page = 1;
    render();
  });

  $('[data-chips]').addEventListener('click', function (e) {
    const b = e.target.closest('[data-drop]');
    if (!b) return;
    const bits = b.dataset.drop.split('|');
    const kind = bits[0], val = bits.slice(1).join('|');
    if (kind === 'cat') { state.cats = state.cats.filter((c) => c !== val); sync('cat', val, false); }
    if (kind === 'brand') { state.brands = state.brands.filter((c) => c !== val); sync('brand', val, false); }
    if (kind === 'range') { state.range = ''; sync('pr', '', false, true); }
    if (kind === 'deal') { state.deal = false; sync('deal', '1', false); }
    if (kind === 'big') { state.big = false; sync('big', '1', false); }
    if (kind === 'q') { state.q = ''; const i = $('.searchbar input'); if (i) i.value = ''; }
    state.page = 1;
    render();
  });

  function sync(name, val, on, uncheckRadio) {
    const box = $('[data-facets]');
    if (uncheckRadio) $$('input[name=' + name + ']', box).forEach((i) => { i.checked = false; });
    else $$('input[name=' + name + ']', box).forEach((i) => { if (i.value === val) i.checked = on; });
  }

  function clearAll() {
    state.cats = []; state.brands = []; state.range = ''; state.deal = false; state.big = false;
    state.q = ''; state.page = 1;
    $$('input', $('[data-facets]')).forEach((i) => { i.checked = false; i.checked = i.type === 'radio' ? false : false; });
    const i = $('.searchbar input'); if (i) i.value = '';
    render();
  }
  $$('[data-clear]').forEach((b) => b.addEventListener('click', clearAll));

  $('[data-pages]').addEventListener('click', function (e) {
    const b = e.target.closest('[data-go]');
    if (!b || b.disabled) return;
    state.page = Number(b.dataset.go);
    render();
    window.scrollTo({ top: $('[data-crumbs]').offsetTop - 10, behavior: 'smooth' });
  });

  /* mobile filter drawer */
  const facets = $('[data-facets]');
  function openFilters() { facets.classList.add('on'); S.$('[data-scrim]').classList.add('on'); }
  function closeFilters() { facets.classList.remove('on'); S.$('[data-scrim]').classList.remove('on'); }
  $('[data-filter-open]').addEventListener('click', openFilters);
  $('[data-scrim]').addEventListener('click', closeFilters);

  $('#sort').value = state.sort;

  paintHead();
  render();
});
