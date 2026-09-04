/* =================================================================
   VENNUS — Storefront admin bar
   -----------------------------------------------------------------
   Lets you sign in as staff right on the storefront's own "Sign In"
   form. If the credentials match a staff account (editor role or
   higher), a slim bar appears at the top of every page with:
     - inline hero editing, right on the page that has one
     - "Edit" links on products that jump straight to that product
       in the full admin
     - Open full admin / Sign out

   If the credentials DON'T match a staff account, the form falls
   back to the normal placeholder behaviour a real customer sign-in
   would show — this script doesn't change anything about that path.

   Session storage: a token in localStorage, sent as an
   "Authorization: Bearer <token>" header. NOT a cookie — cookies set
   by a different domain (the admin, on Render) get blocked by
   browsers' third-party cookie protections often enough that relying
   on them here would be fragile. This sidesteps that entirely.

   Requires js/vennus-api.js to be loaded first (for VENNUS_API), and
   should itself load before js/main.js so it can claim the sign-in
   form's submit event before main.js's generic placeholder handler
   does.
   ================================================================= */

(function () {
  const TOKEN_KEY = "vennus_admin_token";
  const USER_KEY = "vennus_admin_user";
  const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };

  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
  const getUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; } };
  const setSession = (token, user) => {
    try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch {}
  };
  const clearSession = () => {
    try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch {}
  };
  const canEdit = user => user && (ROLE_RANK[user.role] || 0) >= ROLE_RANK.editor;

  async function adminApi(path, opts = {}) {
    const token = getToken();
    const isForm = opts.body instanceof FormData;
    const headers = Object.assign(isForm ? {} : { "Content-Type": "application/json" }, opts.headers || {});
    if (token) headers["Authorization"] = "Bearer " + token;
    const res = await fetch(VENNUS_API + "/api" + path, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  /* ---------- Claim the storefront's own Sign In form ---------- */
  function wireSignInForm() {
    const form = document.querySelector("#signInPanel form");
    if (!form || form.dataset.vnWired) return;
    form.dataset.vnWired = "1";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      const email = document.getElementById("signInEmail")?.value || "";
      const password = document.getElementById("signInPassword")?.value || "";
      const note = form.querySelector(".form-success");

      try {
        const r = await adminApi("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
        setSession(r.token, r.user);
        if (note) {
          note.textContent = `Signed in as ${r.user.name} (${r.user.role}). Look for the bar at the top of the page — that's where you edit the site.`;
          note.classList.add("show");
        }
        buildBar();
      } catch (err) {
        // Not a staff account — this is presumably a real customer,
        // so show exactly the placeholder a customer sign-in would.
        if (note) {
          note.textContent = "You're signed in. Connect this form to your store's account system (Shopify Customer Accounts, a custom backend, etc.) to make it functional.";
          note.classList.add("show");
        }
      }
    }, true); // capture: run before main.js's generic handler on the same form
  }

  /* ---------- The bar ---------- */
  let barBuilt = false;

  function injectStyles() {
    if (document.getElementById("vn-admin-bar-styles")) return;
    const style = document.createElement("style");
    style.id = "vn-admin-bar-styles";
    style.textContent = `
      #vn-admin-bar {
        background: #232019; color: #F3EDE3;
        font-family: 'Jost', system-ui, sans-serif; font-size: .8rem;
        padding: 9px 20px; display: flex; align-items: center; justify-content: space-between;
        gap: 16px; flex-wrap: wrap;
      }
      #vn-admin-bar strong { font-weight: 500; }
      #vn-admin-bar .vn-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      #vn-admin-bar button, #vn-admin-bar a {
        background: none; border: 1px solid rgba(243,237,227,.4); color: #F3EDE3;
        padding: 5px 12px; font-size: .76rem; cursor: pointer; text-decoration: none;
        font-family: inherit; transition: all .15s ease;
      }
      #vn-admin-bar button:hover, #vn-admin-bar a:hover { background: rgba(243,237,227,.12); }
      .vn-edit-pencil {
        position: absolute; bottom: 10px; left: 10px; z-index: 5;
        width: 30px; height: 30px; background: rgba(35,32,25,.85); color: #F3EDE3;
        border: none; display: flex; align-items: center; justify-content: center;
        cursor: pointer; font-size: .85rem; text-decoration: none;
      }
      .vn-edit-pencil:hover { background: #232019; }
      .vn-hero-editor {
        position: fixed; inset: 0; background: rgba(35,26,18,.5); z-index: 500;
        display: flex; align-items: center; justify-content: center; padding: 20px;
      }
      .vn-hero-editor .box {
        background: #FAF7F1; color: #3B2C20; width: 100%; max-width: 420px;
        padding: 26px; font-family: 'Jost', system-ui, sans-serif;
      }
      .vn-hero-editor h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; margin-bottom: 14px; }
      .vn-hero-editor .row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; }
      .vn-hero-editor button {
        padding: 9px 16px; font-size: .8rem; border: 1px solid #3B2C20; background: none;
        color: #3B2C20; cursor: pointer; font-family: inherit;
      }
      .vn-hero-editor button.primary { background: #3B2C20; color: #FAF7F1; }
      .vn-hero-editor .close { position: absolute; top: 14px; right: 16px; border: none; font-size: 1.1rem; }
      .vn-media-pick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; max-height: 260px; overflow-y: auto; margin-top: 10px; }
      .vn-media-pick div { aspect-ratio: 1; background: #EDE3D3; cursor: pointer; overflow: hidden; border: 2px solid transparent; }
      .vn-media-pick div:hover { border-color: #B8865A; }
      .vn-media-pick img, .vn-media-pick video { width: 100%; height: 100%; object-fit: cover; }
    `;
    document.head.appendChild(style);
  }

  function heroKeyForThisPage() {
    if (document.getElementById("heroMedia")) return { key: "hero_home", el: document.getElementById("heroMedia") };
    if (document.getElementById("maisonHeroMedia")) return { key: "hero_maison", el: document.getElementById("maisonHeroMedia") };
    return null;
  }

  function applyHeroToPage(el, hero) {
    if (!el) return;
    if (!hero || !hero.url) return;
    const html = hero.type === "video"
      ? `<video autoplay muted loop playsinline style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;"><source src="${hero.url}"></video>`
      : `<img src="${hero.url}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;">`;
    el.outerHTML = html;
  }

  async function openHeroEditor() {
    const target = heroKeyForThisPage();
    if (!target) return;

    let items = [];
    try { items = await adminApi("/media"); } catch { /* library may be empty or unreachable */ }

    const overlay = document.createElement("div");
    overlay.className = "vn-hero-editor";
    overlay.innerHTML = `
      <div class="box">
        <button class="close" type="button" aria-label="Close">×</button>
        <h3>Edit this page's hero</h3>
        <p style="font-size:.82rem; color:#8D8477;">Pick something already uploaded, or upload a new photo or video.</p>
        <div class="vn-media-pick">
          ${items.map(m => `<div data-url="${m.url}" data-type="${m.type}">${
            m.type === "video" ? `<video src="${m.url}" muted></video>` : `<img src="${m.url}">`
          }</div>`).join("") || '<p style="font-size:.8rem; grid-column:1/-1;">Nothing uploaded yet — use "Upload new" below.</p>'}
        </div>
        <div class="row">
          <input type="file" id="vnHeroFile" accept="image/*,video/*" style="font-size:.78rem;">
          <button type="button" class="primary" id="vnHeroUploadBtn">Upload new</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector(".close").onclick = close;
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });

    async function saveHero(hero) {
      try {
        await adminApi("/settings", { method: "PUT", body: JSON.stringify({ [target.key]: hero }) });
        applyHeroToPage(document.getElementById(target.key === "hero_home" ? "heroMedia" : "maisonHeroMedia"), hero);
        close();
      } catch (err) { alert(err.message); }
    }

    overlay.querySelectorAll(".vn-media-pick div[data-url]").forEach(el => {
      el.onclick = () => saveHero({ url: el.dataset.url, type: el.dataset.type });
    });

    overlay.querySelector("#vnHeroUploadBtn").onclick = async () => {
      const file = overlay.querySelector("#vnHeroFile").files[0];
      if (!file) return alert("Choose a file first.");
      const fd = new FormData();
      fd.append("files", file);
      try {
        const r = await adminApi("/media", { method: "POST", body: fd });
        const f = r.files[0];
        await saveHero({ url: f.url, type: f.type });
      } catch (err) { alert(err.message); }
    };
  }

  /* ---------- Edit links on products ---------- */
  function addEditPencil(card, productId) {
    if (card.querySelector("[data-vn-edit]")) return;
    const media = card.querySelector(".product-media");
    if (!media) return;
    const btn = document.createElement("a");
    btn.href = `${VENNUS_API}/admin/#product-${productId}`;
    btn.target = "_blank";
    btn.rel = "noopener";
    btn.className = "vn-edit-pencil";
    btn.setAttribute("data-vn-edit", "1");
    btn.title = "Edit this product";
    btn.textContent = "✎";
    media.appendChild(btn);
  }

  function watchProductCards() {
    const scan = () => {
      document.querySelectorAll(".product-card").forEach(card => {
        const link = card.querySelector('a[href*="product.html?id="]');
        if (!link) return;
        const id = new URLSearchParams(link.href.split("?")[1]).get("id");
        if (id) addEditPencil(card, id);
      });
      // Product detail page itself
      const root = document.getElementById("productDetailRoot");
      if (root && !document.getElementById("vnEditThisProduct")) {
        const id = new URLSearchParams(location.search).get("id");
        const nameEl = document.getElementById("pdpName");
        if (id && nameEl) {
          const link = document.createElement("a");
          link.id = "vnEditThisProduct";
          link.href = `${VENNUS_API}/admin/#product-${id}`;
          link.target = "_blank"; link.rel = "noopener";
          link.style.cssText = "display:inline-block; font-size:.78rem; margin-top:8px; text-decoration:underline;";
          link.textContent = "Edit this product in admin ↗";
          nameEl.insertAdjacentElement("afterend", link);
        }
      }
    };
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- Build the bar ---------- */
  async function buildBar() {
    const token = getToken();
    if (!token) return;

    let user;
    try { user = (await adminApi("/auth/me")).user; setSession(token, user); }
    catch { clearSession(); return; }

    if (!canEdit(user)) return;

    if (!barBuilt) {
      barBuilt = true;
      injectStyles();
      const hero = heroKeyForThisPage();
      const bar = document.createElement("div");
      bar.id = "vn-admin-bar";
      bar.innerHTML = `
        <span>Editing as <strong>${user.name}</strong> (${user.role})</span>
        <span class="vn-actions">
          ${hero ? '<button type="button" id="vnEditHeroBtn">Edit this page\u2019s hero</button>' : ""}
          <a href="${VENNUS_API}/admin" target="_blank" rel="noopener">Open full admin ↗</a>
          <button type="button" id="vnAdminSignOut">Sign out</button>
        </span>`;
      document.body.insertBefore(bar, document.body.firstChild);

      document.getElementById("vnEditHeroBtn")?.addEventListener("click", openHeroEditor);
      document.getElementById("vnAdminSignOut")?.addEventListener("click", async () => {
        try { await adminApi("/auth/logout", { method: "POST" }); } catch {}
        clearSession();
        location.reload();
      });
    }

    watchProductCards();
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireSignInForm();
    buildBar();
  });
})();
