/* ===========================================================
   AYOOLA ENTERPRISES - product detail page
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, $ = S.$, $$ = S.$$;

  const id = new URLSearchParams(location.search).get('id');
  const p = A.product(id) || A.PRODUCTS[0];
  const cat = A.cat(p.cat);

  document.title = p.name + ' | Ayoola Enterprises';
  const desc = document.querySelector('meta[name=description]');
  if (desc) desc.setAttribute('content', p.name + ' - ' + p.brand + '. ' + p.sizes[0].label + ' at ' +
    A.money(p.sizes[0].price) + '. Wholesale and retail, nationwide delivery.');

  $('[data-crumbs]').innerHTML =
    '<a href="index.html">Home</a><span>&rsaquo;</span>' +
    '<a href="category.html?cat=' + p.cat + '">' + S.esc(cat ? cat.name : p.cat) + '</a><span>&rsaquo;</span>' +
    '<span>' + S.esc(p.name) + '</span>';

  const off = A.discount(p);
  const first = p.sizes[0];

  $('[data-pdp]').innerHTML = '' +
  /* ---------- gallery ---------- */
  '<div class="gallery-wrap">' +
    '<div class="gallery">' +
      (off ? '<span class="ribbon">-' + off + '% OFF</span>' : '') +
      '<img id="pdp-img" src="' + A.photo(p) + '" data-fallback="' + A.placeholder(p) + '" ' +
        'alt="' + S.esc(p.name) + ' - ' + S.esc(p.brand) + ', delivered in ' + S.C.city + '" width="600" height="600">' +
    '</div>' +
    '<div class="thumbs">' +
      p.sizes.map(function (s, i) {
        return '<img data-thumb="' + i + '" src="' + A.photo(p) + '" alt="" width="56" height="56">';
      }).join('') +
    '</div>' +
  '</div>' +

  /* ---------- details ---------- */
  '<div class="pdp-info">' +
    '<p class="eyebrow">' + S.esc(cat ? cat.name : p.cat) + '</p>' +
    '<h1>' + S.esc(p.name) + '</h1>' +
    '<div class="meta">' +
      '<span class="r">&#9733; ' + A.rating(p) + '</span>' +
      '<span>' + A.sold(p) + '+ sold this month</span>' +
      '<span>Brand <b>' + S.esc(p.brand) + '</b></span>' +
      '<span>SKU ' + p.id.toUpperCase() + '</span>' +
    '</div>' +

    '<div class="pbox">' +
      '<p class="unit" style="margin:0 0 .35rem;color:var(--muted);font-size:.74rem">Sold as ' + S.esc(p.unit) + '</p>' +
      '<div class="row">' +
        '<span class="now" data-price>' + A.money(first.price) + '</span>' +
        (first.was ? '<span class="old">' + A.money(first.was) + '</span>' : '') +
        (off ? '<span class="off">Save ' + off + '%</span>' : '') +
      '</div>' +
      '<label class="lb">Choose a pack size</label>' +
      '<div class="size-opts" data-sizes>' +
        p.sizes.map(function (s, i) {
          return '<button type="button" data-size="' + i + '" aria-pressed="' + (i === 0) + '">' +
            S.esc(s.label) + '<small>' + A.money(s.price) + (s.was ? ' &middot; was ' + A.money(s.was) : '') + '</small></button>';
        }).join('') +
      '</div>' +

      '<label class="lb">Quantity</label>' +
      '<div class="qty"><button type="button" data-dec aria-label="Reduce">&minus;</button>' +
        '<span data-qty>1</span><button type="button" data-inc aria-label="Increase">+</button></div>' +

      '<div class="pdp-acts">' +
        '<button class="btn btn-ghost btn-lg" type="button" data-pdpadd="' + p.id + '" data-psize="0" data-pqty="1">Add to cart</button>' +
        '<button class="btn btn-o btn-lg" type="button" data-pdpbuy="' + p.id + '" data-psize="0" data-pqty="1">Buy now</button>' +
      '</div>' +
    '</div>' +

    '<div class="assure">' +
      '<div><span class="e">&#128666;</span><span>Delivery nationwide. Free above ' +
        A.money(A.CONFIG.freeDeliveryOver) + ', otherwise ' + A.money(A.CONFIG.deliveryFee) + '. Same-day inside Lagos.</span></div>' +
      '<div><span class="e">&#127974;</span><span>Pay by bank transfer. Account details are shown at checkout and we email your receipt.</span></div>' +
      '<div><span class="e">&#129367;</span><span>Frozen items are packed in insulated boxes and leave our cold store the same day.</span></div>' +
      '<div><span class="e">&#128222;</span><span>Questions? WhatsApp ' + A.CONFIG.phone + ' or email ' + A.CONFIG.email + '.</span></div>' +
    '</div>' +

    '<p class="note"><b>About this item.</b> ' + S.esc(p.brand) + ' ' + S.esc(p.name.toLowerCase()) +
      ' supplied by Ayoola Enterprises in ' + S.esc(cat ? cat.name.toLowerCase() : p.cat) +
      '. Available in the pack sizes listed above, at both wholesale and retail prices. ' +
      'Prices move as stock changes, so the confirmed price is the one in your cart at checkout.</p>' +
  '</div>';

  /* ---------- behaviour ---------- */
  let size = 0;
  let qty = 1;

  function paint() {
    const s = p.sizes[size];
    $('[data-price]').textContent = A.money(s.price);
    $('[data-qty]').textContent = qty;
    $('[data-pdpadd]').dataset.psize = size;
    $('[data-pdpadd]').dataset.pqty = qty;
    $('[data-pdpbuy]').dataset.psize = size;
    $('[data-pdpbuy]').dataset.pqty = qty;
    $$('[data-size]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === size)));
    $$('[data-thumb]').forEach((t) => {
      t.style.borderColor = Number(t.dataset.thumb) === size ? 'var(--accent)' : '';
    });
    try { history.replaceState(null, '', '?id=' + p.id + (size ? '&size=' + size : '')); } catch (e) {}
  }

  $('[data-sizes]').addEventListener('click', function (e) {
    const b = e.target.closest('[data-size]');
    if (!b) return;
    size = Number(b.dataset.size);
    paint();
  });

  $('[data-pdp]').addEventListener('click', function (e) {
    if (e.target.closest('[data-inc]')) { qty = Math.min(99, qty + 1); paint(); }
    if (e.target.closest('[data-dec]')) { qty = Math.max(1, qty - 1); paint(); }
    const t = e.target.closest('[data-thumb]');
    if (t) { size = Number(t.dataset.thumb); paint(); }
  });

  /* ---------- related ---------- */
  const related = A.PRODUCTS.filter((x) => x.cat === p.cat && x.id !== p.id).slice(0, 10);
  if (related.length < 5) {
    A.PRODUCTS.forEach((x) => {
      if (x.id !== p.id && x.cat !== p.cat && related.length < 10) related.push(x);
    });
  }
  S.renderGrid($('[data-related]'), related);

  /* start on a size passed in the url */
  const qs = Number(new URLSearchParams(location.search).get('size'));
  if (!isNaN(qs) && p.sizes[qs]) size = qs;
  paint();
});
