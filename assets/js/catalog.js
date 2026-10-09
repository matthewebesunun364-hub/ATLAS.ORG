/* ===========================================================
   AYOOLA ENTERPRISES - product catalogue + shop settings
   ------------------------------------------------------------
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE STOCK.

   Prices, pack sizes and stock below are PLACEHOLDERS.
   Replace every price with your real one before going live.

   PHOTOS
     Real product photos live in assets/img/products/<id>.jpg
     and are picked up automatically. If a photo is missing the
     shop falls back to the dark placeholder card drawn by art().

   FIELD GUIDE
     id    : unique code used by the cart (must match the file name)
     cat   : must match a category id below
     name  : product title
     unit  : short "per ..." description shown under the price
     brand : manufacturer / supplier
     sizes : [{ label, price, was }]  -> "was" = old price for a
             strikethrough + discount tag
     blurb : one line used on the product page and for SEO
   =========================================================== */

window.AYOOLA = (function () {
  'use strict';

  /* ---------------- SETTINGS ---------------- */
  const CONFIG = {
    company: 'Ayoola Enterprises',
    tagline: 'Foodstuffs • Frozen • Drinks',

    /* ---------- CONTACT ---------- */
    phone: '08060157605',
    whatsapp: '2348060157605',            // digits only, no +
    email: 'olufunmilayobolanle@gmail.com',

    /* ---------- DELIVERY (Akure only) ---------- */
    city: 'Akure',
    state: 'Ondo',
    areas: [
      'Akure township', 'Alagbaka', 'Ibara', 'Oke-Ako', 'Ilesha',
      'Ile Alafia', 'Oba Palace area', 'Ado Ekiti road', 'Federal Palace way',
    ],
    deliveryFee: 2500,
    freeDeliveryOver: 30000,               // free inside Akure above this
    sameDayCutoff: '2pm',

    /* ---------- MAKE AUTOMATION ----------
       The site POSTs every order here. Your Make scenario then:
         1. verifies the payment on Paystack with your SECRET key
            (that is why the secret key never sits in this website)
         2. returns {"paid": true|false, ...} as the webhook response
         3. emails the receipt to the buyer AND to you
       The site waits a few seconds for that reply and only stamps
       "payment verified" when Make says the money actually arrived.

       Leave blank and orders still work; you just get them by
       WhatsApp and email instead of the automation.                 */
    makeWebhook: 'https://hook.eu1.make.com/oq0359xmobvigrqa1nsr6dr76eczrllq',
    makeTimeout: 20000,             // ms to wait for Make to verify

    /* Where the receipt copy goes. Both addresses are used by Make. */
    sellerEmail: 'olufunmilayobolanle@gmail.com',
    sellerName: 'Ayoola Enterprises',

    /* ---------- PAYMENT (Paystack) ----------
       Card payments run through Paystack. The popup opens with the
       PUBLIC key below; the payment is then verified by the Make
       automation, which is the only place the secret key lives.

         paystackPublicKey  pk_...   SAFE to keep in this file. It
                             only opens the payment popup and cannot
                             move money.
         paystackEndpoint   Optional backup. URL of the Cloudflare
                             Worker in paystack-worker.js, used only
                             if the Make automation is ever paused.

       !! The SECRET key (sk_...) must NOT appear anywhere in this
          folder. Everything here is readable by every visitor.
          Going live: swap pk_test_... for pk_live_... and update
          the secret key inside Make.                            */
    paystackPublicKey: 'pk_test_ce6f0a13daed65eaf34d39fdd3a2ba9e53db8e3d',
    paystackEndpoint: '',         // optional, only used if Make is down
    currency: 'NGN',

    bank: {
      bank: 'Bank Name',                    // TODO
      accountName: 'Ayoola Enterprises',
      accountNumber: '0000000000',          // TODO
    },

    /* Optional URL that receives each order as a JSON POST. */
    orderEndpoint: '',

    // End of the flash sale (ISO string). Blank = a 24h cycle.
    flashSaleEnds: null,

    // "Sample catalogue" ribbon on the home page. false once prices are real.
    showPriceNotice: true,
  };

  /* ---------------- CATEGORIES ---------------- */
  const CATEGORIES = [
    { id: 'foodstuffs', name: 'Foodstuffs',        note: 'Rice, beans, yam, semo',  emoji: '\u{1F33E}', hue: 35  },
    { id: 'frozen',     name: 'Frozen Fish',      note: 'Tilapia, mackerel, shrimp', emoji: '\u{1F41F}', hue: 200 },
    { id: 'poultry',    name: 'Poultry',          note: 'Chicken, turkey, gizzard', emoji: '\u{1F414}', hue: 15  },
    { id: 'drinks',     name: 'Drinks',           note: 'Crate and bottle sizes', emoji: '\u{1F964}', hue: 350 },
    { id: 'oils',       name: 'Oils & Seasoning', note: 'Palm oil, paste, cubes', emoji: '\u{1FAD2}', hue: 45  },
    { id: 'noodles',    name: 'Noodles & Pasta',  note: 'Indomie, spaghetti',      emoji: '\u{1F35F}', hue: 5   },
    { id: 'snacks',     name: 'Snacks & Grocery', note: 'Biscuits, sugar, milk',   emoji: '\u{1F36A}', hue: 55  },
    { id: 'bundles',    name: 'Wholesale Bundles', note: 'Pre-packed for shops',   emoji: '\u{1F6D2}', hue: 150 },
  ];

  /* ---------------- PRODUCTS ---------------- */
  const PRODUCTS = [
    /* ---------- Foodstuffs ---------- */
    { id:'rice50', cat:'foodstuffs', name:'Long Grain Parboiled Rice', unit:'per bag', brand:'Olam', hue:38,
      blurb:'Fortified parboiled long grain rice. 50kg bags for shops, 25kg and 5kg for the house.',
      sizes:[{label:'5kg',price:9500},{label:'25kg',price:44000},{label:'50kg',price:85000,was:92000}] },
    { id:'rice10', cat:'foodstuffs', name:'Rice Small Bag', unit:'per bag', brand:'Olam', hue:40,
      blurb:'The same parboiled rice in a 10kg bag, for a family of four or five.',
      sizes:[{label:'10kg',price:18500}] },
    { id:'beans', cat:'foodstuffs', name:'Brown Beans (Ojojo)', unit:'per bowl', brand:'Premium', hue:20,
      blurb:'Cleaned and sorted brown beans, sold by the 5kg bowl or the 25kg bag.',
      sizes:[{label:'5kg',price:14500},{label:'25kg',price:68000,was:72000}] },
    { id:'semo', cat:'foodstuffs', name:'Semo (Soya Flour)', unit:'per pack', brand:'Swallow', hue:50,
      blurb:'Fortified soya flour for smooth swallow, served with eba or egusi soup.',
      sizes:[{label:'5kg',price:12500},{label:'25kg',price:58000}] },
    { id:'yam', cat:'foodstuffs', name:'Yam Tubers', unit:'per weight', brand:'Market', hue:30,
      blurb:'Fresh white yams, delivered whole. Pounded yam made on request.',
      sizes:[{label:'10kg',price:16000},{label:'30kg',price:44000}] },
    { id:'plantain', cat:'foodstuffs', name:'Ripe Plantain', unit:'per bunch', brand:'Market', hue:42,
      blurb:'Sweet ripe plantain, ready for dodo, boiled plantain or fried chips.',
      sizes:[{label:'1 bunch',price:7000},{label:'3 bunches',price:19500,was:21000}] },
    { id:'amala', cat:'foodstuffs', name:'Amala Flour (Ijiala)', unit:'per pack', brand:'Yemi', hue:48,
      blurb:'Ijiala yam flour for smooth amala. Cooks light and swallows smooth.',
      sizes:[{label:'2kg',price:9000}] },
    { id:'pupuru', cat:'foodstuffs', name:'Pupuru (Pounded Yam)', unit:'per pack', brand:'Local', hue:44,
      blurb:'Pre-pounded yam ready to cook with ogiri, egusi or banga soup.',
      sizes:[{label:'Small',price:4000},{label:'Large',price:7000}] },
    { id:'egusi', cat:'foodstuffs', name:'Shelled Egusi Seeds', unit:'per bag', brand:'Premium', hue:60,
      blurb:'Clean shelled egusi melon seeds for egusi soup, ground to order if you want.',
      sizes:[{label:'5kg',price:26000},{label:'10kg',price:49000}] },
    { id:'garri', cat:'foodstuffs', name:'Ijebu Garri', unit:'per bag', brand:'Ijebu', hue:46,
      blurb:'Ijebu-style garri for garri, eba or fried eba. Very smooth when blended.',
      sizes:[{label:'5kg',price:11000},{label:'25kg',price:52000}] },

    /* ---------- Frozen fish ---------- */
    { id:'ftilapia', cat:'frozen', name:'Frozen Whole Tilapia', unit:'per carton', brand:'Graciu', hue:195,
      blurb:'Whole tilapia frozen at the point of landing. Supplied cleaned or uncleaned.',
      sizes:[{label:'10kg carton',price:31000},{label:'25kg carton',price:74000,was:80000}] },
    { id:'fmackerel', cat:'frozen', name:'Frozen Mackerel (Tin Foil)', unit:'per carton', brand:'Okoko', hue:205,
      blurb:'Tin foil wrapped mackerel portions. Smoked, fried or grilled.',
      sizes:[{label:'10kg carton',price:46000}] },
    { id:'fcroaker', cat:'frozen', name:'Frozen Croaker Fish', unit:'per carton', brand:'Atlantic', hue:190,
      blurb:'Whole croaker in cartons, ideal for pepper soup and stews.',
      sizes:[{label:'10kg carton',price:38000},{label:'20kg carton',price:72000}] },
    { id:'fshrimp', cat:'frozen', name:'Frozen Shrimp Prawns', unit:'per kg', brand:'Atlantic', hue:350,
      blurb:'Headless shell-on prawns, quick frozen. Big sizes for suya and jollof rice.',
      sizes:[{label:'1kg',price:12000},{label:'5kg',price:57500,was:60000}] },
    { id:'fshark', cat:'frozen', name:'Frozen Shark (Wata)', unit:'per carton', brand:'Coastal', hue:215,
      blurb:'Shark cuts in cartons, the wata people buy for soup and pounded yam.',
      sizes:[{label:'10kg carton',price:42000}] },
    { id:'fcuttle', cat:'frozen', name:'Frozen Cuttle Fish', unit:'per kg', brand:'Atlantic', hue:185,
      blurb:'Frozen cuttle fish, cleaned. Good for stews and dry fried.',
      sizes:[{label:'1kg',price:10500}] },

    /* ---------- Poultry ---------- */
    { id:'fchicken', cat:'poultry', name:'Frozen Whole Chicken', unit:'per carton', brand:'Topp', hue:18,
      blurb:'Whole frozen chicken, giblets included. 10kg and 20kg cartons.',
      sizes:[{label:'10kg carton',price:34000},{label:'20kg carton',price:66000,was:71000}] },
    { id:'fturkey', cat:'poultry', name:'Frozen Turkey', unit:'per kg', brand:'Z turkey', hue:12,
      blurb:'Whole frozen turkey for Christmas and festive tables.',
      sizes:[{label:'1 whole',price:25000}] },
    { id:'fgizzard', cat:'poultry', name:'Chicken Gizzard', unit:'per kg', brand:'Topp', hue:22,
      blurb:'Cleaned chicken gizzard for pepper stew and gizzard sauce.',
      sizes:[{label:'5kg',price:16500}] },
    { id:'fbreast', cat:'poultry', name:'Chicken Breast (Boneless)', unit:'per kg', brand:'Topp', hue:26,
      blurb:'Boneless skinless chicken breast, cut into fillets for kebabs and grills.',
      sizes:[{label:'5kg',price:29000}] },

    /* ---------- Drinks ---------- */
    { id:'coke2l', cat:'drinks', name:'Coca-Cola Family Size', unit:'per bottle', brand:'Coca-Cola', hue:355,
      blurb:'2L family bottles, sold singly, by the six or by the twelve.',
      sizes:[{label:'1 x 2L',price:1200},{label:'6 x 2L',price:6900,was:7200},{label:'12 x 2L',price:13200}] },
    { id:'malt', cat:'drinks', name:'Malt Drinks', unit:'33cl', brand:'Nigerian Malt', hue:25,
      blurb:'33cl malt bottles in sixes, twelves and full crates.',
      sizes:[{label:'6 bottles',price:3900},{label:'12 bottles',price:7500},{label:'24 bottles',price:14200,was:15000}] },
    { id:'water', cat:'drinks', name:'Table Water', unit:'75cl', brand:'Pure', hue:200,
      blurb:'Clean table water in 75cl bottles, by the twelve or the twenty-four.',
      sizes:[{label:'12 x 75cl',price:2400},{label:'24 x 75cl',price:4600}] },
    { id:'juice', cat:'drinks', name:'Fruit Juice', unit:'1L carton', brand:'Rubicon', hue:20,
      blurb:'1L fruit juice cartons, pineapple, orange, apple and mixed.',
      sizes:[{label:'6 x 1L',price:9800},{label:'12 x 1L',price:18500}] },
    { id:'fanta', cat:'drinks', name:'Fanta Orange', unit:'2L bottle', brand:'Fanta', hue:28,
      blurb:'2L orange soda. Also available in pineapple and grape flavours.',
      sizes:[{label:'1 x 2L',price:1150},{label:'12 x 2L',price:12900}] },
    { id:'energy', cat:'drinks', name:'Energy Drink', unit:'per can', brand:'Lucozade', hue:45,
      blurb:'330ml energy drink cans in sixes and full 24-can crates.',
      sizes:[{label:'6 cans',price:4200},{label:'24 cans',price:15800,was:16800}] },
    { id:'wine', cat:'drinks', name:'Grape Wine', unit:'75cl', brand:'Frascati', hue:300,
      blurb:'75cl bottle of grape wine for gifts, events and home.',
      sizes:[{label:'1 bottle',price:7500},{label:'6 bottles',price:42000,was:45000}] },

    /* ---------- Oils & seasoning ---------- */
    { id:'palm', cat:'oils', name:'Palm Oil', unit:'per keg', brand:'Olam', hue:40,
      blurb:'Pure palm oil for banga soup, stews and frying. 5L or a 25L keg.',
      sizes:[{label:'5L',price:9500},{label:'25L keg',price:42000,was:45000}] },
    { id:'tomato', cat:'oils', name:'Tomato Paste', unit:'per carton', brand:'Dano', hue:8,
      blurb:'Tin tomato paste in cartons of six or twelve. No added starch.',
      sizes:[{label:'6 tins',price:11200},{label:'12 tins',price:21500}] },
    { id:'cubes', cat:'oils', name:'Seasoning Cubes', unit:'per pack', brand:'Maggi', hue:45,
      blurb:'Bouillon cubes for stews, soups and fried rice. Small and large packs.',
      sizes:[{label:'Small',price:2200},{label:'Large',price:4200}] },
    { id:'thyme', cat:'oils', name:'Mixed Herbs & Spices', unit:'per pack', brand:'Local', hue:52,
      blurb:'Blended onions, pepper and aromatic spices for fried rice and stews.',
      sizes:[{label:'Small',price:2500},{label:'Large',price:4500}] },
    { id:'soyaoil', cat:'oils', name:'Soya Oil', unit:'per container', brand:'Dangote', hue:47,
      blurb:'25L soya oil container for frying, cooking and food businesses.',
      sizes:[{label:'25L',price:31000}] },

    /* ---------- Noodles & pasta ---------- */
    { id:'indomie', cat:'noodles', name:'Indomie Noodles', unit:'per carton', brand:'Indomie', hue:0,
      blurb:'Indomie in all flavours, one carton or four cartons.',
      sizes:[{label:'1 carton',price:5200},{label:'4 cartons',price:19800,was:20800}] },
    { id:'spaghetti', cat:'noodles', name:'Spaghetti Pasta', unit:'per pack', brand:'Dangote', hue:35,
      blurb:'Durum wheat spaghetti for noodles, jollof and salads.',
      sizes:[{label:'400g',price:1500},{label:'1.5kg',price:4800}] },
    { id:'noodle5', cat:'noodles', name:'Noodles Carton', unit:'per carton', brand:'Chikki', hue:15,
      blurb:'Twelve 92g packets per carton. Also rice and pasta variants.',
      sizes:[{label:'1 carton',price:7600,was:8000}] },

    /* ---------- Snacks & grocery ---------- */
    { id:'sugar', cat:'snacks', name:'Granulated Sugar', unit:'5kg', brand:'Dangote', hue:55,
      blurb:'Granulated white sugar in 5kg bags, for tea, baking and drinks.',
      sizes:[{label:'5kg',price:10500},{label:'15kg',price:29000,was:31500}] },
    { id:'biscuit', cat:'snacks', name:'Biscuits Assorted', unit:'per carton', brand:'Tropical', hue:38,
      blurb:'Assorted biscuit carton for events, offices and home.',
      sizes:[{label:'1 carton',price:8600}] },
    { id:'milk', cat:'snacks', name:'Evaporated Milk', unit:'per carton', brand:'Peak', hue:45,
      blurb:'Evaporated milk tins, 12 or 24 to a carton. For tea and pap.',
      sizes:[{label:'12 tins',price:14500},{label:'24 tins',price:27500,was:29000}] },
    { id:'milkpow', cat:'snacks', name:'Powdered Milk', unit:'per tin', brand:'Cowbell', hue:42,
      blurb:'900g powdered milk tin. Good value for pap and baby food.',
      sizes:[{label:'900g',price:7800}] },
    { id:'salt', cat:'snacks', name:'Table Salt', unit:'per bag', brand:'Onbu', hue:195,
      blurb:'25kg bag of iodised table salt for cooking and food businesses.',
      sizes:[{label:'25kg',price:12000}] },
    { id:'tin', cat:'snacks', name:'Tomato Tin (Stewed)', unit:'per carton', brand:'Dano', hue:10,
      blurb:'Stewed tomato tins in cartons of six. Ready for rice and stews.',
      sizes:[{label:'6 tins',price:9800}] },

    /* ---------- Wholesale bundles ---------- */
    { id:'bundle-shop', cat:'bundles', name:'Shop Starter Bundle', unit:'per pack', brand:'Ayoola', hue:145,
      blurb:'Pre-packed basket for a retail shop: staples, drinks, seasoning and a few provisions.',
      sizes:[{label:'20 items',price:85000},{label:'50 items',price:198000,was:215000}] },
    { id:'bundle-family', cat:'bundles', name:'Family Food Bundle', unit:'per pack', brand:'Ayoola', hue:155,
      blurb:'A month of food for a family: staples, soup items, protein and drinks.',
      sizes:[{label:'Mixed basket',price:52000},{label:'Double basket',price:99000}] },
    { id:'bundle-drinks', cat:'bundles', name:'Drinks Wholesale Crate Pack', unit:'per pack', brand:'Ayoola', hue:340,
      blurb:'Mixed crates of soft drinks, malt, juice and table water for events or resale.',
      sizes:[{label:'Mixed crates',price:78000}] },
    { id:'bundle-frozen', cat:'bundles', name:'Frozen Fish Bundle', unit:'per pack', brand:'Ayoola', hue:198,
      blurb:'Mixed frozen fish carton pack, insulated and ready for your cold store.',
      sizes:[{label:'25kg mixed',price:92000,was:99000}] },
  ];

  /* ---------------- HELPERS ---------------- */
  const Naira = '\u20A6';
  const money = (n) => Naira + Number(n || 0).toLocaleString('en-NG');

  const from = (p) => Math.min.apply(null, (p.sizes || []).map((s) => s.price));
  const was  = (p) => Math.min.apply(null, (p.sizes || []).filter((s) => s.was).map((s) => s.was));

  function discount(p) {
    const w = was(p);
    if (!isFinite(w)) return 0;
    return Math.round((1 - from(p) / w) * 100);
  }

  const cat = (id) => CATEGORIES.find((c) => c.id === id);
  const product = (id) => PRODUCTS.find((p) => p.id === id);

  /* Deterministic "sold" / rating numbers so the UI stays stable
     between page loads without a database. */
  const hash = (s) => String(s).split('').reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 997, 7);
  const sold = (p) => 20 + (hash(p.id) % 480);
  const rating = (p) => (3.6 + (hash(p.id + 'r') % 14) / 10).toFixed(1);

  /* Real photo: assets/img/products/<id>.jpg
     If the file is missing the browser fires an error event, and
     photoError() in store.js swaps in the placeholder drawn here. */
  const photo = (p) => 'assets/img/products/' + p.id + '.jpg';

  function placeholder(p) {
    const hue = p.hue == null ? 30 : p.hue;
    const label = (p.brand || '').toUpperCase().slice(0, 16);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ',16%,11%)"/>' +
      '<stop offset="1" stop-color="hsl(' + hue + ',22%,16%)"/>' +
      '</linearGradient></defs>' +
      '<rect width="400" height="400" fill="url(#g)"/>' +
      '<circle cx="200" cy="184" r="118" fill="hsl(' + hue + ',26%,10%)" opacity=".85"/>' +
      '<circle cx="200" cy="184" r="118" fill="none" stroke="hsl(' + hue + ',40%,30%)" stroke-opacity=".55"/>' +
      '<text x="200" y="228" font-size="126" text-anchor="middle">' + (p.emoji || '\u{1F6D2}') + '</text>' +
      '<text x="200" y="352" font-size="24" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" ' +
      'font-weight="600" letter-spacing="3" fill="hsl(' + hue + ',55%,62%)">' + label + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  return {
    CONFIG, CATEGORIES, PRODUCTS, Naira, money, from, was, discount,
    cat, product, sold, rating, photo, placeholder,
  };
})();
