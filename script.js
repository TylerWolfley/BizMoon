const yearTarget = document.querySelector("#year");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  const closeNav = () => {
    siteNav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeNav();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
    }
  });

  document.addEventListener("click", (event) => {
    if (!siteNav.contains(event.target) && !navToggle.contains(event.target)) {
      closeNav();
    }
  });
}

// Dropdown menus
document.querySelectorAll(".nav-dropdown-toggle").forEach((toggle) => {
  const menu = toggle.nextElementSibling;

  const closeDropdown = () => {
    toggle.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));

    // Close other open dropdowns
    document.querySelectorAll(".nav-dropdown-menu.is-open").forEach((m) => {
      if (m !== menu) {
        m.classList.remove("is-open");
        m.previousElementSibling.setAttribute("aria-expanded", "false");
      }
    });
  });

  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDropdown();
    }
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDropdown();
        toggle.focus();
      }
    });
  });
});

// Close all dropdowns when clicking outside
document.addEventListener("click", () => {
  document.querySelectorAll(".nav-dropdown-menu.is-open").forEach((m) => {
    m.classList.remove("is-open");
    m.previousElementSibling.setAttribute("aria-expanded", "false");
  });
});

// ── Free Launch Snapshot form (Formspree, progressive enhancement) ──
// Intercepts the form submit, sends via fetch, and shows inline success/error.
// Falls back to a standard POST if JavaScript is unavailable.
(function () {
  var form = document.getElementById("launch-snapshot-form");
  if (!form) return;

  var successEl = document.getElementById("form-success");
  var errorEl = document.getElementById("form-error");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var submitBtn = form.querySelector(".snapshot-submit");
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending\u2026";

    fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          submitBtn.hidden = true;
          if (errorEl) errorEl.hidden = true;
          if (successEl) {
            successEl.hidden = false;
            successEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        } else {
          return response.json().then(function (json) {
            throw new Error(json.error || "Submission failed");
          });
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Request my free Launch Snapshot";
        if (errorEl) errorEl.hidden = false;
      });
  });
})();

// ── Scroll-reveal (progressive enhancement) ──
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var revealSelector = [
    '.value-grid.four-up article',
    '.setup-grid article',
    '.package-card',
    '.trust-grid article',
    '.faq-list article',
    '.addon-card',
    '.deliverable-card',
    '.output-preview',
    '.orbit-step',
    '.featured-launch-band',
    '.cta-strip',
  ].join(', ');

  var els = document.querySelectorAll(revealSelector);
  if (!els.length) return;

  // Stagger delays only for elements that are part of the reveal set
  var elsSet = new Set(els);
  document.querySelectorAll('.value-grid, .setup-grid, .package-grid, .addon-card-grid, .deliverable-grid, .orbit-plan-grid').forEach(function (grid) {
    grid.querySelectorAll('article, .package-card, .addon-card, .deliverable-card').forEach(function (card, i) {
      if (elsSet.has(card)) {
        card.style.transitionDelay = (i * 0.07) + 's';
      }
    });
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // Clear the stagger delay after the transform transition completes
        // so subsequent hover transitions are instant
        var target = entry.target;
        function onRevealEnd(e) {
          if (e.propertyName === 'transform') {
            target.style.transitionDelay = '';
            target.removeEventListener('transitionend', onRevealEnd);
          }
        }
        target.addEventListener('transitionend', onRevealEnd);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -24px 0px' });

  els.forEach(function (el) {
    el.classList.add('reveal');
    observer.observe(el);
  });
})();
