/* =================================================================
   VENNUS JEWELRY — Site Interactivity
   -----------------------------------------------------------------
   Shared across every page: mega-menu dropdowns, mobile menu,
   search overlay, cookie consent banner + settings modal, plus a
   few small guarded widgets (accordion, filters, login tabs) that
   only activate on the pages that contain them.
   ================================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* Auto-fill the copyright year in the footer */
  const yearEl = document.getElementById("copyrightYear");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------
     TRANSPARENT HEADER OVER THE HERO
     Measures the real header height (so the hero can be pulled up
     behind it by exactly the right amount, at any screen size) and
     fades the bar to solid once the page is scrolled.
     --------------------------------------------------------------- */
  const siteHeader = document.querySelector(".site-header");

  function syncHeaderHeight() {
    if (!siteHeader) return;
    document.documentElement.style.setProperty("--header-h", siteHeader.offsetHeight + "px");
  }
  syncHeaderHeight();
  window.addEventListener("resize", syncHeaderHeight);

  function syncHeaderSolid() {
    if (!siteHeader) return;
    siteHeader.classList.toggle("is-solid", window.scrollY > 40);
  }
  syncHeaderSolid();
  window.addEventListener("scroll", syncHeaderSolid, { passive: true });

  /* ---------------------------------------------------------------
     MEGA MENU DROPDOWNS (Hermès-style behaviour)
     The panel is flush against the bottom of the header, so moving
     the pointer down into it never crosses a gap. On top of that:
       - Clicking a category opens the panel and PINS it open, so it
         stays put while you read and click a link inside.
       - Hovering opens it too, with a short grace period before it
         closes, so a wobbly mouse path doesn't dismiss it.
       - It closes on Escape, on a click outside the header, or when
         you open a different category.
     --------------------------------------------------------------- */
  const dropdownItems = document.querySelectorAll(".primary-nav li.has-dropdown");
  let pinnedItem = null;
  let closeTimer = null;

  function closeAllDropdowns() {
    clearTimeout(closeTimer);
    pinnedItem = null;
    dropdownItems.forEach(li => {
      li.classList.remove("open");
      li.querySelector(".nav-link")?.setAttribute("aria-expanded", "false");
    });
    /* Let the bar go back to transparent over the hero */
    siteHeader?.classList.remove("menu-open");
  }

  function openItem(li) {
    clearTimeout(closeTimer);
    dropdownItems.forEach(other => {
      if (other !== li) {
        other.classList.remove("open");
        other.querySelector(".nav-link")?.setAttribute("aria-expanded", "false");
      }
    });
    li.classList.add("open");
    li.querySelector(".nav-link")?.setAttribute("aria-expanded", "true");
    /* A see-through bar above an open panel looks broken, so make it solid */
    siteHeader?.classList.add("menu-open");
  }

  dropdownItems.forEach(li => {
    const trigger = li.querySelector(".nav-link");
    const panel = li.querySelector(".mega-menu");

    /* Click = open and pin. Clicking the same category again closes it. */
    trigger?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (pinnedItem === li && li.classList.contains("open")) {
        closeAllDropdowns();
      } else {
        openItem(li);
        pinnedItem = li;
      }
    });

    /* Hover opens as well, but never un-pins a click-opened panel. */
    li.addEventListener("mouseenter", () => {
      clearTimeout(closeTimer);
      if (!pinnedItem) openItem(li);
    });
    li.addEventListener("mouseleave", () => {
      if (pinnedItem === li) return;   // pinned open by a click — leave it
      clearTimeout(closeTimer);
      closeTimer = setTimeout(() => {
        li.classList.remove("open");
        trigger?.setAttribute("aria-expanded", "false");
        if (!document.querySelector(".primary-nav li.has-dropdown.open")) {
          siteHeader?.classList.remove("menu-open");
        }
      }, 260);
    });

    /* Clicks inside the panel must not bubble up to the
       close-on-click-outside handler before the link navigates. */
    panel?.addEventListener("click", (e) => e.stopPropagation());
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllDropdowns(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".site-header")) closeAllDropdowns();
  });

  /* ---------------------------------------------------------------
     MOBILE MENU
     --------------------------------------------------------------- */
  const mobileMenu = document.getElementById("mobileMenu");
  document.querySelectorAll("[data-mobile-open]").forEach(el =>
    el.addEventListener("click", () => {
      mobileMenu?.classList.add("open");
      document.body.style.overflow = "hidden";
    })
  );
  document.querySelectorAll("[data-mobile-close]").forEach(el =>
    el.addEventListener("click", () => {
      mobileMenu?.classList.remove("open");
      document.body.style.overflow = "";
    })
  );

  /* Mobile accordion for category groups with children */
  document.querySelectorAll(".mobile-menu [data-mobile-toggle]").forEach(btn => {
    btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.dataset.mobileToggle);
      const isOpen = panel?.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  /* ---------------------------------------------------------------
     FOOTER ACCORDION (mobile only — see the media query in
     style.css; toggling this class has no visual effect above that
     width, so this handler doesn't need its own width check)
     --------------------------------------------------------------- */
  document.querySelectorAll(".footer-col > h5").forEach(h5 => {
    h5.addEventListener("click", () => {
      const col = h5.closest(".footer-col");
      const wasOpen = col.classList.contains("open");
      col.parentElement.querySelectorAll(".footer-col").forEach(c => c.classList.remove("open"));
      if (!wasOpen) col.classList.add("open");
    });
  });

  /* ---------------------------------------------------------------
     PDP MOBILE STICKY ADD-TO-BAG BAR
     Mirrors the name/price once, then shows itself once the real
     "Add to Bag" button (in .qty-and-cart, populated by render.js)
     scrolls out of view. Clicking it just clicks the real button,
     so quantity/option/waitlist logic stays defined in one place.
     --------------------------------------------------------------- */
  const pdpStickyBar = document.getElementById("pdpStickyBar");
  const pdpRealAddBtn = document.getElementById("pdpAddToBag");
  if (pdpStickyBar && pdpRealAddBtn) {
    const stickyName = document.getElementById("pdpStickyName");
    const stickyPrice = document.getElementById("pdpStickyPrice");
    const syncText = () => {
      if (stickyName) stickyName.textContent = document.getElementById("pdpName")?.textContent || "";
      if (stickyPrice) stickyPrice.textContent = document.getElementById("pdpPrice")?.textContent || "";
      if (document.getElementById("pdpStickyAddToBag")) {
        document.getElementById("pdpStickyAddToBag").textContent = pdpRealAddBtn.textContent;
      }
    };
    syncText();
    // The real button's label can change (e.g. to "Notify Me") once
    // stock is known; keep the sticky copy in sync with it.
    new MutationObserver(syncText).observe(pdpRealAddBtn, { childList: true, characterData: true, subtree: true });

    new IntersectionObserver(([entry]) => {
      pdpStickyBar.classList.toggle("show", !entry.isIntersecting);
    }, { rootMargin: "0px 0px -20% 0px" }).observe(pdpRealAddBtn);

    document.getElementById("pdpStickyAddToBag")?.addEventListener("click", () => pdpRealAddBtn.click());
  }

  /* ---------------------------------------------------------------
     SEARCH OVERLAY
     --------------------------------------------------------------- */
  const searchOverlay = document.getElementById("searchOverlay");
  const searchInput = document.getElementById("searchInput");
  document.querySelectorAll("[data-search-open]").forEach(el =>
    el.addEventListener("click", () => {
      searchOverlay?.classList.add("open");
      setTimeout(() => searchInput?.focus(), 150);
    })
  );
  document.querySelectorAll("[data-search-close]").forEach(el =>
    el.addEventListener("click", () => searchOverlay?.classList.remove("open"))
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") searchOverlay?.classList.remove("open");
  });

  const searchForm = document.getElementById("searchForm");
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const term = searchInput.value.trim();
    if (term) window.location.href = "shop.html?q=" + encodeURIComponent(term);
  });

  /* ---------------------------------------------------------------
     COOKIE CONSENT — banner + settings modal
     (modeled after a standard "accept / decline / customize" pattern)
     --------------------------------------------------------------- */
  const COOKIE_KEY = "vennus_cookie_consent";
  const cookieBanner = document.getElementById("cookieBanner");
  const cookieModal = document.getElementById("cookieModalBackdrop");

  function readConsent() {
    try {
      const raw = window.localStorage.getItem(COOKIE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }
  function writeConsent(consent) {
    try { window.localStorage.setItem(COOKIE_KEY, JSON.stringify(consent)); } catch (e) {}
  }

  const existingConsent = readConsent();
  if (!existingConsent && cookieBanner) {
    setTimeout(() => cookieBanner.classList.add("show"), 500);
  }

  document.getElementById("cookieAccept")?.addEventListener("click", () => {
    writeConsent({ necessary: true, analytics: true, marketing: true, functional: true, date: Date.now() });
    cookieBanner?.classList.remove("show");
  });

  document.getElementById("cookieDecline")?.addEventListener("click", () => {
    writeConsent({ necessary: true, analytics: false, marketing: false, functional: false, date: Date.now() });
    cookieBanner?.classList.remove("show");
  });

  document.querySelectorAll("[data-cookie-settings]").forEach(el =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      cookieModal?.classList.add("open");
    })
  );
  document.querySelectorAll("[data-modal-close]").forEach(el =>
    el.addEventListener("click", () => cookieModal?.classList.remove("open"))
  );

  document.getElementById("cookieSavePrefs")?.addEventListener("click", () => {
    writeConsent({
      necessary: true,
      analytics: document.getElementById("toggleAnalytics")?.checked ?? false,
      marketing: document.getElementById("toggleMarketing")?.checked ?? false,
      functional: document.getElementById("toggleFunctional")?.checked ?? false,
      date: Date.now()
    });
    cookieModal?.classList.remove("open");
    cookieBanner?.classList.remove("show");
  });

  /* ---------------------------------------------------------------
     NEWSLETTER FORM (front-end only — connect to your ESP)
     --------------------------------------------------------------- */
  document.getElementById("newsletterForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("newsletterForm").style.display = "none";
    const success = document.getElementById("newsletterSuccess");
    if (success) success.style.display = "block";
  });

  /* ---------------------------------------------------------------
     ACCORDION (product detail page — "Details", "Materials & Care", etc.)
     --------------------------------------------------------------- */
  document.querySelectorAll(".accordion-item").forEach(item => {
    const trigger = item.querySelector(".accordion-trigger");
    trigger?.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".accordion-item").forEach(i => i.classList.remove("open"));
      if (!isOpen) item.classList.add("open");
    });
  });

  /* ---------------------------------------------------------------
     SHOP FILTER CHIPS
     --------------------------------------------------------------- */
  const filterChips = document.querySelectorAll(".filter-chip");
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const cat = chip.dataset.filter;
      // Queried fresh here, not captured once at setup — the grid renders
      // asynchronously (after the live catalogue loads), so a snapshot
      // taken at page-load time would always be empty.
      document.querySelectorAll(".product-card").forEach(card => {
        card.style.display = (cat === "all" || card.dataset.category === cat) ? "" : "none";
      });
    });
  });

  /* ---------------------------------------------------------------
     LOGIN / ACCOUNT PAGE TABS
     --------------------------------------------------------------- */
  const authTabs = document.querySelectorAll(".auth-tab");
  authTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      authTabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".auth-panel").forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab)?.classList.add("active");
    });
  });

  document.querySelectorAll(".auth-panel form").forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = form.querySelector(".form-success");
      if (note) note.classList.add("show");
    });
  });

});
