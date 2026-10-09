# Ayoola Enterprises — food delivery in Akure

A complete, responsive online shop for **Ayoola Enterprises**, food vendor in
**Akure, Ondo State** — foodstuffs, frozen fish, poultry, drinks, oils and
wholesale bundles, with **Paystack card payments**.

Plain HTML, CSS and JavaScript. No build step, no frameworks, no monthly fees.
Deploys to Cloudflare Pages, Netlify, GitHub Pages or any normal web host.

---

## 1. Run it

```bash
python -m http.server 8765     # then open http://localhost:8765
```

Pages: `index.html` (home), `category.html` (list and filters),
`product.html`, `cart.html`, `checkout.html`, `wholesale.html`, `404.html`.

---

## 2. Card payments with Paystack

Card payments run through **Paystack**. The site holds only your public key
(`pk_…`), which opens the secure payment popup. The payment is then verified by
the Make automation, which is the only place your secret key lives.

* Configuration: `paystackPublicKey` in `assets/js/catalog.js`
* Verification: your Make webhook (`makeWebhook`) calls Paystack's verify API
  and answers the website with `{"paid": true|false}`
* Receipt: stamped **PAYMENT VERIFIED** only when Make confirms the money

The keys you supplied are **Paystack** keys, not Stripe. `api.paystack.co`
accepts them; `api.stripe.com` rejects them with `401 Invalid API Key`.

### Optional backup

`paystack-worker.js` is a Cloudflare Worker that can verify payments and receive
Paystack webhooks if the automation is ever paused. Deploy it, then set its URL
as `paystackEndpoint`. You do not need it while Make is running.

### Going live

1. Paystack &rsaquo; Settings &rsaquo; API Keys &mdash; switch to live keys
2. Put `pk_live_…` in `paystackPublicKey`
3. Put `sk_live_…` in the Make HTTP module header (and in the Worker if used)
4. Test one real order before announcing the shop

Both keys were pasted into a chat during setup, so roll them before going live.
## 3. How an order reaches you without a gateway

Exactly how your first Ayoola Enterprise site worked, and it still runs
alongside card payments:

1. Customer fills in details and presses **Place order**
2. Order saved, **printable receipt appears instantly** with a reference like
   `AE-20261009-6551`, including your bank details
3. A **pre-written email draft opens** addressed to
   `olufunmilayobolanle@gmail.com`, plus **WhatsApp** and
   **Print / Save as PDF**
4. Past orders stay listed at the bottom of the page

Optional: set `orderEndpoint` in `catalog.js` to a URL that accepts a POST
(Google Apps Script, Formspree, another Worker) and orders are also sent there
automatically.

---

## 4. Make it yours — assets/js/catalog.js

```js
phone: '08060157605',
whatsapp: '2348060157605',                  // digits only, no +
email: 'olufunmilayobolanle@gmail.com',
city: 'Akure',
state: 'Ondo',
areas: ['Akure township','Alagbaka','Ibara','Oke-Ako','Ilesha',
        'Ile Alafia','Oba Palace area','Ado Ekiti road','Federal Palace way'],
deliveryFee: 2500,
freeDeliveryOver: 30000,                    // free above this inside Akure
sameDayCutoff: '2pm',
currency: 'NGN',
paystackPublicKey: 'pk_test_ce6f0a13daed65eaf34d39fdd3a2ba9e53db8e3d',
paystackEndpoint: '',                       // optional Worker URL
orderEndpoint: '',                          // optional order receiver
showPriceNotice: true,                      // false once real prices are in
bank: { bank: 'Bank Name', accountName: 'Ayoola Enterprises', accountNumber: '0000000000' },
```

**Prices are still placeholders.** The home page shows a warning ribbon until you
replace them, then set `showPriceNotice: false`.

A product looks like this:

```js
{ id:'rice50', cat:'foodstuffs', name:'Long Grain Parboiled Rice',
  unit:'per bag', brand:'Olam', hue:38,
  blurb:'Fortified parboiled long grain rice...',
  sizes:[ {label:'5kg', price:9500},
          {label:'25kg', price:44000},
          {label:'50kg', price:85000, was:92000} ] }   // `was` = discount badge
```

---

## 5. Product photos

45 real photographs live in `assets/img/products/`, named after the product id
(`rice50.jpg`, `ftilapia.jpg`, `malt.jpg`…), loaded automatically with a dark
placeholder fallback so a missing file never breaks a page.

**Replace them with photos of your own stock** — same filenames, same folder.

Where the current ones came from: Wikimedia Commons and Flickr via Openverse,
under Creative Commons or public domain (mostly CC0). Several are generic
(food, crates, cold store) rather than exact products, which is exactly why
swapping in your own pictures is worth doing.

---

## 6. Logo

Header and footer use your logo — the gold towers mark plus the
`AYOOLA / ENTERPRISE` wordmark in gold, drawn as SVG so it is sharp at any size.

To use your exact file, save it as `assets/img/logo.png` and replace the body
of `logoMark()` near the top of `assets/js/store.js` with:

```js
return '<img src="assets/img/logo.png" alt="" width="40" height="36">';
```

---

## 7. Colours and fonts

Same system as your original Ayoola Enterprise site.

| Token | Value | Used for |
|---|---|---|
| `--ground` | `#0b0b0c` | page background |
| `--surface` / `--surface-2` | `#111113` / `#17171a` | cards, panels |
| `--paper` | `#e9e7e2` | headings, prices |
| `--muted` | `#8a8781` | secondary text |
| `--line` | `rgba(233,231,226,.14)` | every border |
| `--accent` | `#c2600f` | buttons, badges, links |
| `--accent-soft` | `#e08a3c` | hover, discounts |
| `--ok` | `#5f9e73` | confirmations |

Gold wordmark: `#e9cd8a`. Instrument Serif and Archivo are bundled in
`assets/fonts/`, so no CDN is needed. Re-tinting the shop means editing nine
lines at the top of `assets/css/site.css`.

---

## 8. SEO

**On page** — Akure-focused title and meta description on every page, an `h1` on
each page, a "Food delivery in Akure, Ondo State" block with your delivery
areas, a six-question FAQ, canonical links, Open Graph and Twitter tags,
`robots.txt`, `sitemap.xml`, alt text on every product image, lazy loading.

**Structured data** — `Store` + `GroceryStore` + `FoodEstablishment` with your
phone, email, Akure/Ondo address, Akure coordinates (7.2506, 5.1973), opening
hours, service radius and full catalogue; plus `WebSite` and `FAQPage`.

**For a real top-five ranking on "food delivery Akure"** — no one can promise
that from code, but these decide it:

1. **Google Business Profile** matters more than the website. List Ayoola
   Enterprises as a food store in Akure with your real address, hours, phone and
   photos, and collect 20+ reviews.
2. Identical name, address and phone on the website, Google Business Profile,
   Facebook, Instagram and the WhatsApp Business catalogue.
3. Accurate delivery times and fees on the page — searchers filter on
   "same-day", "delivery fee", "open now".
4. Your own photographs of actual stock and your rider.
5. Local links: Akure food blogs, restaurant pages, community groups, event
   planners, market associations.
6. Regular WhatsApp Business and Facebook posts of real deliveries.
7. Google Search Console, submit `sitemap.xml`, replace the placeholder prices.

---

## 9. Before you go live

- [ ] Switch to Paystack live keys and rotate the test keys (they were pasted into a chat)


- [ ] Replace the placeholder prices and pack sizes, set `showPriceNotice: false`
- [ ] Put your real bank details in `CONFIG.bank`
- [ ] Replace the 45 product photos with your own
- [ ] Replace the owner story on `wholesale.html#about`
- [ ] Update the bulk-discount table and delivery fee
- [ ] Change the domain inside `sitemap.xml`
- [ ] Set up the Google Business Profile for Akure

---

## 10. Publishing

**Cloudflare Pages** (what your current site uses): push this folder to a GitHub
repository, connect it in Cloudflare Pages, leave the build command empty and set
the output directory to `/`. Or drag the folder onto the direct-upload page.

Any other host: upload the folder with its structure intact and you are done.
