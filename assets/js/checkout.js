/* ===========================================================
   AYOOLA ENTERPRISES - checkout page (Akure delivery)
   ------------------------------------------------------------
   How it works, exactly like the first Ayoola Enterprise site:

     1. Customer fills in details and presses "Place order".
     2. The order is recorded on the device and the receipt appears.
     3. A pre-written email draft opens in their mail app, plus a
        WhatsApp button - so the order reaches us with no gateway.
     4. If you set orderEndpoint, the order is ALSO POSTed there.

   If you set payLink, a "Pay online with card" option appears and
   card orders jump to that hosted page after the receipt is saved.

   No secret key is used anywhere in this file. A secret key belongs
   on a server (Cloudflare Worker, Apps Script, or your provider's
   server-side SDK) - never in files a browser can read.
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, C = S.C, $ = S.$, $$ = S.$$;
  const Make = window.AYOOLA_MAKE || { sendOrder: () => Promise.resolve({}), sendPayment: () => Promise.resolve({}) };

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

  /* ---------- Akure areas ---------- */
  $('[data-areas]').innerHTML = '<option value="">Select your area</option>' +
    (C.areas || []).map((a) => '<option>' + a + '</option>').join('');
  $('#city').value = C.city;

  $$('[data-wa]').forEach((el) => { el.href = S.WA; el.target = '_blank'; el.rel = 'noopener'; });

  /* ---------- Make verification ----------
     Make holds the Paystack secret key, verifies the payment, and
     replies with {"paid": true|false}. The site never touches the
     secret key itself.                                          */
  const payCard = $('[data-pay-card]');
  const pkBox = $('[data-paystack-test]');
  const PK = C.paystackPublicKey;
  const cardReady = !!(PK && /^pk_(test|live)_/.test(PK));
  const cardMsg = (text) => {
    const m = $('[data-card-msg]');
    m.textContent = text || '';
    m.className = 'pay-msg' + (text ? ' on err' : '');
  };

  if (!cardReady) {
    payCard.remove();
    const box = $('[data-gateway]');
    if (!PK) {
      box.hidden = false;
      $('[data-gateway-note]').textContent =
        'No Paystack public key set, so card payment is hidden. Put pk_test_... in ' +
        'paystackPublicKey in assets/js/catalog.js. Bank transfer and cash on delivery work now.';
      $('[data-gateway-url]').textContent = 'assets/js/catalog.js  ->  paystackPublicKey';
    } else {
      box.remove();
    }
  } else if (window.PaystackPop) {
    $('[data-card-note]').textContent =
      'Opens a secure Paystack popup where you enter your card details.';
  } else {
    $('[data-card-note]').textContent =
      'Paystack is still loading. If it does not load, check your internet connection.';
  }

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

  /* ---------- pay mode ---------- */
  function payMode() {
    const mode = (document.querySelector('input[name=pay]:checked') || {}).value
      || (cardReady ? 'card' : 'transfer');
    const needRef = mode === 'transfer';
    $('[data-for=pop]').style.display = needRef ? '' : 'none';
    $('[data-pop-req]').style.display = needRef ? '' : 'none';
    pkBox.hidden = !cardReady || mode !== 'card';
    return mode;
  }
  $$('input[name=pay]').forEach((r) => r.addEventListener('change', payMode));
  if (cardReady) document.querySelector('[data-card-radio]').checked = true;
  payMode();

  /* ---------- prefill from the last order ---------- */
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
  function say(text, cls) {
    const m = $('[data-order-msg]');
    m.textContent = text;
    m.className = 'msg on ' + (cls || '');
  }

  function validate() {
    clearErr();
    const v = function (id) { return document.getElementById(id).value.trim(); };
    const mode = payMode();
    let ok = true;

    if (!v('name')) { fail('name'); ok = false; }
    if (v('phone').replace(/\D/g, '').length < 10) { fail('phone'); ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email'))) { fail('email'); ok = false; }
    if (!v('area')) { fail('area'); ok = false; }
    if (!v('city')) { fail('city'); ok = false; }
    if (v('address').length < 5) { fail('address'); ok = false; }
    if (mode === 'transfer' && !v('pop')) { fail('pop'); ok = false; }

    if (!ok) {
      const first = document.querySelector('.field.err input, .field.err select');
      if (first) first.focus();
      S.toast('Please complete the highlighted fields');
    }
    return ok;
  }

  /* ---------- build the order ---------- */
  function buildOrder(d) {
    const lines = S.cart.lines();
    const sub = S.cart.subtotal();
    const disc = discountFor(sub);
    const fee = S.cart.delivery();
    const pay = payMode();

    return {
      ref: S.orders.ref(),
      at: new Date().toISOString(),
      city: C.city, state: C.state,
      name: d.name, phone: d.phone, email: d.email,
      area: d.area, address: d.address, landmark: d.landmark, when: d.when, note: d.note,
      pop: pay === 'transfer' ? d.pop : '',
      pay: pay,
      items: lines.map(function (l) {
        return { id: l.id, item: l.p.name, size: l.s.label, qty: l.qty, price: l.s.price, line: l.line };
      }),
      subtotal: sub, discount: disc, delivery: fee, total: sub - disc + fee,
      status: pay === 'card' ? 'Awaiting online payment'
            : pay === 'transfer' ? 'Awaiting bank transfer'
            : 'Pay on delivery in Akure',
    };
  }

  /* ---------- email draft (the fallback that always works) ---------- */
  function mailDraft(o) {
    const rows = o.items.map((i) => '  ' + i.qty + ' x ' + i.item + ' (' + i.size + ')  ' + A.money(i.line)).join('\n');
    const body = [
      'NEW ORDER from the Ayoola Enterprises website',
      '',
      'Reference: ' + o.ref,
      'Name: ' + o.name,
      'Phone: ' + o.phone,
      'Email: ' + o.email,
      'Delivery address: ' + o.address + ', ' + o.area + ', ' + o.city + ', ' + o.state,
      o.landmark ? 'Landmark: ' + o.landmark : '',
      'When: ' + o.when,
      o.note ? 'Notes: ' + o.note : '',
      '',
      'ITEMS',
      rows,
      '',
      'Subtotal: ' + A.money(o.subtotal),
      o.discount ? 'Discount: -' + A.money(o.discount) : '',
      'Delivery: ' + (o.delivery ? A.money(o.delivery) : 'Free'),
      'TOTAL: ' + A.money(o.total),
      '',
      'Payment: ' + (o.pay === 'transfer' ? 'Bank transfer, reference ' + o.pop : 'Cash on delivery'),
    ].filter(Boolean).join('\n');

    return 'mailto:' + C.email +
      '?subject=' + encodeURIComponent('New order ' + o.ref) +
      '&body=' + encodeURIComponent(body);
  }

  function waLink(o) {
    const rows = o.items.map((i) => i.qty + ' x ' + i.item + ' (' + i.size + ') = ' + A.money(i.line)).join('\n');
    const text = 'NEW ORDER from the Ayoola Enterprises website\n\n' +
      'Reference: ' + o.ref + '\n' +
      'Name: ' + o.name + '\nPhone: ' + o.phone + '\n' +
      'Deliver to: ' + o.address + ', ' + o.area + ', ' + o.city + '\n\n' + rows +
      '\n\nTOTAL: ' + A.money(o.total) +
      (o.pay === 'transfer' ? '\nTransfer reference: ' + o.pop : '');
    return S.WA + '?text=' + encodeURIComponent(text);
  }

  /* ---------- optional endpoint ---------- */
  async function postOrder(o) {
    if (!C.orderEndpoint) return { ok: false, fallback: true };
    try {
      const res = await fetch(C.orderEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(o),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return { ok: true };
    } catch (err) {
      console.warn('Order endpoint failed, falling back to the email draft.', err);
      return { ok: false, fallback: true };
    }
  }

  /* ---------- RECEIPT (printable, like the first site) ---------- */
  const RECEIPTS_KEY = 'ayoola.receipts.v2';
  const receipts = {
    all() { try { const v = JSON.parse(localStorage.getItem(RECEIPTS_KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } },
    save(r) {
      const list = this.all();
      list.unshift(r);
      try { localStorage.setItem(RECEIPTS_KEY, JSON.stringify(list.slice(0, 20))); } catch (e) {}
    },
    find(ref) { return this.all().filter((r) => r.ref === ref)[0] || null; },
  };

  function receiptHTML(o) {
    const rows = o.items.map(function (i) {
      return '<tr>' +
        '<td class="name">' + S.esc(i.item) + '<br><span style="color:var(--muted);font-size:.78rem">' +
          S.esc(i.size) + '</span></td>' +
        '<td class="num">' + i.qty + '</td>' +
        '<td class="num">' + A.money(i.price) + '</td>' +
        '<td class="num">' + A.money(i.line) + '</td>' +
      '</tr>';
    }).join('');

    /* payment line: verified, awaiting verification, or not paid */
    let payLine = '';
    if (o.pay === 'card') {
      if (o.payment && o.payment.verified === true) {
        payLine = '<p><b style="color:var(--ok)">PAYMENT VERIFIED</b> - confirmed with Paystack by our ' +
          'payment automation.</p>';
      } else if (o.payment && o.payment.verified === false) {
        payLine = '<p><b style="color:var(--bad)">PAYMENT NOT CONFIRMED</b> - Paystack did not return a ' +
          'successful payment for reference ' + S.esc(o.payment.id) + '. Please call us on ' + C.phone + '.</p>';
      } else if (o.payment) {
        payLine = '<p>Payment made with card, reference <strong>' + S.esc(o.payment.id) + '</strong>. ' +
          'We are confirming it with Paystack and will call you within a few minutes.</p>';
      } else {
        payLine = '<p>Card payment was started but not confirmed.</p>';
      }
    }

    return '' +
    '<div class="rcpt">' +
      '<div class="rcpt-head">' +
        '<div class="rcpt-brand">' +
          '<b>Ayoola Enterprises</b>' +
          '<p>Food vendor in Akure &middot; foodstuffs, frozen fish, poultry &amp; drinks</p>' +
        '</div>' +
        '<div class="rcpt-meta">' +
          '<b>Order receipt</b>' +
          'Ref: ' + o.ref + '<br>' +
          new Date(o.at).toLocaleString('en-NG') + '<br>' +
          'Status: ' + S.esc(o.status) +
          (o.payment ? '<br>Payment: ' + S.esc(o.payment.status) +
            (o.payment.verified ? ' (verified)' : '') + '<br>' +
            '<span style="font-size:.6rem">' + S.esc(o.payment.id) + '</span>' : '') +
        '</div>' +
      '</div>' +

      '<div class="rcpt-parties">' +
        '<div><h4>Customer</h4><p>' + S.esc(o.name) + '<br>' + S.esc(o.phone) + '<br>' + S.esc(o.email) + '</p></div>' +
        '<div><h4>Delivery address</h4><p>' + S.esc(o.address) + '<br>' + S.esc(o.area) + ', ' +
          S.esc(o.city) + ', ' + S.esc(o.state) + (o.landmark ? '<br>Near: ' + S.esc(o.landmark) : '') + '</p></div>' +
      '</div>' +

      '<table class="rcpt-table">' +
        '<thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Amount</th></tr></thead>' +
        '<tbody>' + (rows || '<tr><td class="name" colspan="4">No items on this order.</td></tr>') + '</tbody>' +
        '<tfoot>' +
          '<tr><td colspan="3" class="lbl num">Subtotal</td><td class="num">' + A.money(o.subtotal) + '</td></tr>' +
          (o.discount ? '<tr><td colspan="3" class="lbl num">Discount</td><td class="num">- ' + A.money(o.discount) + '</td></tr>' : '') +
          '<tr><td colspan="3" class="lbl num">Delivery</td><td class="num">' +
            (o.delivery ? A.money(o.delivery) : 'Free') + '</td></tr>' +
          '<tr class="tot"><td colspan="3" class="lbl num">Total</td><td class="num">' + A.money(o.total) + '</td></tr>' +
        '</tfoot>' +
      '</table>' +

      '<div class="rcpt-foot">' +
        (o.pay === 'card'
          ? '<h4>Payment</h4>' + payLine
          : o.pay === 'transfer'
          ? '<h4>How to pay</h4>' +
            '<p>Transfer <strong>' + A.money(o.total) + '</strong> to:</p>' +
            '<p><strong>' + S.esc(C.bank.bank) + '</strong><br>' +
              'Account name: ' + S.esc(C.bank.accountName) + '<br>' +
              'Account number: ' + S.esc(C.bank.accountNumber) + '</p>' +
            '<p>Quote reference <strong>' + o.ref + '</strong>' +
              (o.pop ? ' and your transfer reference ' + S.esc(o.pop) : '') +
              '. Send us the alert on WhatsApp ' + C.phone + ' and we start packing.</p>'
          : o.pay === 'delivery'
            ? '<h4>How to pay</h4><p>Pay our rider in cash when the food arrives in ' +
              S.esc(C.city) + '. Keep reference <strong>' + o.ref + '</strong>.</p>'
            : '<h4>How to pay</h4><p>Complete payment on the payment page. Keep reference <strong>' +
              o.ref + '</strong>.</p>') +
        (o.note ? '<h4 style="margin-top:1rem">Your note</h4><p>' + S.esc(o.note) + '</p>' : '') +
        '<h4 style="margin-top:1rem">Questions</h4>' +
        '<p>WhatsApp ' + C.phone + ' or email ' + C.email + ' quoting ' + o.ref + '.</p>' +
      '</div>' +
    '</div>';
  }

  function showReceipt(ref) {
    const host = $('#receiptHost');
    const o = receipts.find(ref) || window.__lastOrder;
    if (!host || !o) return;
    host.innerHTML =
      '<div class="sec">' +
      '<div class="done"><div class="tick">&#10003;</div>' +
        '<h1>Order placed, ' + S.esc(o.name.split(' ')[0]) + '</h1>' +
        '<p>Your receipt is below. Send it to us so we can start packing and confirm the delivery time in Akure.</p>' +
        '<div class="refbox">' + o.ref + '</div>' +
      '</div>' +
      receiptHTML(o) +
      '<div class="rcpt-acts" style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:1rem">' +
        '<button class="btn btn-y" type="button" data-print>Print or save as PDF</button>' +
        '<a class="btn btn-o" href="' + mailDraft(o) + '">Send by email</a>' +
        '<a class="btn btn-o" target="_blank" rel="noopener" href="' + waLink(o) + '">Send on WhatsApp</a>' +
        '<a class="btn" href="category.html">Keep shopping</a>' +
      '</div></div>';
    host.hidden = false;
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function paintReceiptList() {
    const host = $('#pastReceipts');
    if (!host) return;
    const list = receipts.all();
    host.hidden = list.length === 0;
    if (!list.length) return;
    $('[data-rlist]').innerHTML = list.map(function (r) {
      return '<a href="#" data-rref="' + r.ref + '">' +
        '<span>' + r.ref + '</span>' +
        '<span>' + new Date(r.at).toLocaleDateString('en-NG') + ' &middot; ' + A.money(r.total) + '</span>' +
      '</a>';
    }).join('');
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-print]')) { window.print(); return; }
    const a = e.target.closest('[data-rref]');
    if (!a) return;
    e.preventDefault();
    showReceipt(a.dataset.rref);
  });

  /* ---------- Paystack: open the popup, then verify ---------- */
  function payWithPaystack(order, btn) {
    return new Promise(function (resolve) {
      if (!window.PaystackPop) {
        say('Paystack could not load. Check your internet, or pay by bank transfer.', 'err');
        btn.disabled = false;
        return resolve(false);
      }

      const amount = Math.round(order.total * 100);   /* naira -> kobo */

      const handler = PaystackPop.setup({
        key: PK,
        email: order.email,
        amount: amount,
        currency: C.currency || 'NGN',
        ref: order.ref,
        metadata: {
          order_ref: order.ref,
          customer: order.name,
          phone: order.phone,
          delivery_area: order.area,
        },
        onSuccess: function (trans) {
          cardMsg('');
          order.payment = {
            id: (trans && trans.reference) || order.ref,
            status: 'success',
            transaction: (trans && trans.transcription && trans.transcription.reference) || '',
            amount: amount,
            live: !PK.startsWith('pk_test_'),
          };
          order.status = 'Paid by card';
          resolve(true);
        },
        onCancel: function () {
          say('Payment cancelled. Your basket is still here if you want to try again.', 'err');
          btn.disabled = false;
          resolve(false);
        },
      });

      handler.openIframe();
    });
  }

  /* ---------- verification: Make first, Worker as fallback ---------- */
  async function verifyPaystack(order) {
    /* 1) ask Make to verify on Paystack (it holds the secret key) */
    if (C.makeWebhook) {      const res = await Make.sendPayment(order);
      order.automation = { sent: true, ok: res.ok, timedOut: !!res.timedOut, message: res.message || '' };
      order.payment = order.payment || {};
      if (res.paid === true) {
        order.payment.verified = true;
        order.payment.serverAmount = res.serverAmount;
        order.status = 'Paid by card - payment verified by our payment automation';
      } else if (res.verifyStatus && res.verifyStatus !== 'unknown' && res.paid === false) {
        order.payment.verified = false;
        order.status = 'Card payment not confirmed by Paystack (' + res.verifyStatus + ')';
      } else {
        order.payment.verified = null;              /* automation has not answered yet */
      }
      return order;
    }

    /* 2) no automation configured: use the Worker verifier instead */
    if (C.paystackEndpoint) {
      try {
        const res = await fetch(C.paystackEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference: order.payment.id || order.ref }),
        });
        const data = await res.json();
        if (res.ok && data.paid) {
          order.payment.verified = true;
          order.payment.serverAmount = data.amount;
        } else if (res.ok) {
          order.payment.verified = false;
          order.payment.serverStatus = data.status;
        } else {
          order.payment.verifyError = data.error;
        }
      } catch (e) {
        order.payment.verifyError = e.message;
      }
    }
    return order;
  }

  /* ---------- PLACE ORDER ---------- */
  $('#checkoutForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;

    const g = function (id) { return document.getElementById(id).value.trim(); };
    const order = buildOrder({
      name: g('name'), phone: g('phone'), email: g('email'),
      area: g('area'), address: g('address'), landmark: g('landmark'),
      when: g('when'), note: g('note'), pop: g('pop'),
    });

    const btn = this.querySelector('[type=submit]');
    btn.disabled = true;

    /* card: Paystack popup, then Make verifies the money */
    if (order.pay === 'card' && cardReady) {
      say('Opening secure payment...');
      payWithPaystack(order, btn).then(function (paid) {
        if (!paid) return null;
        say('Checking the payment with Paystack...');
        return verifyPaystack(order).then(function (o) {
          return postOrder(order).then(function () { return o; });
        });
      }).then(finishOrder);
      return;
    }

    /* transfer / cash: no verification needed, just tell the automation */
    say('Sending your order...');
    Make.sendOrder(order).then(function (res) {
      order.automation = { sent: true, ok: res.ok, message: res.message || '' };
    }).catch(function () {}).then(function () {
      return postOrder(order);
    }).then(function () { return order; }).then(finishOrder);
  });

  /* one place that saves the order, prints the receipt and clears the cart */
  function finishOrder(done) {
    if (!done) return;
    window.__lastOrder = done;
    receipts.save(done);
    paintReceiptList();

    try {
      localStorage.setItem('ayoola.customer.v1', JSON.stringify({
        name: done.name, phone: done.phone, email: done.email,
        area: done.area, city: done.city, address: done.address, landmark: done.landmark,
      }));
    } catch (err) {}

    S.cart.clear();

    const paid = done.payment && done.payment.status === 'success';
    const verified = done.payment && done.payment.verified;

    if (paid && verified === true) {
      say('Payment received and verified. A copy is on its way to your email.', 'ok');
    } else if (paid) {
      say('Payment made. We are confirming it with Paystack and will call you shortly.', 'ok');
    } else {
      say('Your order is ready. Send the email we opened, and your receipt is below.', 'ok');
      setTimeout(function () { window.location.href = mailDraft(done); }, 600);
    }

    $('#checkoutMain').hidden = true;
    showReceipt(done.ref);

    const btn = document.querySelector('#checkoutForm [type=submit]');
    if (btn) btn.disabled = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('cart:change', paint);  paint();
  paintReceiptList();
});
