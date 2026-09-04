/* =================================================================
   VENNUS JEWELRY — Product Rendering
   -----------------------------------------------------------------
   Builds the shop grid, product detail page, and homepage featured
   strip directly from js/products.js. You should not need to edit
   this file — add products in products.js and they'll appear
   everywhere automatically.

   Runs immediately (not wrapped in DOMContentLoaded) because the
   <script> tags are placed at the bottom of the page, after the
   grid/detail containers already exist in the HTML.
   ================================================================= */

function tagLabel(tag) {
  return { "new": "New", "bestseller": "Bestseller", "sale": "Sale" }[tag] || "";
}

/* Product images can be a plain URL string (from before per-photo framing
   existed) or a full { url, type, position, zoom } object. This makes
   both work the same way everywhere they're rendered. */
function normalizeMedia(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return { url: entry, type: "image", position: "center center", zoom: 1 };
  return { type: "image", position: "center center", zoom: 1, ...entry };
}

function mediaTagHTML(entry, altText, extraStyle) {
  const m = normalizeMedia(entry);
  if (!m) return "";
  const zoomPart = m.zoom && m.zoom !== 1 ? ` transform:scale(${m.zoom}); transform-origin:${m.position};` : "";
  const style = `object-fit:cover; object-position:${m.position};${zoomPart}${extraStyle || ""}`;
  return m.type === "video"
    ? `<video autoplay muted loop playsinline style="${style}"><source src="${m.url}"></video>`
    : `<img src="${m.url}" alt="${altText || ""}" loading="lazy" style="${style}">`;
}

function productCardHTML(p) {
  const tag = !p.inStock
    ? `<span class="product-tag sold-out">Sold Out</span>`
    : (p.tag ? `<span class="product-tag">${tagLabel(p.tag)}</span>` : "");

  const priceHTML = p.compareAt
    ? `${vennusFormatPrice(p.price)} <span class="was">${vennusFormatPrice(p.compareAt)}</span>`
    : vennusFormatPrice(p.price);

  // Real photo/video if one's been uploaded in the admin; placeholder otherwise.
  const media = (p.images && p.images.length)
    ? mediaTagHTML(p.images[0], p.name, " position:absolute; inset:0; width:100%; height:100%;")
    : `<div class="placeholder-block" aria-hidden="true"><span class="placeholder-label">Photo — ${p.name}</span></div>`;

  return `
    <div class="product-card" data-category="${p.category}">
      <a href="product.html?id=${p.id}" class="card-link">
        <div class="product-media">
          ${tag}
          <button type="button" class="wishlist-btn" aria-label="Add ${p.name} to wishlist" data-wishlist>
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.5-8.8C.8 7.8 2.6 4.5 6 4c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.4.5 5.2 3.8 3.5 7.2C19 15.6 12 20 12 20z" fill="none"/></svg>
          </button>
          ${media}
        </div>
        <div class="product-info">
          <h3>${p.name}</h3>
          <div class="product-category">${p.category.charAt(0).toUpperCase() + p.category.slice(1)}</div>
          <div class="product-price">${priceHTML}</div>
        </div>
      </a>
    </div>
  `;
}

/* ---- Wishlist heart toggle (visual only, front-end demo) ---- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-wishlist]");
  if (!btn) return;
  e.preventDefault();
  btn.classList.toggle("active");
});

/* ---------------------------------------------------------------
   SHOP GRID (shop.html)
   --------------------------------------------------------------- */
function renderShopGrid() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const category = params.get("category");
  const searchTerm = (params.get("q") || "").toLowerCase().trim();

  let items = VENNUS_PRODUCTS.slice();
  if (searchTerm) {
    items = items.filter(p =>
      p.name.toLowerCase().includes(searchTerm) || p.category.includes(searchTerm)
    );
  }

  grid.innerHTML = items.length
    ? items.map(productCardHTML).join("")
    : `<p style="grid-column:1/-1; text-align:center; color:var(--beton); padding:40px 0;">No pieces matched your search. Try browsing a category instead.</p>`;

  const heading = document.getElementById("shopHeading");
  if (heading && searchTerm) heading.textContent = `Results for \u201C${params.get("q")}\u201D`;

  const activeFilter = category || "all";
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.classList.toggle("active", chip.dataset.filter === activeFilter);
  });
  if (category) {
    document.querySelectorAll(".product-card").forEach(card => {
      card.style.display = card.dataset.category === category ? "" : "none";
    });
  }
}

/* ---------------------------------------------------------------
   FEATURED PRODUCTS (index.html)
   --------------------------------------------------------------- */
function renderFeaturedProducts(containerId, filterFn, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = VENNUS_PRODUCTS.filter(filterFn).slice(0, limit || 4);
  container.innerHTML = items.map(productCardHTML).join("");
}

/* ---------------------------------------------------------------
   PRODUCT DETAIL PAGE (product.html)
   --------------------------------------------------------------- */
function renderProductDetail() {
  const root = document.getElementById("productDetailRoot");
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get("id"), 10);
  const product = VENNUS_PRODUCTS.find(p => p.id === id) || VENNUS_PRODUCTS[0];
  if (!product) return;

  document.title = product.name + " — VENNUS Jewelry";

  document.getElementById("pdpBreadcrumb").textContent =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);
  document.getElementById("pdpName").textContent = product.name;
  document.getElementById("pdpDesc").textContent = product.description;

  const priceEl = document.getElementById("pdpPrice");
  priceEl.innerHTML = product.compareAt
    ? `${vennusFormatPrice(product.price)} <span class="was">${vennusFormatPrice(product.compareAt)}</span>`
    : vennusFormatPrice(product.price);

  const detailsList = document.getElementById("pdpDetailsList");
  detailsList.innerHTML = product.details.map(d => `<li>${d}</li>`).join("");

  /* Gallery — real uploaded photos/videos if any exist, placeholders otherwise */
  const galleryMain = document.getElementById("pdpGalleryMain");
  const galleryThumbs = document.getElementById("pdpGalleryThumbs");
  const photos = product.images && product.images.length ? product.images.map(normalizeMedia) : null;

  function mainPhotoHTML(entry, label) {
    return entry
      ? mediaTagHTML(entry, product.name, " width:100%; height:100%;")
      : `<div class="placeholder-block" aria-hidden="true"><span class="placeholder-label">${label}</span></div>`;
  }

  galleryMain.innerHTML = mainPhotoHTML(photos ? photos[0] : null, `Main photo — ${product.name}`);

  if (photos) {
    galleryThumbs.innerHTML = photos.map((entry, i) =>
      `<div class="placeholder-block" data-thumb data-i="${i}" style="padding:0; overflow:hidden;">
        ${mediaTagHTML(entry, `View ${i + 1}`, " width:100%; height:100%;")}
      </div>`
    ).join("");
  } else {
    const thumbCount = Math.max(1, Math.min(product.images || 3, 4));
    galleryThumbs.innerHTML = Array.from({ length: thumbCount }).map((_, i) =>
      `<div class="placeholder-block" data-thumb aria-hidden="true"><span class="placeholder-label">${i + 1}</span></div>`
    ).join("");
  }

  galleryThumbs.querySelectorAll("[data-thumb]").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const entry = thumb.dataset.i !== undefined ? photos[+thumb.dataset.i] : null;
      galleryMain.innerHTML = entry
        ? mainPhotoHTML(entry)
        : `<div class="placeholder-block" aria-hidden="true"><span class="placeholder-label">${thumb.querySelector(".placeholder-label").textContent} — ${product.name}</span></div>`;
    });
  });

  /* Options */
  const optionRow = document.getElementById("pdpOptionRow");
  let selectedOption = null;
  if (product.options) {
    optionRow.style.display = "";
    document.getElementById("pdpOptionLabel").textContent = product.options.label;
    const pillsWrap = document.getElementById("pdpOptionPills");
    pillsWrap.innerHTML = product.options.values.map((v, i) =>
      `<button type="button" class="option-pill${i === 0 ? " selected" : ""}" data-value="${v}">${v}</button>`
    ).join("");
    selectedOption = product.options.values[0];
    pillsWrap.querySelectorAll(".option-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        pillsWrap.querySelectorAll(".option-pill").forEach(p => p.classList.remove("selected"));
        pill.classList.add("selected");
        selectedOption = pill.dataset.value;
      });
    });
  } else {
    optionRow.style.display = "none";
  }

  /* Stock note + Add to Bag */
  const stockNote = document.getElementById("pdpStockNote");
  const addBtn = document.getElementById("pdpAddToBag");
  if (!product.inStock) {
    stockNote.textContent = "Currently unavailable — join the waitlist to be notified when it's back.";
    addBtn.textContent = "Notify Me";
  } else if (product.quantity <= 5) {
    stockNote.textContent = `Only ${product.quantity} left — ready to ship within 2 business days.`;
  } else {
    stockNote.textContent = "In stock — ready to ship within 2 business days.";
  }

  /* Qty stepper */
  let qty = 1;
  const qtyValue = document.getElementById("pdpQtyValue");
  document.getElementById("pdpQtyDec").addEventListener("click", () => {
    qty = Math.max(1, qty - 1);
    qtyValue.textContent = qty;
  });
  document.getElementById("pdpQtyInc").addEventListener("click", () => {
    qty = Math.min(10, qty + 1);
    qtyValue.textContent = qty;
  });

  addBtn.addEventListener("click", () => {
    if (!product.inStock) {
      alert("Thanks for your interest — connect this button to your email list (Klaviyo, Mailchimp, etc.) to collect waitlist signups.");
      return;
    }
    addToCart(product.id, qty, selectedOption);
  });

  /* Related products */
  const related = VENNUS_PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const relatedGrid = document.getElementById("relatedGrid");
  if (relatedGrid) relatedGrid.innerHTML = related.map(productCardHTML).join("");
}

/* ---------------------------------------------------------------
   BOOT
   -----------------------------------------------------------------
   If js/vennus-api.js is loaded before this file (see the storefront
   connector), it starts fetching your live catalogue immediately and
   exposes that fetch as window.vennusReady — a promise. We wait for
   it here before drawing anything, so the page renders once, with
   final data, instead of flashing the sample catalogue first.

   The 2.5s timeout matters: free-tier backends fall asleep after
   inactivity and can take several seconds to wake up. Rather than
   leave the page blank while that happens, we give it a short grace
   period and then render with whatever we have — the bundled sample
   data if the fetch hasn't resolved yet. Nobody should stare at a
   blank shop because a server was napping.

   Without vennus-api.js loaded at all, window.vennusReady is simply
   undefined and everything renders immediately, exactly as before.
   --------------------------------------------------------------- */
async function vennusBootRender() {
  if (window.vennusReady) {
    await Promise.race([
      window.vennusReady,
      new Promise(resolve => setTimeout(resolve, 2500))
    ]).catch(() => { /* connector failed — fall back to bundled products.js */ });
  }
  renderShopGrid();
  renderFeaturedProducts("newArrivalsGrid", p => p.tag === "new", 4);
  renderFeaturedProducts("bestsellersGrid", p => p.tag === "bestseller" || p.tag === "sale", 4);
  renderProductDetail();
}
vennusBootRender();
