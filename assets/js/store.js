/* ===========================================================
   AYOOLA ENTERPRISES - shared storefront engine
   Logo, header, footer, cart storage, product cards, drawer.
   Loaded on every page after catalog.js.
   =========================================================== */
(function () {
'use strict';

const A = window.AYOOLA;
const $  = (s, c) => (c || document).querySelector(s);
const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));

const C = A.CONFIG;
const WA = 'https://wa.me/' + C.whatsapp;

/* ===========================================================
   LOGO
   ------------------------------------------------------------
   Gold towers on navy, matching the Ayoola Enterprises logo.
   Swap in the exact artwork at any time: drop your file in
   assets/img/logo.png and it replaces the mark automatically
   (see logoHTML below - no code change needed).
   =========================================================== */
const LOGO_FALLBACK = 'assets/img/logo.png';

const LOGO_MARK =
  '<svg class="logo-mark" viewBox="0 0 120 108" width="40" height="36" aria-hidden="true" focusable="false">' +
    '<defs>' +
      '<linearGradient id="aeGold" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0" stop-color="#f6e7bd"/><stop offset=".55" stop-color="#e3c173"/>' +
        '<stop offset="1" stop-color="#b8913f"/>' +
      '</linearGradient>' +
    '</defs>' +
    /* base ring */
    '<ellipse cx="60" cy="88" rx="42" ry="12" fill="none" stroke="url(#aeGold)" stroke-width="5"/>' +
    '<path d="M18 88a42 12 0 0 0 84 0" fill="none" stroke="#b8913f" stroke-width="3" opacity=".8"/>' +
    /* side towers (drawn first so the centre one overlaps) */
    '<g fill="url(#aeGold)">' +
      '<path d="M26 40h16v46H26z"/>' +
      '<path d="M78 34h16v52H78z"/>' +
    '</g>' +
    '<g fill="#b8913f" opacity=".75">' +
      '<path d="M42 40l6 4v42l-6 4z"/>' +
      '<path d="M94 34l6 4v48l-6 4z"/>' +
    '</g>' +
    /* centre tower, tallest */
    '<g fill="url(#aeGold)">' +
      '<path d="M46 16h28v70H46z"/>' +
    '</g>' +
    '<g fill="#f9f0d4" opacity=".55">' +
      '<path d="M46 16h7v70h-7z"/>' +
    '</g>' +
    '<g fill="#a8813a" opacity=".8">' +
      '<path d="M74 16l7 6v64l-7 6z"/>' +
    '</g>' +
  '</svg>';

function logoMark() {
  /* if the owner drops in assets/img/logo.png, use it verbatim */
  return '<span class="logo-img-wrap" data-logo-img>' +
    '<img src="' + LOGO_FALLBACK + '" alt="" width="40" height="36" ' +
    'onerror="this.parentNode.removeAttribute(\'data-has-img\');this.remove()">' +
    LOGO_MARK +
  '</span>';
}

function logoWord(small) {
  return '<span class="logo-text">' +
    '<b>Ayoola</b>' +
    '<i>' + (small ? 'Enterprises' : 'Enterprises &middot; ' + C.tagline) + '</i>' +
  '</span>';
}

/* ===========================================================
   TOAST
   =========================================================== */
let toastEl, toastTimer;
function toast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2400);
}

/* ===========================================================
   CART (localStorage)
   =========================================================== */
const KEY = 'ayoola.cart.v3';
const cart = {
  read() {
    try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  },
  write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {}
    paintCount();
    document.dispatchEvent(new CustomEvent('cart:change'));
  },
  add(id, size, qty) {
    const items = this.read();
    const found = items.find((i) => i.id === id && i.size === size);
    if (found) found.qty += (qty || 1);
    else items.push({ id: id, size: size, qty: qty || 1 });
    this.write(items);
  },
  setQty(id, size, qty) {
    let items = this.read();
    if (qty <= 0) items = items.filter((i) => !(i.id === id && i.size === size));
    else items.forEach((i) => { if (i.id === id && i.size === size) i.qty = qty; });
    this.write(items);
  },
  clear() { this.write([]); },
  count() { return this.read().reduce((n, i) => n + i.qty, 0); },
  lines() {
    return this.read().map((i) => {
      const p = A.product(i.id);
      if (!p || !p.sizes[i.size]) return null;
      const s = p.sizes[i.size];
      return { id: i.id, size: i.size, s: s, p: p, qty: i.qty, line: s.price * i.qty };
    }).filter(Boolean);
  },
  subtotal() { return this.lines().reduce((n, l) => n + l.line, 0); },
  delivery() {
    const sub = this.subtotal();
    if (sub === 0 || sub >= C.freeDeliveryOver) return 0;
    return C.deliveryFee;
  },
  total() { return this.subtotal() + this.delivery(); },
};

function paintCount() {
  const n = cart.count();
  $$('[data-cart-count]').forEach((el) => {
    el.textContent = n;
    el.classList.toggle('on', n > 0);
  });
}

/* ===========================================================
   PHOTOS
   real file first, dark placeholder if the file is missing
   =========================================================== */
function imgTag(p, cls, alt) {
  return '<img src="' + A.photo(p) + '" data-fallback="' + A.placeholder(p) + '" ' +
    'alt="' + esc(alt || (p.name + ' - ' + p.brand + ' sold in ' + C.city)) + '" ' +
    (cls ? 'class="' + cls + '" ' : '') + 'width="600" height="600" loading="lazy" decoding="async">';
}

/* one delegated listener covers every image on the page */
document.addEventListener('error', function (e) {
  const img = e.target;
  if (!img || img.tagName !== 'IMG' || !img.dataset || !img.dataset.fallback) return;
  if (img.dataset.fallbackDone) return;
  img.dataset.fallbackDone = '1';
  img.src = img.dataset.fallback;
}, true);

/* ===========================================================
   PRODUCT CARD
   =========================================================== */
function cardHTML(p) {
  const off = A.discount(p);
  const first = p.sizes[0];
  const sd = A.sold(p);
  const ribbon = off ? '<span class="ribbon">-' + off + '%</span>'
               : sd > 420 ? '<span class="ribbon hot">Hot</span>' : '';

  const opts = p.sizes.length > 1
    ? '<div class="opts">' + p.sizes.map((s, i) =>
        '<button type="button" data-opt="' + i + '" aria-pressed="' + (i === 0) + '">' + esc(s.label) + '</button>'
      ).join('') + '</div>'
    : '';

  return '' +
  '<article class="card" data-id="' + p.id + '" data-cat="' + p.cat + '">' +
    '<div class="ph">' + ribbon + imgTag(p, null, p.name) + '</div>' +
    '<h3><a href="product.html?id=' + p.id + '">' + esc(p.name) + '</a></h3>' +
    '<div class="price"><b data-price>' + A.money(first.price) + '</b>' +
      (first.was ? '<s>' + A.money(first.was) + '</s>' : '') +
      (off ? '<em>-' + off + '%</em>' : '') +
    '</div>' +
    '<p class="unit">' + esc(first.label) + ' &middot; ' + esc(p.unit) + '</p>' +
    '<p class="sold">' + sd + '+ sold this month</p>' +
    opts +
    '<div class="acts">' +
      '<button class="btn btn-sm" type="button" data-add="' + p.id + '">Add to cart</button>' +
      '<button class="btn btn-o btn-sm" type="button" data-buy="' + p.id + '">Buy now</button>' +
    '</div>' +
  '</article>';
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paintCard(card) {
  const p = A.product(card.dataset.id);
  const addBtn = $('[data-add]', card);
  if (!p || !addBtn) return;
  const idx = Number(addBtn.dataset.opt || 0);
  const s = p.sizes[idx] || p.sizes[0];
  addBtn.dataset.opt = String(idx);
  const priceEl = $('[data-price]', card);
  if (priceEl) priceEl.textContent = A.money(s.price);
  const unit = $('.unit', card);
  if (unit) unit.innerHTML = esc(s.label) + ' &middot; ' + esc(p.unit);
  $$('[data-opt]', card).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.opt) === idx)));
}

function renderGrid(el, list) {
  if (!el) return;
  el.innerHTML = list.map(cardHTML).join('');
  $$('.card', el).forEach(paintCard);
}

/* ===========================================================
   HEADER
   =========================================================== */
function headerHTML(active) {
  const cats = A.CATEGORIES.map((c) =>
    '<a href="category.html?cat=' + c.id + '"' +
    (active === c.id ? ' class="on"' : '') + '>' + esc(c.name) + '</a>').join('');

  return '' +
  '<div class="topbar"><div class="wrap">' +
    '<span class="deliver">Deliver to <b>' + esc(C.city) + '</b> <span class="mono hide-sm">' +
      esc(C.state) + '</span></span>' +
    '<nav class="topnav">' +
      '<a href="wholesale.html">Wholesale</a>' +
      '<a href="wholesale.html#faq">Help</a>' +
      '<a href="wholesale.html#contact">Contact</a>' +
      '<a href="' + WA + '" target="_blank" rel="noopener">WhatsApp</a>' +
    '</nav>' +
  '</div></div>' +

  '<header class="head"><div class="wrap">' +
    '<button class="burger" type="button" data-burger aria-label="Menu">&#9776;</button>' +
    '<a class="logo" href="index.html" aria-label="Ayoola Enterprises home">' +
      logoMark() + logoWord() +
    '</a>' +
    '<form class="searchbar" action="category.html" method="get" role="search">' +
      '<input type="search" name="q" placeholder="Search rice, tilapia, malt, semo in ' + esc(C.city) + '" aria-label="Search products">' +
      '<button type="submit">SEARCH</button>' +
    '</form>' +
    '<div class="head-act">' +
      '<a class="iconbtn" href="tel:' + C.phone + '">' + esc(C.phone) + '</a>' +
      '<a class="iconbtn" href="cart.html" aria-label="Cart">Cart' +
        '<span class="cnt" data-cart-count></span></a>' +
    '</div>' +
  '</div></header>' +

  '<nav class="catnav" aria-label="Categories"><div class="wrap">' +
    '<a class="cats-btn" href="category.html"><span class="bars"><i></i><i></i><i></i></span> Categories</a>' +
    '<div class="links">' + cats + '</div>' +
  '</div></nav>' +

  '<div class="promo"><div class="wrap">' +
    '<span>Free delivery in ' + esc(C.city) + ' on orders above ' + A.money(C.freeDeliveryOver) + '</span>' +
    '<span>Frozen fish &amp; poultry packed daily</span>' +
    '<span>Wholesale and retail prices</span>' +
    '<span>Same-day rider before ' + esc(C.sameDayCutoff) + '</span>' +
  '</div></div>';
}

/* ===========================================================
   FOOTER
   =========================================================== */
function footerHTML() {
  const c = A.CATEGORIES.slice(0, 5)
    .map((x) => '<li><a href="category.html?cat=' + x.id + '">' + esc(x.name) + '</a></li>').join('');

  return '' +
  '<div class="foot-news"><div class="wrap">' +
    '<b>Price drops and new stock, sent to your inbox</b>' +
    '<form data-news><input type="email" placeholder="Enter your email address" aria-label="Email address" required>' +
      '<button type="submit">Subscribe</button></form>' +
  '</div></div>' +

  '<footer class="foot"><div class="wrap foot-top">' +
    '<div>' +
      '<span class="flogo">' + logoMark() + logoWord(true) + '</span>' +
      '<p>The food vendor in ' + esc(C.city) + ' for foodstuffs, frozen fish, poultry, drinks and oils. ' +
        'Wholesale and retail, delivered by our own rider across ' + esc(C.city) + '.</p>' +
      '<p style="margin-top:.8rem"><a href="tel:' + C.phone + '">' + esc(C.phone) + '</a><br>' +
        '<a href="mailto:' + C.email + '">' + esc(C.email) + '</a></p>' +
      '<div class="pay"><span>BANK TRANSFER</span><span>CASH ON DELIVERY</span><span>OPAY</span>' +
        '<span>CARD</span><span>POS</span></div>' +
    '</div>' +
    '<div><h4>Shop</h4><ul>' + c + '</ul></div>' +
    '<div><h4>Categories</h4><ul>' +
      A.CATEGORIES.slice(5).map((x) => '<li><a href="category.html?cat=' + x.id + '">' + esc(x.name) + '</a></li>').join('') +
      '<li><a href="category.html?sort=discount">Today&rsquo;s deals</a></li>' +
      '<li><a href="category.html?sort=sold">Best selling</a></li>' +
    '</ul></div>' +
    '<div><h4>Company</h4><ul>' +
      '<li><a href="wholesale.html#about">About us</a></li>' +
      '<li><a href="wholesale.html#owner">The owner</a></li>' +
      '<li><a href="wholesale.html">Wholesale</a></li>' +
      '<li><a href="wholesale.html#delivery">Delivery areas</a></li>' +
    '</ul></div>' +
    '<div><h4>Help</h4><ul>' +
      '<li><a href="wholesale.html#payments">How to pay</a></li>' +
      '<li><a href="wholesale.html#faq">FAQ</a></li>' +
      '<li><a href="wholesale.html#returns">Returns</a></li>' +
      '<li><a href="' + WA + '" target="_blank" rel="noopener">WhatsApp us</a></li>' +
    '</ul></div>' +
  '</div>' +
  '<div class="wrap foot-bot">' +
    '<span>&copy; <span data-year></span> Ayoola Enterprises, ' + esc(C.city) + ', ' + esc(C.state) + ' State.</span>' +
    '<span>Food delivery in ' + esc(C.city) + '</span>' +
  '</div></footer>';
}

/* ===========================================================
   DRAWER
   =========================================================== */
function drawerHTML() {
  return '<div class="scrim" data-scrim></div>' +
    '<aside class="drawer" data-drawer aria-label="Shopping cart">' +
      '<div class="hd"><span>Your cart</span><button type="button" data-drawer-close aria-label="Close cart">&times;</button></div>' +
      '<div class="bd" data-drawer-body></div>' +
      '<div class="ft" data-drawer-foot></div>' +
    '</aside>';
}

function paintDrawer() {
  const body = $('[data-drawer-body]');
  if (!body) return;
  const lines = cart.lines();

  if (!lines.length) {
    body.innerHTML = '<div class="empty" style="padding:2.5rem .5rem"><div class="e">&#128722;</div>' +
      'Your cart is empty.<br><br><a class="btn btn-o" href="category.html">Start shopping</a></div>';
    $('[data-drawer-foot]').innerHTML = '';
    return;
  }

  body.innerHTML = lines.map((l) =>
    '<div class="dline">' +
      '<div class="ph">' + imgTag(l.p, null, l.p.name) + '</div>' +
      '<div><h4>' + esc(l.p.name) + '</h4>' +
        '<span class="v">' + esc(l.s.label) + ' &times; ' + l.qty + '</span></div>' +
      '<div style="text-align:right">' +
        '<b style="font-size:.82rem">' + A.money(l.line) + '</b><br>' +
        '<button class="linkbtn" type="button" data-rm="' + l.id + '|' + l.size + '">Remove</button>' +
      '</div>' +
    '</div>').join('');

  $('[data-drawer-foot]').innerHTML =
    '<div class="drow"><span>Subtotal</span><b>' + A.money(cart.subtotal()) + '</b></div>' +
    '<div class="drow"><span>Delivery in ' + esc(C.city) + '</span><b>' +
      (cart.delivery() ? A.money(cart.delivery()) : 'Free') + '</b></div>' +
    '<a class="btn btn-o btn-block" href="checkout.html">Proceed to checkout</a>' +
    '<a class="btn btn-block" href="cart.html">View full cart</a>';
}

function openDrawer() {
  paintDrawer();
  $('[data-drawer]').classList.add('on');
  $('[data-scrim]').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  const d = $('[data-drawer]');
  if (!d) return;
  d.classList.remove('on');
  $('[data-scrim]').classList.remove('on');
  document.body.style.overflow = '';
}

/* ===========================================================
   GLOBAL CLICKS
   =========================================================== */
document.addEventListener('click', function (e) {
  const cartIcon = e.target.closest('.iconbtn[href="cart.html"]');
  if (cartIcon) { e.preventDefault(); openDrawer(); return; }

  if (e.target.closest('[data-drawer-close]') || e.target.closest('[data-scrim]')) { closeDrawer(); return; }

  if (e.target.closest('[data-burger]')) {
    e.preventDefault();
    closeDrawer();
    document.body.classList.toggle('nav-open');
    return;
  }

  const opt = e.target.closest('.opts [data-opt]');
  if (opt) {
    const card = opt.closest('.card');
    const addBtn = card && $('[data-add]', card);
    if (addBtn) addBtn.dataset.opt = opt.dataset.opt;
    paintCard(card);
    return;
  }

  const add = e.target.closest('[data-add],[data-pdpadd]');
  if (add) {
    const card = add.closest('.card');
    const id = add.dataset.add || add.dataset.pdpadd;
    const size = add.dataset.pdpadd !== undefined
      ? Number(add.dataset.psize || 0)
      : Number(((card && $('[data-add]', card).dataset.opt) || 0));
    const qty = add.dataset.pdpadd !== undefined ? Number(add.dataset.pqty || 1) : 1;
    const p = A.product(id);
    cart.add(p.id, size, qty);
    toast(p.name + ' (' + p.sizes[size].label + ') added to cart');
    if (add.classList.contains('btn-sm')) flash(add, 'Added');
    return;
  }

  const buy = e.target.closest('[data-buy],[data-pdpbuy]');
  if (buy) {
    const card = buy.closest('.card');
    const id = buy.dataset.buy || buy.dataset.pdpbuy;
    const size = buy.dataset.pdpbuy !== undefined
      ? Number(buy.dataset.psize || 0)
      : Number(((card && $('[data-add]', card).dataset.opt) || 0));
    const qty = buy.dataset.pdpbuy !== undefined ? Number(buy.dataset.pqty || 1) : 1;
    cart.add(A.product(id).id, size, qty);
    location.href = 'checkout.html';
    return;
  }

  const rm = e.target.closest('[data-rm]');
  if (rm) {
    const bits = rm.dataset.rm.split('|');
    cart.setQty(bits[0], Number(bits[1]), 0);
    paintDrawer();
  }
});

function flash(btn, text) {
  const old = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
  setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 1000);
}

/* ===========================================================
   ORDERS (kept on the device)
   =========================================================== */
const OK = 'ayoola.orders.v3';
const orders = {
  all() { try { const v = JSON.parse(localStorage.getItem(OK)); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
  save(o) {
    const list = this.all();
    list.unshift(o);
    try { localStorage.setItem(OK, JSON.stringify(list.slice(0, 20))); } catch (e) {}
  },
  ref() {
    const d = new Date();
    return 'AE-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') +
           String(d.getDate()).padStart(2, '0') + '-' +
           Math.floor(1000 + Math.random() * 9000);
  },
};

/* ===========================================================
   BOOT
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const page = document.body.dataset.page || '';
  const qcat = new URLSearchParams(location.search).get('cat');

  const h = $('#site-header');
  if (h) h.innerHTML = headerHTML(page === 'category' ? qcat : '');

  const f = $('#site-footer');
  if (f) f.innerHTML = footerHTML();

  document.body.insertAdjacentHTML('beforeend', drawerHTML());
  paintDrawer();
  paintCount();

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  $$('[data-phone]').forEach((el) => { el.textContent = C.phone; });
  $$('[data-email]').forEach((el) => { el.textContent = C.email; });

  const sq = new URLSearchParams(location.search).get('q');
  if (sq && $('.searchbar input')) $('.searchbar input').value = sq;

  $('[data-news]')?.addEventListener('submit', function (e) {
    e.preventDefault();
    toast('Thank you. Price drops will come to your inbox.');
    this.reset();
  });

  document.addEventListener('cart:change', paintDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  if (C.showPriceNotice) {
    const n = $('#priceNotice');
    if (n) n.hidden = false;
  }
});

window.SHOP = {
  $: $, $$: $$, A: A, C: C, WA: WA, cart: cart, orders: orders, toast: toast,
  cardHTML: cardHTML, renderGrid: renderGrid, esc: esc, imgTag: imgTag,
  openDrawer: openDrawer, closeDrawer: closeDrawer, logoMark: logoMark, logoWord: logoWord,
};
})();
