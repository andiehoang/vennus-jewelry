/* =================================================================
   VENNUS — Storefront admin bar
   -----------------------------------------------------------------
   Sign in as staff right on the storefront's own "Sign In" form.
   If the credentials match a staff account (editor role or higher),
   a slim bar appears at the top of every page with:
     - a pencil on EVERY image the admin controls — hero banners,
       editorial photos, mega-menu features — click it to pick from
       your library, upload fresh (opens your normal OS file picker,
       and also accepts drag-and-drop), and set how it's framed
     - a pencil on every product photo, directly on the shop grid and
       product pages — add, remove, reorder, no trip to the admin
     - Open full admin / Sign out

   If the credentials DON'T match a staff account, the sign-in form
   falls back to the normal placeholder a real customer sign-in would
   show — this script doesn't change anything about that path.

   Session storage: a token in localStorage, sent as an
   "Authorization: Bearer <token>" header. NOT a cookie — cookies set
   by a different domain (the admin, on Render) get blocked by
   browsers' third-party cookie protections often enough that relying
   on them here would be fragile. This sidesteps that entirely.

   Requires js/vennus-api.js to be loaded first (for VENNUS_API and
   window.vennusApplyEditableImage), and should itself load before
   js/main.js so it can claim the sign-in form's submit event before
   main.js's generic placeholder handler does.
   ================================================================= */

(function () {
  const TOKEN_KEY = "vennus_admin_token";
  const USER_KEY = "vennus_admin_user";
  const ROLE_RANK = { viewer: 1, editor: 2, admin: 3, owner: 4 };

  const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
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
        // Not a staff account — presumably a real customer, so show
        // exactly the placeholder a customer sign-in would.
        if (note) {
          note.textContent = "You're signed in. Connect this form to your store's account system (Shopify Customer Accounts, a custom backend, etc.) to make it functional.";
          note.classList.add("show");
        }
      }
    }, true); // capture: run before main.js's generic handler on the same form
  }

  /* ---------- Styles ---------- */
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
      #vn-admin-bar button, #vn-admin-bar a.vn-link {
        background: none; border: 1px solid rgba(243,237,227,.4); color: #F3EDE3;
        padding: 5px 12px; font-size: .76rem; cursor: pointer; text-decoration: none;
        font-family: inherit; transition: all .15s ease;
      }
      #vn-admin-bar button:hover, #vn-admin-bar a.vn-link:hover { background: rgba(243,237,227,.12); }

      .vn-edit-btn {
        position: absolute; bottom: 10px; right: 10px; z-index: 20;
        background: rgba(35,32,25,.9); color: #F3EDE3; border: none;
        padding: 7px 14px; font-size: .74rem; letter-spacing: .04em;
        cursor: pointer; font-family: 'Jost', system-ui, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,.25);
      }
      .vn-edit-btn:hover { background: #232019; }

      .vn-modal { position: fixed; inset: 0; background: rgba(35,26,18,.5); z-index: 500;
        display: flex; align-items: center; justify-content: center; padding: 20px; overflow-y: auto; }
      .vn-modal .box { background: #FAF7F1; color: #3B2C20; width: 100%; max-width: 480px;
        padding: 26px; font-family: 'Jost', system-ui, sans-serif; position: relative; max-height: 90vh; overflow-y: auto; }
      .vn-modal .box.wide { max-width: 640px; }
      .vn-modal h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; margin-bottom: 6px; }
      .vn-modal p.hint { font-size: .8rem; color: #8D8477; margin-bottom: 14px; }
      .vn-modal .row { display: flex; gap: 10px; margin-top: 16px; flex-wrap: wrap; align-items: center; }
      .vn-modal button.vn-btn {
        padding: 9px 16px; font-size: .8rem; border: 1px solid #3B2C20; background: none;
        color: #3B2C20; cursor: pointer; font-family: inherit;
      }
      .vn-modal button.vn-btn.primary { background: #3B2C20; color: #FAF7F1; }
      .vn-modal button.vn-btn.danger { border-color: #A6483C; color: #A6483C; }
      .vn-modal .close { position: absolute; top: 14px; right: 16px; border: none; background: none; font-size: 1.2rem; cursor: pointer; color: #3B2C20; }

      .vn-dropzone { border: 1px dashed #C9AC80; padding: 18px; text-align: center; font-size: .8rem; color: #8D8477; margin-top: 6px; transition: background .15s; }
      .vn-dropzone.hot { background: #EDE3D3; }

      .vn-media-pick { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-height: 220px; overflow-y: auto; margin-top: 10px; }
      .vn-media-pick div { aspect-ratio: 1; background: #EDE3D3; cursor: pointer; overflow: hidden; border: 2px solid transparent; }
      .vn-media-pick div:hover { border-color: #B8865A; }
      .vn-media-pick img, .vn-media-pick video { width: 100%; height: 100%; object-fit: cover; }

      .vn-position-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; width: 130px; margin-top: 6px; }
      .vn-position-grid button { aspect-ratio: 1; border: 1px solid #C9AC80; background: #fff; cursor: pointer; padding: 0; }
      .vn-position-grid button.active { background: #3B2C20; }
      .vn-preview-frame { width: 100%; aspect-ratio: 16/9; background: #EDE3D3; overflow: hidden; margin-top: 12px; }
      .vn-preview-frame img, .vn-preview-frame video { width: 100%; height: 100%; object-fit: cover; }

      .vn-photo-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 10px 0; }
      .vn-photo-list .item { position: relative; aspect-ratio: 1; background: #EDE3D3; overflow: hidden; }
      .vn-photo-list .item img { width: 100%; height: 100%; object-fit: cover; }
      .vn-photo-list .item button { position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; background: rgba(35,26,18,.8);
        color: #fff; border: none; font-size: .7rem; cursor: pointer; padding: 0; }
    `;
    document.head.appendChild(style);
  }

  /* ---------- Shared modal shell ---------- */
  function openModal(innerHTML, { wide } = {}) {
    const overlay = document.createElement("div");
    overlay.className = "vn-modal";
    overlay.innerHTML = `<div class="box${wide ? " wide" : ""}"><button class="close" type="button" aria-label="Close">×</button>${innerHTML}</div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector(".close").onclick = close;
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    return { overlay, close };
  }

  function wireDropzone(zone, onFiles) {
    ["dragenter", "dragover"].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add("hot"); }));
    ["dragleave", "drop"].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove("hot"); }));
    zone.addEventListener("drop", e => onFiles(e.dataTransfer.files));
  }

  const POSITIONS = [
    ["top left","left top"], ["top center","center top"], ["top right","right top"],
    ["center left","left center"], ["center center","center center"], ["center right","right center"],
    ["bottom left","left bottom"], ["bottom center","center bottom"], ["bottom right","right bottom"]
  ];

  /* =================================================================
     SINGLE-IMAGE EDITOR — used for every [data-editable-image] spot
     (hero banners, editorial photos, mega-menu features).
     ================================================================= */
  async function openImageEditor(el) {
    const key = el.dataset.editableImage;
    let items = [];
    try { items = await adminApi("/media"); } catch { /* library may be empty or unreachable */ }

    const { overlay, close } = openModal(`
      <h3>Edit this image</h3>
      <p class="hint">Pick something already uploaded, or upload a new photo or video — drag a file onto the box below, or use "Choose file" to open your computer's file browser.</p>
      <div class="vn-media-pick">
        ${items.map(m => `<div data-url="${m.url}" data-type="${m.type}">${
          m.type === "video" ? `<video src="${m.url}" muted></video>` : `<img src="${m.url}">`
        }</div>`).join("") || '<p style="font-size:.8rem; grid-column:1/-1;">Nothing uploaded yet — use the box below.</p>'}
      </div>
      <div class="vn-dropzone" id="vnDrop">Drag a photo or video here, or
        <label style="text-decoration:underline; cursor:pointer;">choose a file<input type="file" id="vnFile" accept="image/*,video/*" style="display:none;"></label>
      </div>
      <div id="vnStep2" style="display:none;">
        <p style="font-size:.85rem; font-weight:500; margin-top:16px;">How should it sit in the frame?</p>
        <div class="vn-preview-frame" id="vnPreview"></div>
        <div class="vn-position-grid" id="vnPosGrid">
          ${POSITIONS.map(([label, val]) => `<button type="button" data-pos="${val}" title="${label}"></button>`).join("")}
        </div>
        <div class="row">
          <button type="button" class="vn-btn primary" id="vnSaveImage">Save</button>
          <button type="button" class="vn-btn" id="vnCancelStep2">Choose a different file</button>
        </div>
      </div>
    `, {});

    let pending = null; // { url, type }
    let position = "center center";

    function showStep2(media) {
      pending = media;
      overlay.querySelector(".vn-media-pick").style.display = "none";
      overlay.querySelector("#vnDrop").style.display = "none";
      overlay.querySelector("#vnStep2").style.display = "block";
      renderPreview();
      overlay.querySelectorAll("#vnPosGrid button").forEach(b => {
        b.classList.toggle("active", b.dataset.pos === position);
        b.onclick = () => { position = b.dataset.pos; renderPreview(); overlay.querySelectorAll("#vnPosGrid button").forEach(x => x.classList.toggle("active", x === b)); };
      });
    }
    function renderPreview() {
      const box = overlay.querySelector("#vnPreview");
      box.innerHTML = pending.type === "video"
        ? `<video src="${pending.url}" muted style="object-position:${position}"></video>`
        : `<img src="${pending.url}" style="object-position:${position}">`;
    }

    overlay.querySelectorAll(".vn-media-pick div[data-url]").forEach(div => {
      div.onclick = () => showStep2({ url: div.dataset.url, type: div.dataset.type });
    });

    async function handleFiles(files) {
      const file = files[0];
      if (!file) return;
      const fd = new FormData();
      fd.append("files", file);
      try {
        const r = await adminApi("/media", { method: "POST", body: fd });
        const f = r.files[0];
        showStep2({ url: f.url, type: f.type });
      } catch (err) { alert(err.message); }
    }
    overlay.querySelector("#vnFile").addEventListener("change", e => handleFiles(e.target.files));
    wireDropzone(overlay.querySelector("#vnDrop"), handleFiles);

    overlay.querySelector("#vnCancelStep2").onclick = () => {
      overlay.querySelector(".vn-media-pick").style.display = "grid";
      overlay.querySelector("#vnDrop").style.display = "block";
      overlay.querySelector("#vnStep2").style.display = "none";
    };

    overlay.querySelector("#vnSaveImage").onclick = async () => {
      const media = { url: pending.url, type: pending.type, position };
      try {
        await adminApi("/settings", { method: "PUT", body: JSON.stringify({ [key]: media }) });
        window.vennusApplyEditableImage(el, media);
        close();
      } catch (err) { alert(err.message); }
    };
  }

  function scanEditableImages() {
    document.querySelectorAll("[data-editable-image]").forEach(el => {
      // .hero .placeholder-block establishes its own stacking context
      // (position:absolute + an explicit z-index, for layering behind
      // .hero-content) — which traps anything nested inside it, so no
      // z-index on a button placed there could ever outrank .hero-content,
      // a sibling of that whole box. Attaching the button to the shared
      // .hero parent instead — a true sibling of .hero-content — sidesteps
      // that entirely, since it's the same footprint either way here.
      const isHeroLayer = el.matches(".hero .placeholder-block");
      const container = isHeroLayer ? el.closest(".hero") : el;
      const key = el.dataset.editableImage;
      if (container.querySelector(`:scope > .vn-edit-btn[data-key="${key}"]`)) return;
      if (getComputedStyle(container).position === "static") container.style.position = "relative";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "vn-edit-btn";
      btn.dataset.key = key;
      btn.title = "Edit this image";
      btn.textContent = "Edit";
      btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openImageEditor(el); });
      container.appendChild(btn);
    });
  }

  /* =================================================================
     PRODUCT PHOTOS — inline add/remove/reorder, right on the site.
     ================================================================= */
  async function openProductPhotoEditor(productId, mediaEl) {
    let product;
    try { product = await adminApi("/products/" + productId); }
    catch (err) { return alert(err.message); }

    let items = [];
    try { items = await adminApi("/media?type=image"); } catch {}

    let photos = (product.images || []).slice();

    const { overlay, close } = openModal(`
      <h3>${product.name}</h3>
      <p class="hint">Add, remove, or reorder this product's photos. Drag a file below to upload, or pick from your library.</p>
      <div class="vn-photo-list" id="vnPhotoList"></div>
      <div class="vn-media-pick" id="vnLibraryPick">
        ${items.map(m => `<div data-url="${m.url}">${`<img src="${m.url}">`}</div>`).join("") || '<p style="font-size:.8rem; grid-column:1/-1;">Nothing in your library yet.</p>'}
      </div>
      <div class="vn-dropzone" id="vnDrop">Drag photos here, or
        <label style="text-decoration:underline; cursor:pointer;">choose files<input type="file" id="vnFile" accept="image/*" multiple style="display:none;"></label>
      </div>
      <div class="row">
        <button type="button" class="vn-btn primary" id="vnSavePhotos">Save changes</button>
        <a class="vn-btn" style="text-decoration:none; display:inline-block;" href="${VENNUS_API}/admin/#product-${productId}" target="_blank" rel="noopener">Edit full details ↗</a>
      </div>
    `, { wide: true });

    function renderList() {
      overlay.querySelector("#vnPhotoList").innerHTML = photos.map((url, i) =>
        `<div class="item" data-i="${i}"><img src="${url}"><button type="button" data-rm="${i}" title="Remove">×</button></div>`).join("")
        || '<p style="font-size:.8rem;">No photos yet — add one below.</p>';
      overlay.querySelectorAll("[data-rm]").forEach(b => {
        b.onclick = () => { photos.splice(+b.dataset.rm, 1); renderList(); };
      });
    }
    renderList();

    overlay.querySelectorAll("#vnLibraryPick div[data-url]").forEach(div => {
      div.onclick = () => { photos.push(div.dataset.url); renderList(); };
    });

    async function handleFiles(files) {
      if (!files.length) return;
      const fd = new FormData();
      [...files].forEach(f => fd.append("files", f));
      try {
        const r = await adminApi("/media", { method: "POST", body: fd });
        r.files.forEach(f => photos.push(f.url));
        renderList();
      } catch (err) { alert(err.message); }
    }
    overlay.querySelector("#vnFile").addEventListener("change", e => handleFiles(e.target.files));
    wireDropzone(overlay.querySelector("#vnDrop"), handleFiles);

    overlay.querySelector("#vnSavePhotos").onclick = async () => {
      try {
        await adminApi("/products/" + productId, { method: "PUT", body: JSON.stringify({ images: photos }) });
        // Reflect immediately on this page without needing a reload
        if (mediaEl && photos.length) {
          const existing = mediaEl.querySelector("img, .placeholder-block");
          if (existing) existing.outerHTML = `<img src="${photos[0]}" alt="" loading="lazy" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;">`;
        }
        close();
      } catch (err) { alert(err.message); }
    };
  }

  function addProductPencil(card, productId) {
    if (card.querySelector("[data-vn-edit]")) return;
    const media = card.querySelector(".product-media");
    if (!media) return;
    if (getComputedStyle(media).position === "static") media.style.position = "relative";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vn-edit-btn";
    btn.setAttribute("data-vn-edit", "1");
    btn.title = "Edit this product's photos";
    btn.textContent = "Edit";
    btn.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); openProductPhotoEditor(productId, media); });
    media.appendChild(btn);
  }

  function watchProductCards() {
    const scan = () => {
      document.querySelectorAll(".product-card").forEach(card => {
        const link = card.querySelector('a[href*="product.html?id="]');
        if (!link) return;
        const id = new URLSearchParams(link.href.split("?")[1]).get("id");
        if (id) addProductPencil(card, id);
      });
      // Product detail page itself
      const root = document.getElementById("productDetailRoot");
      if (root && !document.getElementById("vnEditThisProductPhotos")) {
        const id = new URLSearchParams(location.search).get("id");
        const galleryMain = document.getElementById("pdpGalleryMain");
        if (id && galleryMain) {
          if (getComputedStyle(galleryMain).position === "static") galleryMain.style.position = "relative";
          const btn = document.createElement("button");
          btn.type = "button";
          btn.id = "vnEditThisProductPhotos";
          btn.className = "vn-edit-btn";
          btn.title = "Edit this product's photos";
          btn.textContent = "Edit";
          btn.addEventListener("click", (e) => { e.preventDefault(); openProductPhotoEditor(id, galleryMain); });
          galleryMain.appendChild(btn);
        }
      }
    };
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------- Build the bar ---------- */
  let barBuilt = false;
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
      const bar = document.createElement("div");
      bar.id = "vn-admin-bar";
      bar.innerHTML = `
        <span>Editing as <strong>${user.name}</strong> (${user.role}) — look for "Edit" on any image</span>
        <span class="vn-actions">
          <a class="vn-link" href="${VENNUS_API}/admin" target="_blank" rel="noopener">Open full admin ↗</a>
          <button type="button" id="vnAdminSignOut">Sign out</button>
        </span>`;
      document.body.insertBefore(bar, document.body.firstChild);

      document.getElementById("vnAdminSignOut")?.addEventListener("click", async () => {
        try { await adminApi("/auth/logout", { method: "POST" }); } catch {}
        clearSession();
        location.reload();
      });
    }

    scanEditableImages();
    watchProductCards();
  }

  document.addEventListener("DOMContentLoaded", () => {
    wireSignInForm();
    buildBar();
  });
})();
