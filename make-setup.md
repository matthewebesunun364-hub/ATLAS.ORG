# Make scenario for Ayoola Enterprises

This is the exact scenario to build in [Make](https://www.make.com). It does the
job you described:

1. The website sends every order to your webhook (**the starting node**)
2. Make verifies the payment on Paystack using your secret key
3. Make answers the website with `paid: true` or `paid: false`
4. The website prints the receipt (stamped *payment verified* only on success)
5. Make emails the receipt to **the buyer** and **to you**

---

## 0. Before you start

Put your Paystack secret key in Make, never in the website:

1. Make &rsaquo; **Connections** &rsaquo; add a connection
2. Choose **HTTP** &mdash; or easiest: create the scenario and let Make ask for the
   Paystack key when you configure the HTTP module
3. Your secret key is `sk_test_…` from
   [Paystack &rsaquo; Settings &rsaquo; API Keys &amp; Integration] (use `sk_live_…`
   when you go live)

The website already holds your public key `pk_test_…`, which is safe and is what
opens the payment popup.

---

## 1. Scenario: name it `Ayoola - order and payment verification`

### Module 1 — Custom webhook (STARTING NODE)

* App: **Webhooks by Make** &rsaquo; **Custom webhook**
* Copy the URL Make gives you and put it in
  `assets/js/catalog.js` as `makeWebhook` (yours is already in there)
* Set **Webhook response type** to `No response` *temporarily* while you build,
  then switch to `Respond to the webhook` in step 5

Sample payload the site sends (this is exactly what lands in Make):

```json
{
  "event": "payment",
  "order_ref": "AE-20261009-6514",
  "placed_at": "2026-10-09T14:22:10.000Z",
  "customer":  { "name": "Amaka Obi", "phone": "08031234567", "email": "amaka@example.com" },
  "delivery":  { "area": "Alagbaka", "address": "12 Allen Ave", "landmark": "",
                 "city": "Akure", "state": "Ondo", "when": "As soon as possible today", "notes": "" },
  "items":     [ { "id": "rice50", "item": "Long Grain Parboiled Rice",
                   "size": "25kg", "qty": 2, "price": 44000, "line_total": 88000 } ],
  "item_count": 2,
  "totals":    { "subtotal": 88000, "discount": 0, "delivery_fee": 0,
                 "total": 88000, "currency": "NGN" },
  "payment":   { "method": "card", "status": "Paid by card",
                 "transfer_reference": "",
                 "paystack_reference": "AE-20261009-6514",
                 "transaction": "", "amount_kobo": 8800000 },
  "seller":    { "name": "Ayoola Enterprises", "email": "olufunmilayobolanle@gmail.com",
                 "phone": "08060157605", "whatsapp": "2348060157605" },
  "shop":      { "name": "Ayoola Enterprises", "url": "https://ayoola-enterprise.pages.dev/",
                 "city": "Akure" }
}
```

`event` is the switch:

| `event` | When | Paystack check needed |
|---|---|---|
| `order` | bank transfer or cash on delivery | no |
| `payment` | card paid, popup succeeded | **yes** |

---

### Module 2 — Router

Route on the `event` field so card orders get verified and others go straight to
the receipt.

* Case 1: `payment` &rarr; verify
* Case 2: anything else &rarr; receipt only

---

### Module 3 — HTTP: verify the payment (Case 1 only)

* Method: **GET**
* URL: `https://api.paystack.co/transaction/verify/{{paystack_reference}}`
* Headers:
  * `Authorization: Bearer YOUR_PAYSTACK_SECRET_KEY`
  * `Content-Type: application/json`
* Parse the response (`Parse response` enabled) &mdash; you get `data.status`,
  `data.amount`, `data.reference`, `data.paid_at`

Sanity check: `{{status}}` is `true` when Paystack found the payment,
`{{data:status}}` is `success`, `failed` or `abandoned`.

Paid is true when: `status` is `true` **and** `data:status` = `success`.

---

### Module 4 — Text: build the receipt

App: **Utilities &rsaquo; Text formatter**. Paste this and map the fields:

```
AYOOLA ENTERPRISES - ORDER RECEIPT
=================================

Reference:    {{order_ref}}
Placed:       {{placed_at}}
Status:       {% if verified %}{VERIFIED - PAYMENT RECEIVED}{% else %}{NOT PAID}{% endif %}

CUSTOMER
Name:         {{customer:name}}
Phone:        {{customer:phone}}
Email:        {{customer:email}}

DELIVERY (Akure, Ondo State)
Area:         {{delivery:area}}
Address:      {{delivery:address}}
When:         {{delivery:when}}
Notes:        {{delivery:notes}}

ITEMS
{% for item in items %}{{item:qty}} x {{item:item}} ({{item:size}})  NGN {{item:line_total}}
{% endfor %}

Subtotal:     NGN {{totals:subtotal}}
Delivery:     {% if totals:delivery_fee %}NGN {{totals:delivery_fee}}{% else %}Free{% endif %}
TOTAL:        NGN {{totals:total}}

PAYMENT
Method:       {{payment:method}}
{% if verified %}Reference:  {{paystack:reference}}
Verified by Paystack at {{paystack:paid_at}}
{% else %}No successful payment found for this reference.
We will confirm before packing.{% endif %}

Thank you for shopping with us in Akure.
Questions: 08060157605 / olufunmilayobolanle@gmail.com
```

Copy that output into a variable called `receipt_text` (map it on the next
modules).

---

### Module 5 — Email the buyer

App: **Email &rsaquo; Send an email** (Gmail, Outlook, whatever you use)

* **To:** `{{customer:email}}`
* **Subject:** `Your Ayoola Enterprises receipt {{order_ref}}`
* **Body:** `{{receipt_text}}`

---

### Module 6 — Email yourself

* **To:** `{{seller:email}}` (this is `olufunmilayobolanle@gmail.com` from the payload)
* **Subject:** `{% if verified %}PAID{% else %}ORDER{% endif %} {{order_ref}} - {{customer:name}} - NGN {{totals:total}}`
* **Body:** `{{receipt_text}}`
* Optional: add a WhatsApp module to message your own number with the short summary

---

### Module 7 — Respond to the webhook (this is what the website reads)

Back in the **Webhook** module (step 1), set **Webhook response type** to
`Respond to the webhook`, or add a **Webhook Response** module at the end.

Return this JSON:

```json
{
  "paid": {% if verified %}true{% else %}false{% endif %},
  "status": "{{paystack:status}}",
  "reference": "{{paystack:reference}}",
  "amount": {{totals:total}},
  "currency": "NGN",
  "message": "{% if verified %}Payment received{% else %}Payment not confirmed{% endif %}"
}
```

The website reads `paid` and prints **PAYMENT VERIFIED** on the receipt.

If the response comes back as plain text instead of JSON, the site still works:
it accepts `Accepted`, `paid`, `verified`, `not paid` or `failed` as text too.

---

## 2. Check it works

1. Open your site &rarr; add something to the cart &rarr; checkout
2. Choose **Pay with card** and complete the Paystack popup
3. Make should light up once with a run
4. The receipt appears with **PAYMENT VERIFIED** in green
5. You and the buyer both get the receipt email
6. The transaction shows in Paystack &rsaquo; Transactions

The site waits up to 20 seconds for Make to answer (`makeTimeout` in
`catalog.js`). If Make is slow the customer still gets their receipt, marked
"we are confirming it with Paystack", and nothing is lost.

---

## 3. Suggested schedule

| Scenario | Runs | What it does |
|---|---|---|
| `Ayoola - order and payment verification` | instantly on webhook | verify, email both |
| `Ayoola - abandoned basket follow up` | every 15 min | the site never calls this, optional |

---

## 4. Troubleshooting

| Symptom | Fix |
|---|---|
| Site says "we are confirming it with Paystack" | Make took longer than 20s, or the scenario errored. Open the run log in Make to see. |
| `paid` always false | Check the HTTP module URL uses `{{paystack_reference}}` and the Authorization header holds the secret key with no extra spaces |
| Make says 401 | Secret key wrong or has whitespace. Re-copy it from Paystack. |
| No email arrives | Map the buyer address from `{{customer:email}}`, and make sure the email module is authorised in Make |
| Webhook returns plain text | Set **Webhook response type** to `Respond to the webhook`, or accept the text fallback above |
| Nothing happens at all | Confirm the webhook URL in `catalog.js` matches the Custom webhook URL in Make |

---

## 5. Rotating keys before going live

You pasted both Paystack keys into a chat, so treat them as exposed.

1. Paystack &rsaquo; **Settings** &rsaquo; **API Keys &amp; Integration** &mdash; roll both keys
2. Put the new **public** key in `catalog.js` as `paystackPublicKey`
3. Put the new **secret** key in Make (the HTTP module header) and in the Worker
   if you deploy `paystack-worker.js`
4. Test one order before announcing the shop
