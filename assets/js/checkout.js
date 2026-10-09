/* ===========================================================
   AYOOLA ENTERPRISES - checkout page (Akure delivery)
   ------------------------------------------------------------
   Payment options:
     card     -> send the customer to your hosted payment page
                 (CONFIG.payLink). Only the PUBLIC key goes here.
     transfer -> bank transfer + reference
     delivery -> cash on delivery in Akure

   The secret key (sk_... / secret key / API secret) is NEVER
   used in this file. It belongs on a server (Cloudflare Worker,
   Google Apps Script or your provider's server-side SDK).
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, C = S.C, $ = S.$, $$ = S.$$;

  const PROMO_KEY = 'ayoola.promo.v1';
  const PROMOS = { AYOOLA10: 10, WELCOME5: 5 };
  let promo = null;
  try { promo = JSON.parse(localStorage.getItem(PROMO_KEY)); } catch (e) {}

  const discountFor = (sub) =>
    (promo && PROMOS[promo.code]) ? Math.round(sub * PROMOS[promo.code] / 100) : 0;

  /* ---------- empty cart guard ---------- */
  if (!S.cart.count()) {
    $('#checkoutMain').innerHTML =
      '<div class="empty"><div class="e">&#128722;</div>Your cart is empty, so there is nothing to check out.' +
      '<br><br><a class="btn btn-o" href="category.html">Browse products</a></div>';
    return;
  }

  /* ---------- Akure delivery areas ---------- */
  $('[data-areas]').innerHTML = '<option value="">Select your area</option>' +
    (C.areas || []).map((a) => '<option>' + a + '</option>').join('');
  $('#city').value = C.city;

  $('[data-bank]').textContent = C.bank.bank;
  $('[data-acctname]').textContent = C.bank.accountName;
  $('[data-acctno]').textContent = C.bank.accountNumber;

  /* ---------- card option only when a pay link is configured ---------- */
  if (!C.payLink) $('[data-pay-card]').remove();
  else document.querySelector('[data-pay-card] small').textContent =
    'Secure payment page. You will be taken to ' + new URL(C.payLink, location.href).hostname + ' to pay.';

  const WA = 'https://wa.me/' + C.whatsapp + '?text=' +
    encodeURIComponent('Hello Ayoola Enterprises, I have just placed order ');

  function paint() {
    const lines = S.cart.lines();
    $('[data-count]').textContent = S.cart.count();
    $('[data-mini]').innerHTML = lines.map(function (l) {
      return '<div class="mini">' +
        '<div class="ph">' + S.imgTag(l.p, null, l.p.name) + '</div>' +
        '<div>' + S.esc(l.p.name) + '<br><span style="color:var(--muted)">' +
          S.esc(l.s.label) + ' x ' + l.qty + '</span></div>' +
        '<b>' + A.money(l.line) + '</b>' +
      '</div>';
    }).join('');

    const sub = S.cart.subtotal();
    const disc = discountFor(sub);
    const fee = S.cart.delivery();
    $('[data-sub]').textContent = A.money(sub);
    $('[data-fee]').textContent = fee ? A.money(fee) : 'Free';
    $('[data-disc]').textContent = disc ? '− ' + A.money(disc) : A.money(0);
    $('[data-tot]').textContent = A.money(sub - disc + fee);
  }

  /* bank card visible only for transfer; transfer reference only for transfer */
  function payMode() {
    const mode = (document.querySelector('input[name=pay]:checked') || {}).value || 'transfer';
    $('[data-bankcard]').style.display = mode === 'transfer' ? '' : 'none';
    $('[data-for=pop]').style.display = mode === 'transfer' ? '' : 'none';
    $('[data-pop-req]').style.display = mode === 'transfer' ? '' : 'none';
    return mode;
  }
  $$('input[name=pay]').forEach((r) => r.addEventListener('change', payMode));
  payMode();

  /* prefill from the last order on this device */
  try {
    const saved = JSON.parse(localStorage.getItem('ayoola.customer.v1') || 'null');
    if (saved) {
      ['name', 'phone', 'email', 'area', 'city', 'address', 'landmark'].forEach(function (k) {
        const el = document.getElementById(k);
        if (el && saved[k]) el.value = saved[k];
      });
    }
  } catch (e) {}

  /* ---------- validation ---------- */
  function fail(name) {
    const f = document.querySelector('[data-for="' + name + '"]');
    if (f) f.classList.add('err');
  }
  function clearErr() { $$('.field').forEach((f) => f.classList.remove('err')); }

  function validate() {
    clearErr();
    const v = function (id) { return document.getElementById(id).value.trim(); };
    const mode = payMode();
    let ok = true;

    if (!v('area')) { fail('area'); ok = false; }
    if (!v('city')) { fail('city'); ok = false; }
    if (v('address').length < 5) { fail('address'); ok = false; }
    if (!v('name')) { fail('name'); ok = false; }
    if (v('phone').replace(/\D/g, '').length < 10) { fail('phone'); ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) { fail('email'); ok = false; }
    if (mode === 'transfer' && !v('pop')) { fail('pop'); ok = false; }

    if (!ok) {
      const first = document.querySelector('.field.err input, .field.err select');
      if (first) first.focus();
      S.toast('Please complete the highlighted fields');
    }
    return ok;
  }

  /* ---------- place order ---------- */
  $('#checkoutForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    const g = function (id) { return document.getElementById(id).value.trim(); };
    const sub = S.cart.subtotal();
    const disc = discountFor(sub);
    const fee = S.cart.delivery();
    const ref = S.orders.ref();
    const lines = S.cart.lines();
    const pay = payMode();

    const order = {
      ref: ref,
      at: new Date().toISOString(),
      city: C.city, state: C.state,
      name: g('name'), phone: g('phone'), email: g('email'),
      area: g('area'), address: g('address'), landmark: g('landmark'), when: g('when'),
      note: g('note'), pop: pay === 'transfer' ? g('pop') : '',
      pay: pay,
      items: lines.map(function (l) {
        return { id: l.id, item: l.p.name, size: l.s.label, qty: l.qty, price: l.s.price, line: l.line };
      }),
      subtotal: sub, discount: disc, delivery: fee, total: sub - disc + fee,
      status: pay === 'card' ? 'Awaiting online payment'
            : pay === 'transfer' ? 'Awaiting transfer confirmation'
            : 'Pay on delivery in Akure',
    };

    S.orders.save(order);

    /* optional: send the order to your own endpoint (server side) */
    if (C.orderEndpoint) {
      try {
        fetch(C.orderEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        }).catch(function () {});
      } catch (err) {}
    }

    try {
      localStorage.setItem('ayoola.customer.v1', JSON.stringify({
        name: order.name, phone: order.phone, email: order.email,
        area: order.area, city: order.city, address: order.address, landmark: order.landmark,
      }));
    } catch (err) {}

    S.cart.clear();

    /* card orders jump straight to the payment page */
    if (pay === 'card' && C.payLink) {
      const sep = C.payLink.indexOf('?') === -1 ? '?' : '&';
      location.href = C.payLink + sep +
        'reference=' + encodeURIComponent(ref) +
        '&amount=' + (sub - disc + fee) * 100 +
        '&email=' + encodeURIComponent(order.email) +
        (C.publicKey ? '&public_key=' + encodeURIComponent(C.publicKey) : '');
      return;
    }

    showConfirmation(order);
  });

  /* ---------- confirmation ---------- */
  function showConfirmation(o) {
    $('#checkoutMain').hidden = true;
    const box = $('#confirmation');
    box.hidden = false;

    const mailBody =
      'Order reference: ' + o.ref + '\n' +
      'Date: ' + new Date(o.at).toLocaleString('en-NG') + '\n\n' +
      'Customer: ' + o.name + '\nPhone: ' + o.phone + '\nEmail: ' + o.email + '\n' +
      'Deliver to: ' + o.address + ', ' + o.area + ', ' + o.city + ', ' + o.state +
        (o.landmark ? ' (near ' + o.landmark + ')' : '') + '\n' +
      'When: ' + o.when + '\n\n' +
      o.items.map(function (i) { return i.qty + ' x ' + i.item + ' (' + i.size + ') = ' + A.money(i.line); }).join('\n') +
      '\n\nSubtotal: ' + A.money(o.subtotal) +
      (o.discount ? '\nDiscount: -' + A.money(o.discount) : '') +
      '\nDelivery: ' + (o.delivery ? A.money(o.delivery) : 'Free') +
      '\nTOTAL: ' + A.money(o.total) + '\n\n' +
      'Payment: ' + (o.pay === 'transfer' ? 'Bank transfer, reference ' + o.pop : 'Cash on delivery') +
      (o.note ? '\n\nNote: ' + o.note : '');
    const mailHref = 'mailto:' + C.email +
      '?subject=' + encodeURIComponent('New order ' + o.ref) +
      '&body=' + encodeURIComponent(mailBody);

    const rows = o.items.map(function (i) {
      return '<tr><td style="padding:.55rem 0;border-bottom:1px solid var(--line)">' + S.esc(i.item) +
        '<br><span style="color:var(--muted);font-size:.76rem">' + S.esc(i.size) + ' x ' + i.qty + '</span></td>' +
        '<td style="text-align:right;white-space:nowrap;padding:.55rem 0;border-bottom:1px solid var(--line)">' +
        A.money(i.line) + '</td></tr>';
    }).join('');

    box.innerHTML = '<div class="wrap"><div class="sec"><div class="done">' +
      '<div class="tick">&#10003;</div>' +
      '<h1>Thank you, ' + S.esc(o.name.split(' ')[0]) + '</h1>' +
      '<p>Your order is in. We will call you on ' + S.esc(o.phone) +
        ' to confirm, then our rider brings it to you in ' + S.esc(o.city) + '.</p>' +
      '<div class="refbox">' + o.ref + '</div>' +

      '<div class="panel-box" style="text-align:left">' +
        '<div class="hd">' + C.company + ' &mdash; order summary' +
          '<span>' + S.esc(o.status) + '</span></div>' +
        '<div style="padding:.4rem 1rem .8rem">' +
          '<table style="width:100%;border-collapse:collapse;font-size:.82rem">' + rows +
          '<tr><td style="padding:.45rem 0;border-top:1px solid var(--line)">Subtotal</td>' +
            '<td style="text-align:right;border-top:1px solid var(--line)">' + A.money(o.subtotal) + '</td></tr>' +
          (o.discount ? '<tr><td style="padding:.35rem 0">Discount</td>' +
            '<td style="text-align:right;color:var(--ok)">− ' + A.money(o.discount) + '</td></tr>' : '') +
          '<tr><td style="padding:.35rem 0">Delivery in Akure</td><td style="text-align:right">' +
            (o.delivery ? A.money(o.delivery) : 'Free') + '</td></tr>' +
          '<tr><td style="padding:.7rem 0;border-top:1px solid var(--line);font-weight:600;font-size:1rem">Total</td>' +
            '<td style="text-align:right;border-top:1px solid var(--line);font-weight:600;font-size:1rem">' +
            A.money(o.total) + '</td></tr>' +
        '</table>' +
        '<p class="mono" style="margin-top:.6rem">' + new Date(o.at).toLocaleString('en-NG') + '</p>' +
      '</div>' +
      '<div style="padding:0 1rem 1rem">' +
        '<p style="font-size:.82rem"><b style="font-weight:500">Deliver to</b><br>' + S.esc(o.address) + ', ' +
          S.esc(o.area) + ', ' + S.esc(o.city) + ', ' + S.esc(o.state) +
          (o.landmark ? '<br>Near: ' + S.esc(o.landmark) : '') + '</p>' +
        (o.note ? '<p style="font-size:.78rem;color:var(--muted);margin-top:.6rem">' +
          '<b style="color:var(--paper);font-weight:500">Your note:</b> ' + S.esc(o.note) + '</p>' : '') +
      '</div>' +
      (o.pay === 'transfer' ?
        '<div class="bankcard" style="margin:0 1rem 1rem;text-align:left">' +
          '<b style="font-weight:500">Complete your transfer</b>' +
          '<dl><dt>Bank</dt><dd>' + S.esc(C.bank.bank) + '</dd>' +
          '<dt>Account name</dt><dd>' + S.esc(C.bank.accountName) + '</dd>' +
          '<dt>Account number</dt><dd>' + S.esc(C.bank.accountNumber) + '</dd>' +
          '<dt>Amount</dt><dd>' + A.money(o.total) + '</dd>' +
          '<dt>Reference</dt><dd>' + o.ref + '</dd></dl>' +
          '<p style="margin:.7rem 0 0;color:var(--muted)">Send the transfer alert to ' + C.phone +
            ' on WhatsApp and we start packing straight away.</p>' +
        '</div>' : '') +
      '</div>' +

      '<div style="display:flex;gap:.6rem;justify-content:center;flex-wrap:wrap;margin:1.4rem 0">' +
        '<a class="btn btn-o btn-lg" target="_blank" rel="noopener" href="' + WA + o.ref + '">' +
          'Send order on WhatsApp</a>' +
        '<a class="btn btn-lg" href="' + mailHref + '">Email the order instead</a>' +
        '<a class="btn btn-lg" href="index.html">Continue shopping</a>' +
      '</div>' +

      '<p style="font-size:.78rem;color:var(--muted)">' +
        'Send us the order on WhatsApp or by email so we can confirm it straight away. ' +
        'A copy is kept on this device &mdash; keep the reference ' + o.ref + ' for your records.</p>' +
    '</div></div></div>';

    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.addEventListener('cart:change', paint);
  paint();
});
