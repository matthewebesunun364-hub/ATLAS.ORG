/* ===========================================================
   AYOOLA ENTERPRISES - Make automation bridge
   ------------------------------------------------------------
   Sends each order to your Make webhook, and waits for Make to
   verify the payment on Paystack with your secret key.

   Rules this module keeps:
     * never blocks checkout - a dead webhook must not lose an order
     * never touches the secret key - only Make can verify payments
     * always answers with something usable, even on timeout
   =========================================================== */
(function () {
'use strict';

const A = window.AYOOLA;
const C = A.CONFIG;

/* ---------------- PAYLOAD ---------------- */
function buildPayload(order, phase) {
  return {
    /* who / what */
    event: phase,                       // 'order' | 'payment' | 'quote'
    order_ref: order.ref,
    placed_at: order.at,

    /* customer */
    customer: {
      name: order.name,
      phone: order.phone,
      email: order.email,
    },

    /* delivery - Akure only */
    delivery: {
      area: order.area,
      address: order.address,
      landmark: order.landmark || '',
      city: order.city,
      state: order.state,
      when: order.when || '',
      notes: order.note || '',
    },

    /* basket */
    items: (order.items || []).map(function (i) {
      return {
        id: i.id,
        item: i.item,
        size: i.size,
        qty: i.qty,
        price: i.price,
        line_total: i.line,
      };
    }),
    item_count: (order.items || []).reduce(function (n, i) { return n + i.qty; }, 0),

    /* money */
    totals: {
      subtotal: order.subtotal,
      discount: order.discount || 0,
      delivery_fee: order.delivery || 0,
      total: order.total,
      currency: C.currency || 'NGN',
    },

    /* how they intend to pay */
    payment: {
      method: order.pay,                                   // card | transfer | delivery
      status: order.status,
      transfer_reference: order.pop || '',
      /* Paystack reference from the popup, for Make to verify */
      paystack_reference: (order.payment && order.payment.id) || order.ref,
      transaction: (order.payment && order.payment.transaction) || '',
      amount_kobo: Math.round((order.total || 0) * 100),
    },

    /* what Make should do with it */
    seller: {
      name: C.sellerName,
      email: C.sellerEmail,
      phone: C.phone,
      whatsapp: C.whatsapp,
    },
    shop: {
      name: C.company,
      url: location.origin + location.pathname.replace(/[^/]*$/, ''),
      city: C.city,
    },
  };
}

/* ---------------- POST WITH TIMEOUT ---------------- */
function post(url, payload, ms) {
  return new Promise(function (resolve) {
    let done = false;
    const finish = function (value) { if (!done) { done = true; resolve(value); } };

    const timer = setTimeout(function () {
      finish({ ok: false, timedOut: true, error: 'No reply from the automation within ' + Math.round(ms / 1000) + 's' });
    }, ms);

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    if (ctrl) setTimeout(function () { ctrl.abort(); }, ms);

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl ? ctrl.signal : undefined,
    }).then(function (res) {
      return res.text().then(function (text) {
        clearTimeout(timer);
        finish(interpret(res.status, text));
      });
    }).catch(function (e) {
      clearTimeout(timer);
      finish({ ok: false, error: e && e.name === 'AbortError' ? 'Timed out' : String(e).slice(0, 140) });
    });
  });
}

/* Make answers with plain text unless the scenario maps a JSON
   response, so accept both shapes. */
function interpret(status, text) {
  const res = { httpStatus: status, raw: (text || '').slice(0, 600) };
  if (!text) return Object.assign(res, { ok: false, error: 'Empty reply' });

  let data = null;
  try { data = JSON.parse(text); } catch (e) { /* plain text */ }

  if (data && typeof data === 'object') {
    const paid = data.paid !== undefined ? Boolean(data.paid)
               : data.status === 'success' ? true
               : data.verified === true;
    return Object.assign(res, {
      ok: status < 400,
      paid: paid,
      verifyStatus: data.status || (paid ? 'success' : 'unknown'),
      reference: data.reference || data.paystack_reference || '',
      serverAmount: data.amount !== undefined ? data.amount : undefined,
      message: data.message || '',
      data: data,
    });
  }

  /* plain text reply: "Accepted" means the scenario received it */
  const low = text.toLowerCase();
  if (low.indexOf('accepted') > -1 || low.indexOf('ok') === 0 || low.indexOf('success') > -1) {
    return Object.assign(res, { ok: true, paid: false, queued: true, message: 'Automation received the order' });
  }
  if (low.indexOf('paid') > -1 || low.indexOf('verified') > -1) {
    return Object.assign(res, { ok: true, paid: true, verifyStatus: 'success' });
  }
  if (low.indexOf('not paid') > -1 || low.indexOf('failed') > -1 || low.indexOf('unpaid') > -1) {
    return Object.assign(res, { ok: true, paid: false, verifyStatus: 'failed' });
  }
  return Object.assign(res, { ok: status < 400, paid: false, message: text.slice(0, 120) });
}

/* ---------------- PUBLIC API ----------------
   sendOrder(order)      fire-and-forget notice
   verifyPayment(order)  wait for Make to confirm the money arrived   */
const Make = {
  enabled: function () { return !!C.makeWebhook; },

  sendOrder: function (order) {
    if (!C.makeWebhook) return Promise.resolve({ ok: false, skipped: true });
    return post(C.makeWebhook, buildPayload(order, 'order'), Math.min(8000, C.makeTimeout || 20000));
  },

  sendPayment: function (order) {
    if (!C.makeWebhook) return Promise.resolve({ ok: false, skipped: true });
    return post(C.makeWebhook, buildPayload(order, 'payment'), C.makeTimeout || 20000);
  },

  buildPayload: buildPayload,
  interpret: interpret,
};

window.AYOOLA_MAKE = Make;
if (window.SHOP) window.SHOP.Make = Make;
})();
