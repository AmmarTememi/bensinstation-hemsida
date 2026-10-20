// Hämtar texter, bilder och bildgalleri från adminpanelen (Supabase) och visar dem på hemsidan.
// Texten som står i HTML-filen används om något inte kan hämtas, så sidan fungerar alltid.
(function () {
  var cfg = window.SITE_CONFIG || {};
  if (!cfg.SUPABASE_URL || cfg.SUPABASE_URL.indexOf("DITT-PROJEKT") !== -1) return;

  var base = cfg.SUPABASE_URL.replace(/\/$/, "");
  var lang = document.documentElement.lang === "ar" ? "ar" : "en";
  var headers = { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY };
  var imgUrl = function (path) { return base + "/storage/v1/object/public/site-images/" + path.split("/").map(encodeURIComponent).join("/"); };
  var get = function (q) { return fetch(base + "/rest/v1/" + q, { headers: headers }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); };

  // ---- Texter och kontaktuppgifter ----
  get("site_content?select=key,lang,value&lang=in.(" + lang + ",all)").then(function (rows) {
    var text = {}, glob = {};
    rows.forEach(function (r) { (r.lang === "all" ? glob : text)[r.key] = r.value; });

    document.querySelectorAll("[data-content]").forEach(function (el) {
      var v = text[el.getAttribute("data-content")];
      if (v && v.trim()) el.textContent = v;
    });

    if (glob.phone && glob.phone.trim()) {
      var tel = "tel:" + glob.phone.replace(/[^\d+]/g, "");
      document.querySelectorAll('[data-global="phone"]').forEach(function (el) { el.textContent = glob.phone; });
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) { a.href = tel; });
    }
    if (glob.maps_url && /^https:\/\//.test(glob.maps_url)) {
      document.querySelectorAll('a[href^="https://www.google.com/maps"]').forEach(function (a) { a.href = glob.maps_url; });
    }
    var name = text.station_name || document.querySelector('[data-content="station_name"]').textContent;
    if (glob.hero_image) {
      var art = document.querySelector(".hero-art");
      if (art) {
        var img = new Image();
        img.alt = name; img.width = 1400; img.height = 1000; img.decoding = "async"; img.fetchPriority = "high";
        img.onload = function () { art.innerHTML = ""; art.appendChild(img); };
        img.src = imgUrl(glob.hero_image);
      }
    }
    if (glob.logo_image) {
      document.querySelectorAll(".brand-mark").forEach(function (mark) {
        var logo = new Image();
        logo.className = "brand-logo"; logo.alt = ""; logo.width = 38; logo.height = 38;
        logo.onload = function () { mark.replaceWith(logo); };
        logo.src = imgUrl(glob.logo_image);
      });
    }
  }).catch(function () {});

  // ---- Bildgalleri ----
  get("gallery_images?select=path,caption_ar,caption_en&order=sort.asc,created_at.asc").then(function (imgs) {
    if (!imgs.length) return;
    var grid = document.getElementById("galleryGrid");
    if (!grid) return;
    imgs.forEach(function (g) {
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = imgUrl(g.path); img.loading = "lazy"; img.decoding = "async";
      img.width = 800; img.height = 600;
      var cap = g["caption_" + lang] || "";
      img.alt = cap;
      var fc = document.createElement("figcaption"); fc.textContent = cap;
      fig.appendChild(img); fig.appendChild(fc); grid.appendChild(fig);
    });
    document.getElementById("gallery").hidden = false;
    document.querySelectorAll("[data-gallery-link]").forEach(function (a) { a.hidden = false; });
  }).catch(function () {});
})();
