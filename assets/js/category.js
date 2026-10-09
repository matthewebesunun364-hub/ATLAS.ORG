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

  /* ---------- heading / breadcrumbs ---------- */
  function paintHead() {
    const one = state.cats.length === 1 ? A.cat(state.cats[0]) : null;
    const title = one ? one.name
                : state.q ? 'Results for "' + state.q + '"'
                : 'All products';

    document.title = title + ' | Ayoola Enterprises';

    $('[data-crumbs]').innerHTML =
      '<a href="index.html">Home</a><span>&rsaquo;</span>' +
      (one ? '<a href="category.html">' + one.name + '</a>' : '<span>' + S.esc(title) + '</span>');

    const h = document.createElement('div');
    h.className = 'sec-h';
    h.innerHTML = '<h1>' + S.esc(title) + '</h1>' +
      (one ? '<span class="more">' + S.esc(one.note) + '</span>' : '');
    $('.shop').parentNode.insertBefore(h, $('.shop'));
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
