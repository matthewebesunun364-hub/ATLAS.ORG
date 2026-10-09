/**
 * ============================================================
 * AYOOLA ENTERPRISES - Paystack verification (Cloudflare Worker)
 * ============================================================
 * OPTIONAL. Your Make automation already verifies payments, so you
 * do not need this. It is kept here as a backup in case the
 * automation is ever paused or you want verification without Make.
 *
 * It holds the Paystack SECRET key (which must never be in the
 * website), verifies a payment by reference, and receives Paystack
 * webhooks.
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
 *   # paste your sk_test_... (or sk_live_... once you go live)
 *
 *   npx wrangler deploy
 *
 * Then paste the printed URL into assets/js/catalog.js as
 * paystackEndpoint, and in Paystack set
 *   Settings > API Keys & Integration > Business Notification URL
 *   to  https://ayoola-payments.YOUR-NAME.workers.dev/hook
 * ============================================================
 */

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
      } else if (event === 'charge.failed') {
        seen.set(ref, { ref: ref, status: 'failed', at: new Date().toISOString() });
      }

      return json({ ok: true }, 200, cors);
    }

    if (request.method === 'GET') {
      return json({
        ok: true,
        service: 'Ayoola Enterprises payments',
        hasSecret: !!env.PAYSTACK_SECRET_KEY,
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
