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
     MEGA MENU DROPDOWNS
     --------------------------------------------------------------- */
  const dropdownItems = document.querySelectorAll(".primary-nav li.has-dropdown");

  function closeAllDropdowns() {
    dropdownItems.forEach(li => {
      li.classList.remove("open");
      li.querySelector(".nav-link")?.setAttribute("aria-expanded", "false");
    });
  }

  dropdownItems.forEach(li => {
    const trigger = li.querySelector(".nav-link");
    li.addEventListener("mouseenter", () => {
      closeAllDropdowns();
      li.classList.add("open");
      trigger?.setAttribute("aria-expanded", "true");
    });
    li.addEventListener("mouseleave", () => {
      li.classList.remove("open");
      trigger?.setAttribute("aria-expanded", "false");
    });
    trigger?.addEventListener("click", (e) => {
      if (trigger.getAttribute("aria-haspopup") !== "true") return;
      e.preventDefault();
      const isOpen = li.classList.contains("open");
      closeAllDropdowns();
      if (!isOpen) { li.classList.add("open"); trigger.setAttribute("aria-expanded", "true"); }
    });
  });

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeAllDropdowns(); });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".primary-nav")) closeAllDropdowns();
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
      panel?.classList.toggle("open");
    });
  });

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
  const productCards = document.querySelectorAll(".product-card");
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      const cat = chip.dataset.filter;
      productCards.forEach(card => {
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
