/* ===========================================================
   AYOOLA ENTERPRISES - cart page
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, $ = S.$;

  const PROMO_KEY = 'ayoola.promo.v1';
  /* Placeholder codes - edit this object with your real ones.
     { AYOOLA10: 10 } means "10 percent off". */
  const PROMOS = { AYOOLA10: 10, WELCOME5: 5 };

  let promo = null;
  try { promo = JSON.parse(localStorage.getItem(PROMO_KEY)); } catch (e) {}

  $('#freeOver').textContent = A.money(A.CONFIG.freeDeliveryOver);

  const discountFor = (sub) =>
    (promo && PROMOS[promo.code]) ? Math.round(sub * PROMOS[promo.code] / 100) : 0;

  function paint() {
    const lines = S.cart.lines();
    const box = $('[data-lines]');

    if (!lines.length) {
      box.innerHTML = '<div class="empty"><div class="e">&#128722;</div>' +
        'Your cart is empty.<br><br><a class="btn btn-o" href="category.html">Start shopping</a></div>';
    } else {
      box.innerHTML = lines.map(function (l) {
        return '<div class="line" data-id="' + l.id + '" data-size="' + l.size + '">' +
          '<div class="ph">' + S.imgTag(l.p, null, l.p.name) + '</div>' +
          '<div class="info">' +
            '<h3><a href="product.html?id=' + l.id + '">' + S.esc(l.p.name) + '</a></h3>' +
            '<p class="v">' + S.esc(l.s.label) + ' &middot; ' + A.money(l.s.price) + ' each</p>' +
            '<button class="linkbtn" type="button" data-rm>Remove</button>' +
          '</div>' +
          '<div class="qty">' +
            '<button type="button" data-dec aria-label="Reduce quantity">&minus;</button>' +
            '<span>' + l.qty + '</span>' +
            '<button type="button" data-inc aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<div class="amt">' + A.money(l.line) + '</div>' +
        '</div>';
      }).join('');
    }

    const sub = S.cart.subtotal();
    const disc = discountFor(sub);
    const fee = S.cart.delivery();
    const tot = sub - disc + fee;

    $('[data-count]').textContent = S.cart.count();
    $('[data-sub]').textContent = A.money(sub);
    $('[data-fee]').textContent = fee ? A.money(fee) : 'Free';
    $('[data-disc]').textContent = disc ? '− ' + A.money(disc) : A.money(0);
    $('[data-tot]').textContent = A.money(tot);

    $('[data-vouch]').innerHTML = (promo && PROMOS[promo.code])
      ? '<div class="vouch">Promo <b>' + S.esc(promo.code) + '</b> applied' +
        '<button class="linkbtn" style="margin-left:auto" type="button" data-drop-promo>Remove</button></div>'
      : '';
  }

  /* line controls */
  $('[data-lines]').addEventListener('click', function (e) {
    const line = e.target.closest('.line');
    if (!line) return;
    const id = line.dataset.id, size = Number(line.dataset.size);
    const cur = S.cart.read().filter(function (i) { return i.id === id && i.size === size; })[0];
    const qty = cur ? cur.qty : 0;
    if (e.target.closest('[data-inc]')) S.cart.setQty(id, size, qty + 1);
    else if (e.target.closest('[data-dec]')) S.cart.setQty(id, size, qty - 1);
    else if (e.target.closest('[data-rm]')) S.cart.setQty(id, size, 0);
  });

  $('[data-clear-cart]').addEventListener('click', function () {
    if (!S.cart.count()) return;
    if (confirm('Remove everything from your cart?')) { S.cart.clear(); S.toast('Cart emptied'); }
  });

  /* promo code */
  $('[data-promo-go]').addEventListener('click', function () {
    const input = $('[data-promo]');
    const code = input.value.trim().toUpperCase();
    if (!code) return;
    if (PROMOS[code]) {
      promo = { code: code };
      localStorage.setItem(PROMO_KEY, JSON.stringify(promo));
      S.toast('Promo code applied');
      paint();
    } else {
      S.toast('That promo code is not valid');
    }
  });
  $('[data-promo]').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); $('[data-promo-go]').click(); }
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-drop-promo]')) return;
    promo = null;
    localStorage.removeItem(PROMO_KEY);
    paint();
  });

  document.addEventListener('cart:change', paint);
  paint();
});
