# Ayoola Enterprises — Jumia-style online shop

A complete, responsive e-commerce storefront for **Ayoola Enterprises** (foodstuffs,
frozen fish, poultry, drinks and wholesale bundles). Plain HTML, CSS and JavaScript —
no build step, no monthly fees. It runs on any static host (Cloudflare Pages, Netlify,
GitHub Pages, or a normal web server).

The colour system and typography are the same as your existing Ayoola Enterprise site:
near-black ground, warm off-white type, one burnt-orange accent, hairline borders, and
the Instrument Serif + Archivo fonts (bundled in `assets/fonts/`).

---

## 0. Colours and fonts

| Token | Value | Used for |
|---|---|---|
| `--ground` | `#0b0b0c` | page background |
| `--surface` | `#111113` | cards, panels, header search |
| `--surface-2` | `#17171a` | raised blocks, image placeholders |
| `--paper` | `#e9e7e2` | headings and prices |
| `--muted` | `#8a8781` | secondary text |
| `--line` | `rgba(233,231,226,.14)` | every border |
| `--accent` | `#c2600f` | buttons, badges, links, highlights |
| `--accent-soft` | `#e08a3c` | hover, discounts, italic emphasis |
| `--ok` | `#5f9e73` | confirmations, discounts |

* **Instrument Serif** — headings, prices on the product page, wordmark
* **Archivo** — body copy, buttons, form fields
* **ui-monospace** — eyebrows, labels, counters, references, prices on cards

Everything is defined once at the top of `assets/css/site.css` under `:root`, so
re-tinting the whole shop means editing those nine lines.

---

## 1. Run it

Double-click nothing — just serve the folder:

```bash
# from this folder
python -m http.server 8765
# then open http://localhost:8765
```

Or drag the folder onto [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
in VS Code. Opening `index.html` directly from disk also works.

## 2. Files

```
index.html         Home page (hero carousel, flash sale, categories, deal tabs)
category.html      Listing page: filters, sorting, search results, pagination
product.html       Product detail page (pack sizes, quantity, add to cart)
cart.html          Cart with quantity controls and promo codes
checkout.html      Address, payment method, order summary, confirmation
wholesale.html     Bulk quote form, about us, delivery, payments, FAQ, contact
404.html           Not-found page

assets/css/site.css      All styling (Atlas dark theme, orange accent)
assets/fonts/            Instrument Serif + Archivo woff2 (bundled, no CDN needed)
assets/js/catalog.js  ←  EDIT THIS: your stock, prices, phone, bank details
assets/js/store.js      Header, footer, cart engine, product cards, drawer
assets/js/home.js       Home page widgets
assets/js/category.js   Filtering, sorting, search, pagination
assets/js/product.js    Product detail behaviour
assets/js/cart.js       Cart page
assets/js/checkout.js   Checkout, validation, order confirmation
assets/js/wholesale.js  Quote form and help page

robots.txt / sitemap.xml   SEO basics (update the domain inside sitemap.xml)
```

## 3. Make it yours — `assets/js/catalog.js`

This is the only file you must edit to run a real business.

```js
const CONFIG = {
  orderEndpoint: '',              // optional: URL that receives orders as JSON
  phone: '+234 800 000 0000',     // ← your number
  whatsapp: '2348000000000',      // ← digits only, no +
  email: 'orders@ayoolaenterprises.ng',   // ← your email
  bank: { bank: 'Bank Name', accountName: 'Ayoola Enterprises', accountNumber: '0000000000' },
  deliveryFee: 3500,
  freeDeliveryOver: 50000,        // free delivery above this amount
  flashSaleEnds: null,            // e.g. '2026-12-31T23:59:00'
  showPriceNotice: true,          // set false once real prices are in
};
```

Products are plain objects:

```js
{ id:'rice50', cat:'foodstuffs', name:'Long Grain Parboiled Rice',
  unit:'per bag', brand:'Olam', emoji:'🍚', hue:38,
  sizes:[ {label:'5kg', price:9500},
          {label:'25kg', price:44000},
          {label:'50kg', price:85000, was:92000} ] }   // `was` = old price for the
                                                          // discount badge
```

* `id` — unique code used by the cart. Keep it short, no spaces.
* `cat` — must match a category id (`foodstuffs`, `frozen`, `poultry`, `drinks`,
  `oils`, `noodles`, `snacks`, `bundles`). Add new categories freely in `CATEGORIES`.
* `emoji` + `hue` — the placeholder photo (a coloured card with an icon). Products
  with several sizes automatically get size buttons, and `was` prices automatically
  produce a “−12%” badge and a strikethrough.

### Using real photos

Drop JPG/PNG files into `assets/img/products/` named after the product id
(`rice50.jpg`, `ftilapia.jpg`…). To use them instead of the dark placeholder card,
change the `art()` function at the bottom of `catalog.js`:

```js
function art(p) {
  return 'assets/img/products/' + p.id + '.jpg';   // falls back if missing
}
```

Or keep both, with an automatic fallback:

```js
function art(p) {
  return 'assets/img/products/' + p.id + '.jpg';
}
// and in store.js, after rendering an <img>: on error, swap in the placeholder.
```

## 4. Taking real orders

Checkout validates the form, generates a reference like `AE-20261008-4895`, empties
the cart and shows the customer:

1. their full order summary and total,
2. your bank details plus the amount and reference to quote,
3. a **“Send order on WhatsApp”** button that opens WhatsApp with the whole order
   pre-written,
4. an **“Email the order instead”** button that opens their mail app with the same
   details addressed to you.

That means orders reach you even with no server. If you would rather have them
arrive automatically, set `orderEndpoint` in `catalog.js` to a URL that accepts a
JSON POST — a Google Apps Script web app, a Formspree form, or a Cloudflare Worker:

```js
orderEndpoint: 'https://script.google.com/macros/s/AKfy.../exec',
```

The site then POSTs the full order object (`ref`, `name`, `phone`, `email`, `address`,
`items[]`, `total`, …) every time an order is placed.

## 5. Promo codes

`cart.js` and `checkout.js` share this block — add your own codes:

```js
const PROMOS = { AYOOLA10: 10, WELCOME5: 5 };   // number = percent off
```

## 6. Publishing

**Cloudflare Pages** (what your current site uses): push this folder to a GitHub repo
and connect it — build command empty, output directory `/`. Or drag the folder onto
the Cloudflare Pages direct-upload page.

Any other host: upload every file and subfolder, keep the folder structure, done.

Before going live:

- [ ] replace `phone`, `whatsapp`, `email` and the bank details
- [ ] replace all placeholder prices and pack sizes
- [ ] set `showPriceNotice: false`
- [ ] put your own domain in `sitemap.xml` and add the `Store` JSON-LD phone/email
      in `index.html`
- [ ] edit the bulk-discount table and the owner story on `wholesale.html`
- [ ] add your real photos and switch `art()` to use them

## 7. What is included

* Dark "Atlas" theme matching your existing site: top bar, wordmark, big search,
  category nav, orange promo strip
* Hero carousel with auto-play and arrows, plus two side promo cards
* Flash sale row with a live countdown timer
* Category tiles, tabbed deal/popular/best-seller panels, top-deals and
  best-seller blocks, wholesale banner, “how ordering works”
* Listing page with category / price / deal / bulk / brand filters, six sort orders,
  active-filter chips, pagination, empty state
* Product pages with pack-size picker, quantity stepper, related products
* Slide-out cart drawer, full cart page, promo codes
* Checkout with validation, Nigerian state list, two payment methods, bank
  details, order summary and a printable confirmation screen
* Wholesale quote form that opens WhatsApp pre-filled, plus delivery, payments,
  returns, FAQ and contact sections
* Mobile responsive (hamburger menu, 2-column grid, off-canvas filters)
* Lightweight: no frameworks, no external requests, no tracking
