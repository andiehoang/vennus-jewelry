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

      .vn-crop-frame {
        width: 100%; aspect-ratio: 16/9; background: #EDE3D3; overflow: hidden;
        margin-top: 12px; position: relative; cursor: grab; user-select: none; touch-action: none;
      }
      .vn-crop-frame.dragging { cursor: grabbing; }
      .vn-crop-frame img, .vn-crop-frame video {
        position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; pointer-events: none;
      }
      .vn-resize-handle {
        display: block; width: 44px; height: 10px; margin: 10px auto 0;
        background: #3B2C20; border-radius: 5px; cursor: ns-resize; touch-action: none;
      }
      .vn-resize-handle:hover { background: #B8865A; }
      .vn-resize-hint { font-size: .74rem; color: #8D8477; margin-top: 8px; }
      .vn-crop-controls { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
      .vn-crop-controls button.vn-zoom-btn {
        width: 30px; height: 30px; border: 1px solid #3B2C20; background: none; color: #3B2C20;
        font-size: 1rem; cursor: pointer; padding: 0; font-family: inherit;
      }
      .vn-crop-controls input[type="range"] { flex: 1; }
      .vn-crop-hint { font-size: .74rem; color: #8D8477; margin-top: 6px; }

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

  /* =================================================================
     PICK + CROP — one reusable modal used everywhere a single photo or
     video needs choosing/uploading and framing: hero banners, editorial
     photos, mega-menu features, and each individual product photo.
     Framing is real drag-to-pan / scroll-to-zoom against the exact
     aspect ratio it will actually render at.

     opts:
       aspectRatio  — width/height number the crop frame should start at
       existingMedia — { url, type, position, zoom, heightOverride } to
                        jump straight to the crop step on an already-
                        chosen file (used when re-framing a photo
                        that's already part of a product, or already
                        set for a settings slot)
       onSave(media) — called with { url, type, position, zoom,
                        heightOverride } (heightOverride only present
                        when resizable is true and it's been dragged)
       resizable    — true to show a drag handle that changes the
                       frame's HEIGHT (width is always dictated by
                       where it sits in the layout — a hero always
                       spans the full page, an editorial photo is
                       always half its row — so height is the one
                       dimension that's actually free to adjust here)
       resizeUnit   — "vh" | "px" | "ratio", how heightOverride is
                       measured, matching whatever CSS mechanism the
                       destination actually uses:
                         vh    — .hero's own height (viewport-relative)
                         px    — editorial's min-height (a fixed
                                 absolute number regardless of column
                                 width, same as it already is by default)
                         ratio — mega-feature's aspect-ratio (width-
                                 independent by definition, so it
                                 transfers correctly even though this
                                 modal's frame renders narrower than
                                 the real spot on the live page)
     ================================================================= */
  function openPickCropModal({ aspectRatio, existingMedia, onSave, resizable, resizeUnit }) {
    let items = [];
    const loadItems = adminApi("/media").then(r => { items = r; }).catch(() => {});

    const { overlay, close } = openModal(`
      <h3>${existingMedia ? "Adjust framing" : "Choose an image or video"}</h3>
      <div id="vnStep1">
        <p class="hint">Pick something already uploaded, or upload a new photo or video — drag a file onto the box below, or use "Choose file" to open your computer's file browser.</p>
        <div class="vn-media-pick" id="vnMediaPick"><p style="font-size:.8rem; grid-column:1/-1;">Loading your library…</p></div>
        <div class="vn-dropzone" id="vnDrop">Drag a photo or video here, or
          <label style="text-decoration:underline; cursor:pointer;">choose a file<input type="file" id="vnFile" accept="image/*,video/*" style="display:none;"></label>
        </div>
      </div>
      <div id="vnStep2" style="display:none;">
        <p style="font-size:.85rem; font-weight:500;">Drag to reposition, scroll (or use the buttons) to zoom${resizable ? " — drag the bar underneath to make it shorter or taller" : ""}</p>
        <div class="vn-crop-frame" id="vnCropFrame"></div>
        ${resizable ? '<div class="vn-resize-handle" id="vnResizeHandle" title="Drag to resize height"></div><p class="vn-resize-hint">↕ Drag the bar just below the image to resize its height.</p>' : ""}
        <div class="vn-crop-controls">
          <button type="button" class="vn-zoom-btn" id="vnZoomOut">−</button>
          <input type="range" id="vnZoomSlider" min="100" max="300" value="100" step="1">
          <button type="button" class="vn-zoom-btn" id="vnZoomIn">+</button>
        </div>
        <p class="vn-crop-hint">This is exactly how it will be framed on the site.</p>
        <div class="row">
          <button type="button" class="vn-btn primary" id="vnSaveImage">Save</button>
          ${existingMedia ? "" : '<button type="button" class="vn-btn" id="vnCancelStep2">Choose a different file</button>'}
          <button type="button" class="vn-btn" id="vnResetCrop">Reset</button>
        </div>
      </div>
    `, {});

    loadItems.then(() => {
      const pick = overlay.querySelector("#vnMediaPick");
      pick.innerHTML = items.map(m => `<div data-url="${m.url}" data-type="${m.type}">${
        m.type === "video" ? `<video src="${m.url}" muted></video>` : `<img src="${m.url}">`
      }</div>`).join("") || '<p style="font-size:.8rem; grid-column:1/-1;">Nothing uploaded yet — use the box below.</p>';
      pick.querySelectorAll("div[data-url]").forEach(div => {
        div.onclick = () => showStep2({ url: div.dataset.url, type: div.dataset.type });
      });
    });

    let pending = null; // { url, type }
    let posX = 50, posY = 50, zoom = 1;
    let heightOverride = null; // set only if the resize handle gets dragged

    // A reference width to translate the modal's (narrower) frame into
    // the real site's proportions when resizeUnit is "px" or "ratio" —
    // both of those are meant to describe the destination's ACTUAL
    // size/shape, not the modal's. "vh" doesn't need this since it's
    // viewport-relative regardless of any element's width.
    function frameHeightFromOverride(frame, override) {
      if (!override) return aspectRatio ? frame.clientWidth / aspectRatio : frame.clientWidth * (9 / 16);
      if (resizeUnit === "vh") return (parseFloat(override) / 100) * window.innerHeight;
      if (resizeUnit === "px") return parseFloat(override);
      if (resizeUnit === "ratio") return frame.clientWidth / parseFloat(override);
      return frame.clientWidth * (9 / 16);
    }

    function showStep2(media) {
      pending = media;
      const parsed = media.position && /(\d+(\.\d+)?)% (\d+(\.\d+)?)%/.exec(media.position);
      posX = parsed ? +parsed[1] : 50;
      posY = parsed ? +parsed[3] : 50;
      zoom = media.zoom || 1;
      heightOverride = media.heightOverride || null;

      overlay.querySelector("#vnStep1").style.display = "none";
      overlay.querySelector("#vnStep2").style.display = "block";

      const frame = overlay.querySelector("#vnCropFrame");
      frame.innerHTML = media.type === "video"
        ? `<video src="${media.url}" muted loop autoplay playsinline></video>`
        : `<img src="${media.url}" draggable="false">`;

      if (resizable) {
        frame.style.aspectRatio = "";
        frame.style.height = frameHeightFromOverride(frame, heightOverride) + "px";
        const handle = overlay.querySelector("#vnResizeHandle");
        if (handle && !handle.dataset.wired) {
          wireResizeHandle(frame, handle);
          handle.dataset.wired = "1";
        }
      } else if (aspectRatio) {
        frame.style.aspectRatio = `${aspectRatio}`;
      }

      renderTransform();
      wireCropInteraction(frame);
    }

    function wireResizeHandle(frame, handle) {
      let resizing = false, startY = 0, startHeight = 0;
      const MIN_H = 100, MAX_H = 640;
      const onDown = (clientY) => { resizing = true; startY = clientY; startHeight = frame.getBoundingClientRect().height; };
      const onMove = (clientY) => {
        if (!resizing) return;
        const newHeight = Math.min(MAX_H, Math.max(MIN_H, startHeight + (clientY - startY)));
        frame.style.height = newHeight + "px";
      };
      const onUp = () => {
        if (!resizing) return;
        resizing = false;
        const h = frame.getBoundingClientRect().height;
        if (resizeUnit === "vh") heightOverride = ((h / window.innerHeight) * 100).toFixed(1) + "vh";
        else if (resizeUnit === "px") heightOverride = Math.round(h) + "px";
        else if (resizeUnit === "ratio") heightOverride = (frame.clientWidth / h).toFixed(4);
      };
      handle.addEventListener("mousedown", e => { e.preventDefault(); e.stopPropagation(); onDown(e.clientY); });
      window.addEventListener("mousemove", e => onMove(e.clientY));
      window.addEventListener("mouseup", onUp);
      handle.addEventListener("touchstart", e => { e.stopPropagation(); onDown(e.touches[0].clientY); }, { passive: true });
      handle.addEventListener("touchmove", e => onMove(e.touches[0].clientY), { passive: true });
      handle.addEventListener("touchend", onUp);
    }

    function renderTransform() {
      const media = overlay.querySelector("#vnCropFrame img, #vnCropFrame video");
      if (!media) return;
      media.style.objectPosition = `${posX}% ${posY}%`;
      media.style.transform = zoom !== 1 ? `scale(${zoom})` : "";
      media.style.transformOrigin = `${posX}% ${posY}%`;
      overlay.querySelector("#vnZoomSlider").value = Math.round(zoom * 100);
    }

    function setZoom(newZoom) {
      zoom = Math.min(3, Math.max(1, newZoom));
      renderTransform();
    }

    function wireCropInteraction(frame) {
      let dragging = false, lastX = 0, lastY = 0;
      const onDown = (clientX, clientY) => { dragging = true; lastX = clientX; lastY = clientY; frame.classList.add("dragging"); };
      const onMove = (clientX, clientY) => {
        if (!dragging) return;
        const rect = frame.getBoundingClientRect();
        const dxPct = ((clientX - lastX) / rect.width) * 100 / zoom;
        const dyPct = ((clientY - lastY) / rect.height) * 100 / zoom;
        posX = Math.min(100, Math.max(0, posX - dxPct));
        posY = Math.min(100, Math.max(0, posY - dyPct));
        lastX = clientX; lastY = clientY;
        renderTransform();
      };
      const onUp = () => { dragging = false; frame.classList.remove("dragging"); };

      frame.addEventListener("mousedown", e => { if (e.target.closest(".vn-resize-handle")) return; e.preventDefault(); onDown(e.clientX, e.clientY); });
      window.addEventListener("mousemove", e => onMove(e.clientX, e.clientY));
      window.addEventListener("mouseup", onUp);
      frame.addEventListener("touchstart", e => { if (e.target.closest(".vn-resize-handle")) return; const t = e.touches[0]; onDown(t.clientX, t.clientY); }, { passive: true });
      frame.addEventListener("touchmove", e => { const t = e.touches[0]; onMove(t.clientX, t.clientY); }, { passive: true });
      frame.addEventListener("touchend", onUp);
      frame.addEventListener("wheel", e => { e.preventDefault(); setZoom(zoom - e.deltaY * 0.0015); }, { passive: false });
    }

    overlay.querySelector("#vnZoomIn").onclick = () => setZoom(zoom + 0.2);
    overlay.querySelector("#vnZoomOut").onclick = () => setZoom(zoom - 0.2);
    overlay.querySelector("#vnZoomSlider").addEventListener("input", e => setZoom(e.target.value / 100));
    overlay.querySelector("#vnResetCrop").onclick = () => {
      posX = 50; posY = 50; zoom = 1;
      if (resizable) {
        heightOverride = null;
        const frame = overlay.querySelector("#vnCropFrame");
        frame.style.height = frameHeightFromOverride(frame, null) + "px";
      }
      renderTransform();
    };

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

    overlay.querySelector("#vnCancelStep2")?.addEventListener("click", () => {
      overlay.querySelector("#vnStep1").style.display = "block";
      overlay.querySelector("#vnStep2").style.display = "none";
    });

    overlay.querySelector("#vnSaveImage").onclick = () => {
      onSave({ url: pending.url, type: pending.type, position: `${posX}% ${posY}%`, zoom, ...(resizable ? { heightOverride } : {}) });
      close();
    };

    // Editing an existing photo's framing — skip straight to the crop step.
    if (existingMedia) showStep2(existingMedia);
  }

  /* Which spots get the height-resize handle, and what unit their
     underlying CSS actually uses — see openPickCropModal's "resizable"
     option for why width is never adjustable here (it's always fixed
     by the surrounding layout) and why product photos / category
     tiles are deliberately absent (a grid needs every item the same
     shape, or it looks broken — this is only for one-off spots). */
  const RESIZE_CONFIG = {
    hero_home: "vh", hero_maison: "vh",
    home_editorial_1: "px", home_editorial_2: "px",
    maison_editorial_1: "px", maison_editorial_2: "px",
    mega_feature_jewelry: "ratio", mega_feature_maison: "ratio"
  };

  /* Every [data-editable-image] spot (hero banners, editorial photos,
     mega-menu features) uses the shared modal above, matching its own
     live aspect ratio and saving straight to Settings. */
  async function openImageEditor(el) {
    const key = el.dataset.editableImage;
    const rect = el.getBoundingClientRect();
    let existingMedia = null;
    try { existingMedia = (await adminApi("/settings"))[key] || null; } catch {}

    openPickCropModal({
      aspectRatio: rect.width && rect.height ? rect.width / rect.height : 16 / 9,
      existingMedia,
      resizable: !!RESIZE_CONFIG[key],
      resizeUnit: RESIZE_CONFIG[key],
      onSave: async (media) => {
        try {
          await adminApi("/settings", { method: "PUT", body: JSON.stringify({ [key]: media }) });
          window.vennusApplyEditableImage(el, media);
        } catch (err) { alert(err.message); }
      }
    });
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
     PRODUCT PHOTOS — inline add/remove/reorder/reframe, right on the
     site. Each photo carries its own crop (position + zoom), and can
     be a photo or a video.
     ================================================================= */
  const PRODUCT_ASPECT = 4 / 5; // matches .product-media / .product-gallery-main

  function mediaStyleAttr(m) {
    const zoomPart = m.zoom && m.zoom !== 1 ? ` transform:scale(${m.zoom}); transform-origin:${m.position || "center center"};` : "";
    return `object-fit:cover; object-position:${m.position || "center center"};${zoomPart}`;
  }

  async function openProductPhotoEditor(productId, mediaEl) {
    let product;
    try { product = await adminApi("/products/" + productId); }
    catch (err) { return alert(err.message); }

    let items = [];
    try { items = await adminApi("/media"); } catch {}

    // Photos may still be plain URL strings from before per-photo framing
    // existed — normalize those to the same shape as everything else.
    let photos = (product.images || []).map(p => typeof p === "string" ? { url: p, type: "image", position: "center center", zoom: 1 } : p);

    const { overlay, close } = openModal(`
      <h3>${product.name}</h3>
      <p class="hint">Add, remove, or reframe this product's photos and videos. Click a thumbnail's "Crop" button to adjust how it's framed.</p>
      <div class="vn-photo-list" id="vnPhotoList"></div>
      <div class="vn-media-pick" id="vnLibraryPick">
        ${items.map(m => `<div data-url="${m.url}" data-type="${m.type}">${
          m.type === "video" ? `<video src="${m.url}" muted></video>` : `<img src="${m.url}">`
        }</div>`).join("") || '<p style="font-size:.8rem; grid-column:1/-1;">Nothing in your library yet.</p>'}
      </div>
      <div class="vn-dropzone" id="vnDrop">Drag photos or video here, or
        <label style="text-decoration:underline; cursor:pointer;">choose files<input type="file" id="vnFile" accept="image/*,video/*" multiple style="display:none;"></label>
      </div>
      <div class="row">
        <button type="button" class="vn-btn primary" id="vnSavePhotos">Save changes</button>
        <a class="vn-btn" style="text-decoration:none; display:inline-block;" href="${VENNUS_API}/admin/#product-${productId}" target="_blank" rel="noopener">Edit full details ↗</a>
      </div>
    `, { wide: true });

    function renderList() {
      overlay.querySelector("#vnPhotoList").innerHTML = photos.map((m, i) => `
        <div class="item" data-i="${i}">
          ${m.type === "video"
            ? `<video src="${m.url}" muted style="${mediaStyleAttr(m)}"></video>`
            : `<img src="${m.url}" style="${mediaStyleAttr(m)}">`}
          <button type="button" data-rm="${i}" title="Remove">×</button>
        </div>`).join("")
        || '<p style="font-size:.8rem;">No photos yet — add one below.</p>';

      overlay.querySelectorAll("[data-rm]").forEach(b => {
        b.onclick = () => { photos.splice(+b.dataset.rm, 1); renderList(); };
      });
      // A "Crop" button per thumbnail, added after the list so it doesn't
      // fight the innerHTML render above for its click handler.
      overlay.querySelectorAll(".vn-photo-list .item").forEach(item => {
        const i = +item.dataset.i;
        const cropBtn = document.createElement("button");
        cropBtn.type = "button";
        cropBtn.textContent = "Crop";
        cropBtn.style.cssText = "position:absolute; bottom:3px; left:3px; font-size:.62rem; padding:2px 6px; background:rgba(35,26,18,.8); color:#fff; border:none; cursor:pointer;";
        cropBtn.onclick = () => openPickCropModal({
          aspectRatio: PRODUCT_ASPECT,
          existingMedia: photos[i],
          onSave: (media) => { photos[i] = media; renderList(); }
        });
        item.appendChild(cropBtn);
      });
    }
    renderList();

    overlay.querySelectorAll("#vnLibraryPick div[data-url]").forEach(div => {
      div.onclick = () => openPickCropModal({
        aspectRatio: PRODUCT_ASPECT,
        existingMedia: { url: div.dataset.url, type: div.dataset.type },
        onSave: (media) => { photos.push(media); renderList(); }
      });
    });

    async function handleFiles(files) {
      if (!files.length) return;
      const fd = new FormData();
      [...files].forEach(f => fd.append("files", f));
      try {
        const r = await adminApi("/media", { method: "POST", body: fd });
        // Frame each newly uploaded file in turn.
        const queue = r.files.slice();
        const next = () => {
          const f = queue.shift();
          if (!f) return;
          openPickCropModal({
            aspectRatio: PRODUCT_ASPECT,
            existingMedia: { url: f.url, type: f.type },
            onSave: (media) => { photos.push(media); renderList(); next(); }
          });
        };
        next();
      } catch (err) { alert(err.message); }
    }
    overlay.querySelector("#vnFile").addEventListener("change", e => handleFiles(e.target.files));
    wireDropzone(overlay.querySelector("#vnDrop"), handleFiles);

    overlay.querySelector("#vnSavePhotos").onclick = async () => {
      try {
        await adminApi("/products/" + productId, { method: "PUT", body: JSON.stringify({ images: photos }) });
        // Reflect immediately on this page without needing a reload
        if (mediaEl && photos.length) {
          const existing = mediaEl.querySelector("img, video, .placeholder-block");
          const m = photos[0];
          if (existing) existing.outerHTML = m.type === "video"
            ? `<video autoplay muted loop playsinline style="position:absolute; inset:0; width:100%; height:100%; ${mediaStyleAttr(m)}"><source src="${m.url}"></video>`
            : `<img src="${m.url}" alt="" loading="lazy" style="position:absolute; inset:0; width:100%; height:100%; ${mediaStyleAttr(m)}">`;
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
