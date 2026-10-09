/* ===========================================================
   AYOOLA ENTERPRISES - wholesale / help page
   =========================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const S = window.SHOP, A = S.A, C = S.C, $ = S.$, $$ = S.$$;

  $$('[data-bank]').forEach((el) => { el.textContent = C.bank.bank; });
  $$('[data-acctname]').forEach((el) => { el.textContent = C.bank.accountName; });
  $$('[data-acctno]').forEach((el) => { el.textContent = C.bank.accountNumber; });
  $$('[data-fee]').forEach((el) => { el.textContent = A.money(C.deliveryFee); });
  $$('[data-freeover]').forEach((el) => { el.textContent = A.money(C.freeDeliveryOver); });
  $$('[data-wa]').forEach((el) => { el.href = S.WA; el.target = '_blank'; el.rel = 'noopener'; });

  /* Akure areas: select on the quote form + inline list on the help card */
  const areaSel = document.querySelector('[data-areas]');
  if (areaSel && areaSel.tagName === 'SELECT') {
    areaSel.innerHTML = '<option value="">Select your area</option>' +
      (C.areas || []).map((a) => '<option>' + a + '</option>').join('');
  }
  $$('[data-areas-inline]').forEach((el) => {
    el.textContent = (C.areas || []).join(', ');
  });

  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t) setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  }

  /* ---------- quote form ---------- */
  const form = $('#quoteForm');
  const budget = $('#qb');

  budget.addEventListener('blur', function () {
    const v = Number(String(this.value).replace(/[^\d.]/g, '')) || 0;
    this.value = v ? v.toLocaleString('en-NG') : '';
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = $('#qn').value.trim();
    const phone = $('#qp').value.trim();
    const msg = $('#quoteMsg');

    if (!name || phone.replace(/\D/g, '').length < 10) {
      S.toast('Please add your name and a working phone number');
      (!name ? $('#qn') : $('#qp')).focus();
      return;
    }

    const d = function (id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };

    const body =
      'New quote request from ' + name + '\n' +
      'Phone: ' + phone + '\n' +
      (d('qe') ? 'Email: ' + d('qe') + '\n' : '') +
      (d('qb') ? 'Budget: ' + A.Naira + d('qb') + '\n' : '') +
      (d('qc') ? 'For: ' + d('qc') + '\n' : '') +
      (d('qs') ? 'People: ' + d('qs') + '\n' : '') +
      (d('qar') ? 'Area: ' + d('qar') + '\n' : '') +
      (d('qa') ? 'Deliver to: ' + d('qa') + ' (' + C.city + ')\n' : '') +
      (d('qr') ? 'Items:\n' + d('qr') + '\n' : '') +
      (d('qn2') ? 'Notes: ' + d('qn2') + '\n' : '');

    /* 1) keep it on this device so nothing is lost */
    try {
      const key = 'ayoola.quotes.v1';
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.unshift({ at: new Date().toISOString(), name: name, phone: phone, body: body });
      localStorage.setItem(key, JSON.stringify(list.slice(0, 20)));
    } catch (err) {}

    /* 2) open WhatsApp with everything pre-filled */
    window.open('https://wa.me/' + C.whatsapp + '?text=' + encodeURIComponent(body), '_blank');

    msg.style.display = 'block';
    msg.textContent = 'Opening WhatsApp now. If it did not open, call ' + C.phone +
      ' or email ' + C.email + '.';
    form.reset();
  });
});
