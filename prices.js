// Hämtar bränslepriser från Supabase och visar dem på hemsidan.
// Fungerar på både arabiska (/) och engelska (/en) sidan.
(function () {
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.indexOf("DITT-PROJEKT") !== -1) return; // inte konfigurerat än

  var lang = document.documentElement.lang === "ar" ? "ar" : "en";
  var numFmt = new Intl.NumberFormat(lang === "ar" ? "ar-IQ" : "en-US");
  var dateFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar-IQ" : "en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit"
  });

  var url = cfg.SUPABASE_URL.replace(/\/$/, "") +
    "/rest/v1/fuel_prices?select=slug,price_iqd,available,updated_at&order=sort";

  fetch(url, { headers: { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (rows) {
      var latest = null;
      rows.forEach(function (row) {
        var card = document.querySelector('.fuel[data-fuel="' + row.slug + '"]');
        if (!card) return;
        var box = card.querySelector(".fuel-price");
        var amount = box && box.querySelector("strong");
        if (!box || !amount) return;

        if (!row.available) {
          card.classList.add("is-unavailable");
          box.classList.add("is-off");
          amount.textContent = box.getAttribute("data-unavailable");
          box.hidden = false;
        } else if (row.price_iqd != null) {
          amount.textContent = numFmt.format(row.price_iqd);
          box.hidden = false;
        }
        var t = new Date(row.updated_at);
        if (!latest || t > latest) latest = t;
      });

      var upd = document.querySelector(".prices-updated");
      if (upd && latest) {
        var time = upd.querySelector("time");
        time.dateTime = latest.toISOString();
        time.textContent = dateFmt.format(latest);
        upd.hidden = false;
      }
    })
    .catch(function () { /* om något går fel visas sidan utan priser */ });
})();
