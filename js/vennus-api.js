/* =================================================================
   VENNUS — Storefront connector
   -----------------------------------------------------------------
   Drop this file into your storefront's js/ folder and load it
   BEFORE js/render.js. It does three things:

     1. Pulls your live catalogue from the admin backend, so adding
        a product in the admin makes it appear on the site.
     2. Applies your store name, announcement bar and theme colours
        from the admin Settings screen.
     3. Sends anonymous traffic data to your Analytics screen.

   If the backend is unreachable, the site quietly falls back to the
   product list already in js/products.js, so your shop never shows
   a blank page because a server hiccuped.
   ================================================================= */

/* ── SET THIS to your deployed admin URL ──────────────────────────
   Local testing:  http://localhost:4000
   Once deployed:  https://your-app.onrender.com                  */
const VENNUS_API = "https://vennus-admin-v2.onrender.com";

/* ---------- Anonymous session id (no personal data) ---------- */
function vennusSession() {
  try {
    let s = sessionStorage.getItem("vennus_sid");
    if (!s) {
      s = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("vennus_sid", s);
    }
    return s;
  } catch { return "nosession"; }
}

/* ---------- Analytics ----------
   Only fires if the visitor accepted analytics cookies. */
function vennusConsentsToAnalytics() {
  try {
    const c = JSON.parse(localStorage.getItem("vennus_cookie_consent") || "null");
    return !!(c && c.analytics);
  } catch { return false; }
}

async function vennusTrack(type, meta) {
  if (!vennusConsentsToAnalytics()) return;
  try {
    await fetch(VENNUS_API + "/api/public/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        path: location.pathname + location.search,
        referrer: document.referrer || "",
        session_id: vennusSession(),
        meta: meta || null
      })
    });
  } catch { /* analytics must never break the shop */ }
}
window.vennusTrack = vennusTrack;

/* ---------- Load catalogue + settings before the page renders ---------- */
async function vennusLoadCatalogue() {
  try {
    const res = await fetch(VENNUS_API + "/api/public/products");
    if (!res.ok) throw new Error("bad response");
    const products = await res.json();
    if (Array.isArray(products) && products.length) {
      // render.js reads this global — replacing it swaps the whole catalogue
      window.VENNUS_PRODUCTS = products;
    }
  } catch {
    console.info("Vennus: using the built-in catalogue (admin backend not reachable).");
  }

  try {
    const s = await (await fetch(VENNUS_API + "/api/public/settings")).json();

    // Announcement bar
    const bar = document.querySelector(".topbar");
    if (bar && s.announcement) {
      const link = bar.querySelector("a");
      bar.childNodes[0].nodeValue = " " + s.announcement + " · ";
      if (link) bar.appendChild(link);
    }

    // Every image/video slot the admin can edit directly on the site —
    // hero banners, editorial photos, mega-menu features, etc. Each one
    // is tagged in the HTML with data-editable-image="some_key". This
    // fills in whichever keys have something saved; untagged elements,
    // or keys nothing's been set for yet, keep their placeholder box.
    // Exposed on window so vennus-admin-bar.js can reuse the exact same
    // rendering after a save, instead of a second, possibly-diverging copy.
    //
    // Hero and category tiles are locked to a fixed shape (21:9 cinematic
    // for the hero, square for category tiles — see LOCKED_ASPECT in the
    // admin bar's crop tool), so their container keeps a real CSS
    // aspect-ratio and the image covers it — matching what a locked crop
    // already produces, and safely reserving the right amount of space
    // even before the image has actually loaded. Editorial photos and
    // menu features are free-shaped, so they display at their own
    // natural size instead of being cover-clipped into a guessed box.
    const NATURAL_SIZE_KEYS = new Set([
      "home_editorial_1", "home_editorial_2", "maison_editorial_1", "maison_editorial_2",
      "mega_feature_jewelry", "mega_feature_maison"
    ]);

    window.vennusApplyEditableImage = function (el, media) {
      if (!el || !media || !media.url) return;
      const key = el.dataset.editableImage;
      const natural = NATURAL_SIZE_KEYS.has(key);
      // position/zoom are only meaningful for the old CSS-crop
      // mechanism (still used for video, and for anything saved
      // before the real-crop tool existed) — a freshly, genuinely
      // cropped image simply has neither.
      const position = media.position || "center center";
      const zoom = media.zoom && media.zoom !== 1 ? media.zoom : null;
      const extra = zoom ? ` transform: scale(${zoom}); transform-origin: ${position};` : "";
      const sizing = natural
        ? `width:100%; height:auto;`
        : `width:100%; height:100%; object-fit:cover; object-position:${position};`;

      function reallyApply() {
        // The admin bar may have already attached its edit button to
        // this element before this runs (or vice versa) — timing
        // between two independent scripts isn't guaranteed. Preserve
        // the button across the innerHTML replacement rather than
        // letting whichever runs second silently erase the other's work.
        const pencil = el.querySelector(":scope > .vn-edit-btn");
        el.innerHTML = media.type === "video"
          ? `<video autoplay muted loop playsinline style="${sizing} display:block;${extra}"><source src="${media.url}"></video>`
          : `<img src="${media.url}" alt="" style="${sizing} display:block;${extra}">`;
        if (pencil) el.appendChild(pencil);
        return el.querySelector("img, video");
      }

      if (media.type === "video") { reallyApply(); return; }

      // Apply straight away — this is the fast path, and it's the one
      // that runs almost every time (the image has been live for a
      // while and loads normally, same as any other <img> on the
      // page; there's no reason to make every single page load wait
      // on a JS-driven preload first just to guard against a rare
      // case). Only if THIS actual element fails to load — which
      // really only happens in the few moments right after a fresh
      // save, while GitHub Pages is still catching up — does a retry
      // loop kick in, swapping in a fresh attempt each time.
      const rendered = reallyApply();
      if (!rendered) return;
      let attempt = 0;
      rendered.addEventListener("error", function onError() {
        attempt++;
        if (attempt >= 14) { rendered.removeEventListener("error", onError); return; }
        setTimeout(() => {
          rendered.src = media.url + (media.url.includes("?") ? "&" : "?") + "retry=" + attempt;
        }, Math.min(5000, attempt * 800));
      });
    };
    document.querySelectorAll("[data-editable-image]").forEach(el => {
      window.vennusApplyEditableImage(el, s[el.dataset.editableImage]);
    });

    // Theme colours
    if (s.theme) {
      const map = { blanc:"--blanc", craie:"--craie", sand:"--sand", chai:"--chai",
                    beton:"--beton", umber:"--umber", blush:"--blush", champagne:"--champagne" };
      for (const [k, cssVar] of Object.entries(map)) {
        if (s.theme[k]) document.documentElement.style.setProperty(cssVar, s.theme[k]);
      }
    }

    // SEO description
    if (s.seo_description) {
      let m = document.querySelector('meta[name="description"]');
      if (!m) { m = document.createElement("meta"); m.name = "description"; document.head.appendChild(m); }
      m.content = s.seo_description;
    }
  } catch { /* settings are optional */ }
}

/* ---------- Newsletter signups go straight into Customers ---------- */
async function vennusSubscribe(email) {
  const res = await fetch(VENNUS_API + "/api/public/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });
  return res.json();
}
window.vennusSubscribe = vennusSubscribe;

/* ---------- Send an order to the backend ----------
   Call this from your checkout once payment has succeeded. It
   records the order, creates the customer, and decrements stock. */
async function vennusPlaceOrder(payload) {
  const res = await fetch(VENNUS_API + "/api/public/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Order could not be placed.");
  return data;
}
window.vennusPlaceOrder = vennusPlaceOrder;

/* ---------- Boot ---------- */
window.vennusReady = vennusLoadCatalogue();

document.addEventListener("DOMContentLoaded", () => {
  vennusTrack("pageview");

  // Product page views
  const id = new URLSearchParams(location.search).get("id");
  if (location.pathname.includes("product.html") && id) vennusTrack("product_view", "product:" + id);

  // Searches
  const q = new URLSearchParams(location.search).get("q");
  if (q) vennusTrack("search", q);

  // Newsletter — route it through the backend instead of the demo handler
  const nf = document.getElementById("newsletterForm");
  if (nf) {
    nf.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("newsletterEmail")?.value;
      if (!email) return;
      try {
        await vennusSubscribe(email);
        vennusTrack("newsletter_signup");
        nf.style.display = "none";
        const ok = document.getElementById("newsletterSuccess");
        if (ok) ok.style.display = "block";
      } catch { /* fall back to the demo behaviour */ }
    }, true);
  }
});
