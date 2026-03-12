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
