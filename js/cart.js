/* =================================================================
   VENNUS JEWELRY — Cart Logic
   -----------------------------------------------------------------
   Handles: adding items, quantity changes, removal, the cart-count
   bubble on the bag icon, and opening/closing the cart drawer.
   Cart data is saved in the browser's localStorage under
   "vennus_cart" so it persists between pages and visits.

   NOTE: This is a front-end-only cart for design purposes. To take
   real payments, connect the checkout button to a payment
   processor / e-commerce backend (Shopify, Stripe, Square, etc.)
   — see the README for pointers.
   ================================================================= */

const CART_KEY = "vennus_cart";

/* ---- Safe storage helpers (falls back gracefully if storage is blocked) ---- */
function vennusReadStorage() {
  try {
    const raw = window.localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function vennusWriteStorage(cart) {
  try {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch (e) {
    /* Storage unavailable — cart will simply not persist on reload */
  }
}

/* Each cart line: { id, name, category, price, option, qty } */
function getCart() {
  return vennusReadStorage();
}

function setCart(cart) {
  vennusWriteStorage(cart);
  renderCartCount(cart);
}

function lineKey(id, option) {
  return id + "::" + (option || "default");
}

function addToCart(productId, qty, option) {
  const product = VENNUS_PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  const cart = getCart();
  const key = lineKey(productId, option);
  const existing = cart.find(line => lineKey(line.id, line.option) === key);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      option: option || null,
      qty: qty
    });
  }
  setCart(cart);
  renderCart();
  openCartDrawer();
}

function changeQty(key, delta) {
  const cart = getCart();
  const line = cart.find(l => lineKey(l.id, l.option) === key);
  if (!line) return;
  line.qty += delta;
  const filtered = line.qty <= 0 ? cart.filter(l => lineKey(l.id, l.option) !== key) : cart;
  setCart(filtered);
  renderCart();
}

function removeLine(key) {
  const cart = getCart().filter(l => lineKey(l.id, l.option) !== key);
  setCart(cart);
  renderCart();
}

function cartTotalQty(cart) {
  return cart.reduce((sum, l) => sum + l.qty, 0);
}

function cartSubtotal(cart) {
  return cart.reduce((sum, l) => sum + l.qty * l.price, 0);
}

/* ---- Rendering ---- */
function renderCartCount(cart) {
  const count = cartTotalQty(cart);
  document.querySelectorAll(".cart-count").forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });
}

function renderCart() {
  const cart = getCart();
  const list = document.getElementById("cartItemsList");
  const emptyState = document.getElementById("cartEmpty");
  const subtotalEl = document.getElementById("cartSubtotal");
  if (!list) { renderCartCount(cart); return; }

  list.innerHTML = "";

  if (cart.length === 0) {
    if (emptyState) emptyState.style.display = "block";
  } else {
    if (emptyState) emptyState.style.display = "none";
    cart.forEach(line => {
      const key = lineKey(line.id, line.option);
      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <div class="cart-item-thumb placeholder-block" aria-hidden="true"></div>
        <div>
          <div class="cart-item-name">${line.name}</div>
          <div class="cart-item-meta">${line.option ? line.option + " &middot; " : ""}${line.category}</div>
          <div class="qty-control" role="group" aria-label="Quantity for ${line.name}">
            <button type="button" aria-label="Decrease quantity" data-action="dec" data-key="${key}">&minus;</button>
            <span>${line.qty}</span>
            <button type="button" aria-label="Increase quantity" data-action="inc" data-key="${key}">&plus;</button>
          </div>
          <button type="button" class="cart-item-remove" data-action="remove" data-key="${key}">Remove</button>
        </div>
        <div class="cart-item-price">${vennusFormatPrice(line.price * line.qty)}</div>
      `;
      list.appendChild(item);
    });
  }

  if (subtotalEl) subtotalEl.textContent = vennusFormatPrice(cartSubtotal(cart));
  renderCartCount(cart);
}

/* Delegate qty/remove button clicks inside the cart drawer */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn || !btn.dataset.key) return;
  const key = btn.dataset.key;
  if (btn.dataset.action === "inc") changeQty(key, 1);
  if (btn.dataset.action === "dec") changeQty(key, -1);
  if (btn.dataset.action === "remove") removeLine(key);
});

/* ---- Drawer open / close ---- */
function openCartDrawer() {
  document.getElementById("cartDrawer")?.classList.add("open");
  document.getElementById("drawerBackdrop")?.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCartDrawer() {
  document.getElementById("cartDrawer")?.classList.remove("open");
  document.getElementById("drawerBackdrop")?.classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
  renderCart();

  document.querySelectorAll("[data-cart-open]").forEach(el =>
    el.addEventListener("click", (e) => { e.preventDefault(); openCartDrawer(); })
  );
  document.querySelectorAll("[data-cart-close]").forEach(el =>
    el.addEventListener("click", closeCartDrawer)
  );
  document.getElementById("drawerBackdrop")?.addEventListener("click", closeCartDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCartDrawer(); });

  document.getElementById("checkoutBtn")?.addEventListener("click", () => {
    const cart = getCart();
    if (cart.length === 0) return;
    alert("This is a design-template checkout button. Connect it to a payment processor (Shopify, Stripe, Square, etc.) to accept real orders — see the README for guidance.");
  });
});
