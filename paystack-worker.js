/**
 * ============================================================
 * AYOOLA ENTERPRISES - Paystack payment endpoint (Cloudflare Worker)
 * ============================================================
 * Optional, but recommended before you go live.
 *
 * The website can take a card payment on its own using Paystack's
 * Inline JS with the PUBLIC key (pk_test_... / pk_live_...) - that
 * part is already working and needs no server.
 *
 * This Worker exists for the two things a browser must never do:
 *   1. VERIFY a payment really succeeded (public keys cannot do this)
 *   2. RECEIVE Paystack webhooks so orders are recorded automatically
 *
 * ------------------------------------------------------------
 * SET IT UP
 * ------------------------------------------------------------
 *   npm init -y
 *   npx wrangler init ayoola-payments --type javascript
 *   cd ayoola-payments
 *   copy  <this file>  to  src/index.js
 *
 *   npx wrangler secret put PAYSTACK_SECRET_KEY
 *   # paste: sk_test_8f6aad9f256bd19f406675e440815e285392ac35
 *
 *   npx wrangler deploy
 *
 * Then in Paystack: Settings > API Keys & Integration > set your
 * "Business Notification URL" to  https://ayoola-payments.YOUR-NAME.workers.dev/hook
 *
 * Paste the Worker URL into assets/js/catalog.js as paystackEndpoint
 * and the shop will verify every payment after the customer pays.
 * Leave it empty and test payments still work, they are just trusted
 * on the customer's word.
 *
 * ------------------------------------------------------------
 * GOING LIVE: swap in sk_live_... in the dashboard + wrangler secret,
 * and pk_live_... in catalog.js. Nothing else changes.
 * ============================================================
 */

const ALLOWED = {
  'POST, OPTIONS': 1,
};

/* orders we have seen, so the webhook can be matched back */
const seen = new Map();

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    /* ---------- webhook from Paystack ---------- */
    if (request.method === 'POST' && new URL(request.url).pathname === '/hook') {
      let body;
      try { body = await request.json(); } catch (e) { return json({ ok: false }, 400, cors); }

      const event = body.event || '';
      const data = body.data || {};
      const ref = data.reference || (data.metadata && data.metadata.order_ref) || '';

      if (event === 'charge.success') {
        seen.set(ref, {
          ref: ref,
          amount: data.amount / 100,
          currency: data.currency,
          status: 'success',
          at: new Date().toISOString(),
          email: data.customer && data.customer.email,
        });
        console.log('payment ok', ref, data.amount, data.currency);
      } else if (event === 'charge.failed') {
        seen.set(ref, { ref: ref, status: 'failed', at: new Date().toISOString() });
        console.log('payment failed', ref);
      }

      return json({ ok: true }, 200, cors);
    }

    if (request.method === 'GET') {
      /* quick health check, handy after deploying */
      return json({
        ok: true,
        service: 'Ayoola Enterprises payments',
        hasSecret: !!env.PAYSTACK_SECRET_KEY,
        testMode: (env.PAYSTACK_SECRET_KEY || '').startsWith('sk_test_'),
        webhook: new URL(request.url).pathname + '/hook',
        seen: Array.from(seen.values()).slice(-10),
      }, 200, cors);
    }

    if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, cors);

    const secret = env.PAYSTACK_SECRET_KEY;
    if (!secret) return json({ error: 'PAYSTACK_SECRET_KEY is not set on this Worker' }, 500, cors);

    let body;
    try { body = await request.json(); } catch (e) { return json({ error: 'Invalid JSON' }, 400, cors); }

    const reference = String(body.reference || '').slice(0, 40);
    if (!reference) return json({ error: 'reference is required' }, 400, cors);

    /* ---------- 1. verify a payment ---------- */
    const qs = new URLSearchParams();
    qs.set('reference', reference);

    let pay;
    try {
      const res = await fetch(
        'https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference),
        { headers: { Authorization: 'Bearer ' + secret } }
      );
      pay = await res.json();
    } catch (e) {
      return json({ error: 'Could not reach Paystack: ' + e.message }, 502, cors);
    }

    if (!pay || !pay.status) {
      return json({ error: (pay && pay.message) || 'Verification failed' }, 502, cors);
    }

    const d = pay.data || {};
    return json({
      ok: true,
      reference: d.reference,
      status: d.status,                       // success | failed | abandoned
      paid: d.status === 'success',
      amount: (d.amount || 0) / 100,          // naira
      currency: d.currency,
      channel: d.channel,
      paidAt: d.paid_at,
      testMode: secret.startsWith('sk_test_'),
      email: d.customer && d.customer.email,
    }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
