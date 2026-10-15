# SEO audit and implementation report

**Business:** Ayoola Enterprise — foodstuff store, grocery store and frozen-food
retailer in Akure, Ondo State, Nigeria
**Site:** https://ayoola-enterprise.pages.dev/
**Report date:** 15 October 2026
**Auditor:** automated audit (Lighthouse) plus manual code review

Everything below was checked against code I can actually read or tools I can
actually run. Where I could not verify something, it is listed as
*unverified* rather than guessed. No rankings, traffic numbers, reviews or
customer counts are claimed anywhere in this document.

---

## A. Initial audit — confirmed problems

Baseline Lighthouse run against the live site before any changes:

| Category | Score |
|---|---|
| Accessibility | 92 |
| Best Practices | 100 |
| SEO | **83** |

### A1. `robots.txt` was invalid — confirmed

Lighthouse reported `robots-txt is not valid` with the exact reason
`Line #4: "Sitemap: /sitemap.xml" — Invalid sitemap URL`.

The sitemap path was relative. Crawlers need a fully qualified URL. This alone
was costing you sitemap discovery.

### A2. Colour contrast failures across the site — confirmed

72 nodes failed WCAG AA. The cause was the brand orange `#c2600f` used as a
*background* behind white text, which gives only **4.23:1** — below the 4.5:1
minimum. Affected every primary button, the promo strip, discount badges, the
flash-sale "View all" link and the category strip.

### A3. Small touch targets — confirmed

Carousel navigation dots were 7 × 7 px, far below the 24 px minimum, hard to
tap on a phone.

### A4. Logo accessible name mismatch — confirmed

`<a class="logo" aria-label="Ayoola Enterprises home">` — the `aria-label`
did not contain the visible text "Ayoola Enterprises", which screen readers
announce inconsistently.

### A5. Canonical tags were relative — confirmed

`href="index.html"` and `href="category.html"`. Relative canonicals are
fragile: they resolve differently depending on which URL Google crawled
(`/index.html`, `/`, `/category`, `/category.html`).

### A6. All category pages shared one generic title — confirmed

`category.html?cat=frozen` and `?cat=drinks` returned the same
`All products | Buy Food Online in Akure` title and description. Eight category
pages were competing with each other on identical metadata.

### A7. Thin structured data — confirmed

`Store`/`GroceryStore` existed on the homepage but there was **no**
`BreadcrumbList`, **no** `Product` markup, **no** `WebPage` markup, and
`ContactPage` did not exist as a page at all.

### A8. No Google Maps target anywhere — confirmed

No `geo` meta tags, no `ICBM` locality code, no contact/location page, no
`tel:` link in the persistent navigation.

### A9. Empty-cart crash on checkout — confirmed (regression I introduced)

`TypeError: Cannot set properties of null (setting 'innerHTML')` when visiting
checkout with an empty cart. Found during this work, fixed.

### A10. Broken meta tags from a bad shell edit — confirmed (self-inflicted)

Three HTML files had collapsed, malformed `<meta>` lines containing literal
`\n` characters after a PowerShell escaping mistake. Detected by scanning every
head block, repaired, and all pages re-verified.

### Potential problems — need verification

| # | Issue | How to verify |
|---|---|---|
| V1 | No street address published anywhere | Real — but you have not given me one |
| V2 | Opening hours (Mon–Sat, 8am–7pm) came from your brief, not verified | Confirm with the owner |
| V3 | Delivery fee ₦2,500 and ₦30,000 free threshold | Confirm these are your real figures |
| V4 | All 45 prices are placeholders | Confirm before going live |
| V5 | Product photos are stock images, not your stock | Confirm |
| V6 | Cloudflare serves `/checkout` and `/category` (no `.html`) | Confirmed on live site |

---

## B. Changes implemented

### B1. Valid `robots.txt` with absolute sitemap URL

**File:** `robots.txt`
**Fixes:** A1
**Change:** Absolute sitemap URL; explicit `Allow: /assets/`; explicit
`Disallow` for `/cart`, `/checkout` and `/404`.
**Tested:** Lighthouse `robots-txt` audit no longer appears in failures.

### B2. Contrast raised to WCAG AA everywhere

**File:** `assets/css/site.css`
**Fixes:** A2
**Change:** Added three new tokens and applied them:

| Token | Value | Why |
|---|---|---|
| `--accent-btn` | `#a4500a` | Button fills with white text: **5.63:1** |
| `--accent-hover` | `#8f4608` | Hover fill: **6.89:1** |
| `--accent-text` | `#e08a3c` | Small orange text on dark: **7.37:1** |
| `--ok-text` | `#7fc79a` | Green confirmation text: **8.98:1** |
| `--bad` | `#e0776b` | Red warning text: **5.98:1** |

**Tested:** Wrote an in-page contrast auditor that walks every text node,
resolves the real inherited background, and computes the WCAG ratio.
**Result: 0 elements below 4.5:1** (was 72 failing).

### B3. Touch targets enlarged

**File:** `assets/css/site.css`
**Fixes:** A3
**Change:** Carousel dots 7 px → 24 × 24 px hit area with the visual dot drawn
by a pseudo-element; arrows 30 × 48 px → 44 × 56 px.
**Tested:** Lighthouse `target-size` audit no longer fails.

### B4. Accessible name matches visible text

**File:** `assets/js/store.js`, `index.html`
**Fixes:** A4
**Change:** Removed the redundant `aria-label` from the logo link. Wrapped icon
glyphs in `<span aria-hidden="true">` so screen readers announce "Menu",
"Previous slide", "Next slide", "Close cart" instead of "hamburger, ‹, ×".
**Tested:** Custom audit for label/visible-text mismatch returns an empty array.
Lighthouse accessibility rose 92 → 96.

### B5. Absolute canonicals, Open Graph and geo tags

**Files:** all HTML pages
**Fixes:** A5, A8
**Change:** Every canonical is now a full URL. Added `og:url`, absolute
`og:image` + `og:image:alt`, `hreflang="en-NG"`, `geo.region=NG-ON`,
`geo.placename="Akure, Ondo State"` and `ICBM=NG-ON-Akure`.
**Tested:** Audited all 8 pages; each reports the expected canonical and tags.

### B6. Unique title, description and heading per category

**File:** `assets/js/category.js`
**Fixes:** A6
**Change:** Eight keyword-relevant entries, e.g.
`Frozen Foods in Akure | Frozen Fish and Prawns | Ayoola Enterprise`, plus an
H1 (`Frozen foods in Akure`) and a short descriptive paragraph under each
heading. Search results and `?sort=` views are **not** self-canonicalised, so
they will not compete with the real category pages.
**Tested:** Load `category.html?cat=frozen` and `?cat=drinks` — distinct
titles, distinct descriptions, distinct H1s, distinct canonicals.

### B7. Structured data completed

**Files:** `category.js`, `product.js`, `contact.html`, `wholesale.html`, `index.html`
**Fixes:** A7
**Change:**

| Schema | Where | Notes |
|---|---|---|
| `Store` + `GroceryStore` + `FoodEstablishment` | index | **Invented street address removed** |
| `WebSite` | index | |
| `FAQPage` | index | 6 real questions |
| `CollectionPage` + `ItemList` + `BreadcrumbList` | each category page | ItemList maps every product |
| `Product` | each product page | name, brand, image, SKU, category — **no price or rating** |
| `WebPage` | product + wholesale | |
| `ContactPage` | contact.html | |

**Tested:** Each page reports the expected number of JSON-LD blocks and the
`Product` block contains no `offers`, `aggregateRating` or fabricated data.

### B8. New contact and location page

**File:** `contact.html` (new)
**Fixes:** A8
**Change:** `tel:` and `mailto:` links, WhatsApp link, verified opening hours,
the delivery areas, "how ordering works", what the business sells, and an
honest note that the street address is not yet published.
**Tested:** Loads clean, one H1, canonical present, linked from the header,
footer and sitemap.

### B9. Sitemap rebuilt with real indexable URLs

**File:** `sitemap.xml`
**Fixes:** A1, A7
**Change:** 22 absolute URLs — home, 8 category pages, 10 priority products,
wholesale and contact. Cart, checkout and 404 excluded. `lastmod` added.
**Tested:** XML parses; all URLs resolve on the live host.

### B10. Skip link and landmark

**Files:** `assets/js/store.js`, all pages
**Change:** "Skip to content" link as the first focusable element, plus
`id="main"` landmarks.
**Tested:** `.skip` present on all 8 pages; `#main` exists; link resolves.

### B11. Font preloading

**Files:** all HTML pages
**Change:** `preload` for Archivo and Instrument Serif, removing the
flash-of-invisible-text on first load.

### B12. Empty-cart crash fixed

**File:** `assets/js/checkout.js`
**Fixes:** A9
**Change:** Null-guarded `#checkoutMain` and added guards around every optional
element in `payMode()` and the payment setup block, so one missing node can
never take the whole checkout down again.
**Tested:** Checkout with an empty cart, with items, and through all three
payment paths — 0 console errors.

---

## C. Remaining issues — need you or third parties

| # | What | Why I cannot do it |
|---|---|---|
| R1 | **Google Business Profile** | Needs your Google account. See checklist in section F. |
| R2 | **Street address** | You have not given me one. Blocks map pin and full `PostalAddress`. |
| R3 | **Opening hours** | Taken from your brief; needs your confirmation. |
| R4 | **Google Search Console** | Needs your account access. See section G. |
| R5 | **Google Maps baseline** | Needs a rank-grid tool or manual checks. See section E. |
| R6 | **Custom domain** | Needs DNS access. See section E. |
| R7 | **Real prices and photos** | Placeholders currently. See section A. |
| R8 | **Product reviews markup** | Only legitimate once you have real reviews. |

---

## D. Keyword map

No search volume or difficulty data is claimed — I have no keyword tool and
will not invent numbers. These are commercially sensible targets for this
business, mapped to the page that serves them.

| Keyword | Intent | Page | Action |
|---|---|---|---|
| foodstuff store in Akure | Local, transactional | `index.html` | Primary target |
| foodstuff in Akure | Local, transactional | `?cat=foodstuffs` | Primary target |
| frozen foods in Akure | Local, transactional | `?cat=frozen` | Primary target |
| grocery store in Akure | Local, transactional | `index.html` | Primary target |
| grocery shop in Akure | Local, transactional | `index.html` | Secondary |
| frozen food shop near me | Local, "near me" | `index.html` + GBP | Depends on GBP proximity |
| buy foodstuff in Akure | Transactional | `?cat=foodstuffs` | Secondary |
| groceries in Akure | Transactional | `?cat=snacks` | Secondary |
| frozen chicken in Akure | Transactional | `?cat=poultry` | Primary target |
| frozen fish in Akure | Transactional | `?cat=frozen` | Primary target |
| frozen turkey in Akure | Transactional | `product.html?id=fturkey` | Secondary |
| affordable foodstuff in Akure | Comparison | `index.html` | Do not claim "cheapest" |
| grocery shopping in Akure | Broad | `index.html` | Secondary |
| foodstuff supplier in Akure | B2B | `wholesale.html` | Primary B2B target |
| wholesale food in Akure | B2B | `wholesale.html` | Primary B2B target |
| foodstuff shop Akure contact | Navigational | `contact.html` | New page |

**Not targeted:** national terms like "buy food online Nigeria", and any
delivery claim outside Akure, because the business does not serve them.

---

## E. Google Maps baseline

**No measurements were taken, and none are reported here.**

I do not have a local rank-grid tool, and a single manual search from one
location does not produce a valid baseline. Inventing numbers here would be
worse than useless.

### How to get a real baseline yourself

1. Open Google Maps and **incognito** (so you are not seeing personalised results).
2. Search each term, in this order:
   - `foodstuff store in Akure`
   - `frozen foods in Akure`
   - `grocery store in Akure`
   - `foodstuff shop near me`
   - `frozen food shop near me`
3. Record for each: date, time, the location you searched from, and whether
   Ayoola Enterprise **appears at all**.
4. If it does not appear, record **"not found in the measured results"** — do
   not record a position of zero.
5. Repeat from at least three different Akure neighbourhoods (for example
   Alagbaka, Ibara, Oke-Ako). Local results vary by searcher position.

For a proper grid, a service such as Grid Recomposition or Local Falcon gives
rank-vs-location across Akure. Both are paid.

### On the pages.dev subdomain

You are on `ayoola-enterprise.pages.dev`, a Cloudflare Pages subdomain. It is
HTTPS, fast, and indexable, and there is **no penalty** for using it. The real
drawbacks:

- Your brand name is not in the URL, which weakens relevance signals
- It looks less established to customers than a `.com` or `.com.ng`
- You cannot transfer established authority to a new domain easily

**Recommendation:** get a domain such as `ayoolaenterprise.com.ng` when you can,
then keep this site running until the new domain is indexed before switching.
I have not changed any DNS or account setting.

---

## F. Google Business Profile checklist

I could not identify with confidence whether a profile exists, and I have no
access to Google. Please do these steps yourself.

### 1. Find or create the listing

- Search Google Maps for "Ayoola Enterprise" in Akure first — there may
  already be a listing, or a similar name in another town
- **Never create a second profile for the same business**
- If an old profile has the wrong name, follow Google's renaming process
  instead of creating a new one

### 2. Name — exact real-world name only

`Ayoola Enterprise`

Do **not** add keywords like "Best Foodstuff Store Akure". That breaks the
naming policy and risks suspension.

### 3. Categories

- **Primary:** Grocery store
- **Secondary:** Frozen food store, Food supplier, Supermarket (only if true)

### 4. Details

| Field | Value |
|---|---|
| Address | **You must supply this** |
| Service area | Akure, Ondo State (only if you have no walk-in address) |
| Phone | 08060157605 |
| Website | https://ayoola-enterprise.pages.dev/ (or your custom domain) |
| Hours | **Confirm**: Mon–Sat 8am–7pm |

### 5. Description (750 characters max)

```
Ayoola Enterprise is a foodstuff store and frozen food supplier in Akure,
Ondo State. We sell everyday foodstuffs such as parboiled rice, beans, semo,
yam, garri, egusi and spices, plus frozen fish (tilapia, mackerel, croaker,
prawns), frozen chicken, turkey, gizzard and breast, and a full range of
drinks, oils and seasoning. Retail and wholesale prices, with delivery across
Akure. Call or WhatsApp 08060157605 to order or ask for a bulk price.
```

### 6. Products

Add the products Google lets you list: rice, beans, semo, frozen fish, frozen
chicken, drinks, palm oil. This feeds Shopping results.

### 7. Photos — this matters more than the description

Upload **your own** photographs: shopfront, shelves, frozen goods, your delivery
rider, packed orders. Current website photos are stock images and a customer
who spots the difference will distrust the profile.

### 8. Reviews

- Ask every satisfied customer, in person and on WhatsApp
- Never buy reviews, never write reviews yourself, never create a fake profile
- Reply to every review, especially the negative ones

### 9. Ongoing

- Post weekly updates (new stock, offers, delivery news)
- Post photos regularly; dormant profiles lose Maps ranking
- Keep hours and phone accurate, especially around public holidays

---

## G. Measurement plan

### Organic clicks and impressions

1. Go to **search.google.com/search-console**, add the property
   `https://ayoola-enterprise.pages.dev/`
2. **Settings › Sitemaps** → submit `sitemap.xml`
3. **Performance › Search results** gives clicks, impressions, CTR, average
   position

Note: Search Console's *average position* is **not** a Maps ranking. It mixes
many queries and locations.

### Indexed pages

**Inspection › URL Inspection** — paste a URL to confirm it is indexed.
Check weekly for the first month:

- `/`
- `/category.html?cat=frozen`
- `/category.html?cat=foodstuffs`
- `/contact.html`
- `/wholesale.html`

Also watch **Pages › Indexed vs not indexed** to catch exclusions early.

### Keyword performance

In Search Console, filter Performance by the queries in section D. The ones
that matter first: `foodstuff store in Akure`, `frozen foods in Akure`,
`grocery store in Akure`.

### Maps visibility

Re-run the five manual searches in section E monthly, from the same three
Akure starting points. Record only what you actually see.

### Calls and enquiries

- **Google Business Profile** reports calls, messages and direction requests
- On the website, `tel:` and WhatsApp links are already live; add a click
  counter to see volume
- The WhatsApp links point at 08060157605, so message volume is countable there

### Orders that become customers

Use a distinct promo code per channel (for example `FB-MAPS`) so you can
attribute. Track: orders per week, average order value, most-ordered items,
and how many customers in Akure reorder.

---

## H. First 30 days

### Week 1 — the blockers

1. **Supply the street address** so it can be added to the site and GBP
2. **Confirm opening hours** and correct them everywhere if wrong
3. **Create the Google Business Profile** (section F)
4. **Replace the placeholder prices** and set `showPriceNotice: false`
5. **Replace the 45 stock photos** with photographs of your actual stock

### Week 2 — proof and measurement

6. Submit the sitemap in Search Console
7. Add 10–20 real photographs to Google Business Profile
8. Ask your first 10 customers for reviews
9. Print the address, phone and hours on packaging and handouts
10. Confirm the new pages are indexed

### Week 3 — local relevance

11. List the business on Nigerian directories and local food platforms
12. Post real delivery photos on WhatsApp Business and Facebook, 2× per week
13. Fix any Search Console indexing errors it reports

### Week 4 — review and adjust

14. Re-run the five Maps searches from section E and record positions
15. Review Search Console: which queries are getting impressions
16. Adjust titles and descriptions only where there is no impression at all —
    do not churn pages that are already indexed
17. Plan the custom domain if the numbers justify it

---

## I. Final status

| Item | Status |
|---|---|
| `robots.txt` valid, absolute sitemap | **Completed and tested** |
| Colour contrast to WCAG AA | **Completed and tested** (0 elements below 4.5:1) |
| Touch targets | **Completed and tested** |
| Accessible names | **Completed and tested** (92 → 96) |
| Absolute canonicals, OG, geo, ICBM | **Completed and tested** |
| Unique category titles/descriptions/H1s | **Completed and tested** |
| `BreadcrumbList` on inner pages | **Completed and tested** |
| `Product` schema (no fabricated prices/ratings) | **Completed and tested** |
| `ContactPage` schema | **Completed and tested** |
| Contact/location page | **Completed and tested** |
| Sitemap (22 absolute URLs) | **Completed and tested** |
| Skip link and landmarks | **Completed and tested** |
| Font preloading | **Completed and tested** |
| Empty-cart crash | **Completed and tested** |
| Malformed meta tags | **Completed and tested** |
| Lighthouse SEO score | **Completed and tested**: 83 → **100** |
| Lighthouse Best Practices | **Completed and tested**: 100 |
| Lighthouse Accessibility | **Implemented, awaiting external verification**: 96 (remaining 4% is `list`, a manual-review item) |
| Core Web Vitals (field data) | **Awaiting external verification** — needs Search Console or real-user data |
| Google Business Profile | **Blocked by permissions** — no Google account access |
| Google Search Console setup | **Blocked by permissions** — no Google account access |
| Google Maps baseline | **Blocked by permissions** — no rank-grid tool; manual procedure in section E |
| Street address | **Awaiting owner information** |
| Opening hours confirmation | **Awaiting owner information** |
| Real prices and product photos | **Awaiting owner information** |
| Custom domain | **Recommended for later** — needs DNS access |
| Real reviews / `aggregateRating` schema | **Recommended for later** — must be legitimate |

### What was deliberately not done

- No fabricated rankings, traffic figures, reviews or Search Console data
- No doorway or thin pages created for keyword variations
- No keyword stuffing — each category page reads as normal English
- No fake location pages for towns outside Akure
- No DNS, hosting or Google account changes
- No claims about ranking outcomes

### Honest expectation

The technical work is in good shape and everything verifiable has been
verified. But for **"foodstuff store in Akure"** and similar local terms,
**Google Maps ranking is driven mainly by your Google Business Profile,
review count and proximity to the searcher** — not by website code. The
biggest remaining lever is a complete, review-rich Business Profile with real
photographs, which needs your Google account and cannot be done from here.
