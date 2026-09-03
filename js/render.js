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

function productCardHTML(p) {
  const tag = !p.inStock
    ? `<span class="product-tag sold-out">Sold Out</span>`
    : (p.tag ? `<span class="product-tag">${tagLabel(p.tag)}</span>` : "");

  const priceHTML = p.compareAt
    ? `<span class="was">${vennusFormatPrice(p.compareAt)}</span>${vennusFormatPrice(p.price)}`
    : vennusFormatPrice(p.price);

  return `
    <div class="product-card" data-category="${p.category}">
      <a href="product.html?id=${p.id}" class="card-link">
        <div class="product-media">
          ${tag}
          <button type="button" class="wishlist-btn" aria-label="Add ${p.name} to wishlist" data-wishlist>
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9.5-8.8C.8 7.8 2.6 4.5 6 4c2-.3 3.7.8 6 3 2.3-2.2 4-3.3 6-3 3.4.5 5.2 3.8 3.5 7.2C19 15.6 12 20 12 20z" fill="none"/></svg>
          </button>
          <div class="placeholder-block" aria-hidden="true">
            <span class="placeholder-label">Photo — ${p.name}</span>
          </div>
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
(function renderShopGrid() {
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
})();

/* ---------------------------------------------------------------
   FEATURED PRODUCTS (index.html)
   --------------------------------------------------------------- */
function renderFeaturedProducts(containerId, filterFn, limit) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const items = VENNUS_PRODUCTS.filter(filterFn).slice(0, limit || 4);
  container.innerHTML = items.map(productCardHTML).join("");
}
renderFeaturedProducts("newArrivalsGrid", p => p.tag === "new", 4);
renderFeaturedProducts("bestsellersGrid", p => p.tag === "bestseller" || p.tag === "sale", 4);

/* ---------------------------------------------------------------
   PRODUCT DETAIL PAGE (product.html)
   --------------------------------------------------------------- */
(function renderProductDetail() {
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
    ? `<span class="was">${vennusFormatPrice(product.compareAt)}</span>${vennusFormatPrice(product.price)}`
    : vennusFormatPrice(product.price);

  const detailsList = document.getElementById("pdpDetailsList");
  detailsList.innerHTML = product.details.map(d => `<li>${d}</li>`).join("");

  /* Gallery */
  const galleryMain = document.getElementById("pdpGalleryMain");
  galleryMain.innerHTML = `<div class="placeholder-block" aria-hidden="true"><span class="placeholder-label">Main photo — ${product.name}</span></div>`;
  const thumbCount = Math.max(1, Math.min(product.images || 3, 4));
  const thumbsWrap = document.getElementById("pdpGalleryThumbs");
  thumbsWrap.innerHTML = Array.from({ length: thumbCount }).map((_, i) =>
    `<div class="placeholder-block" data-thumb aria-hidden="true"><span class="placeholder-label">${i + 1}</span></div>`
  ).join("");
  thumbsWrap.querySelectorAll("[data-thumb]").forEach(thumb => {
    thumb.addEventListener("click", () => {
      galleryMain.innerHTML = `<div class="placeholder-block" aria-hidden="true"><span class="placeholder-label">${thumb.querySelector(".placeholder-label").textContent} — ${product.name}</span></div>`;
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
})();
