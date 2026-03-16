/**
 * admin.js — BizMoon admin control panel
 *
 * Flow:
 *  1. On load: call /admin-session to check if the owner is logged in.
 *  2. If logged in: fetch current promo state and show the control panel.
 *  3. If not logged in: show the login form.
 *  4. Login: POST password to /admin-login → sets HttpOnly session cookie.
 *  5. Save changes: POST promo fields to /admin-update-promo (cookie sent automatically).
 *  6. Logout: POST to /admin-logout → clears the cookie.
 */

(function () {
  "use strict";

  // ── Base prices for the live preview (must match the HTML data-base-price values)
  const PACKAGES = [
    { key: "starter", label: "Starter", base: 999 },
    { key: "launch", label: "Launch", base: 1499 },
    { key: "moonshot", label: "Moonshot", base: 2499 },
  ];

  const fmtFull = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const fmtSale = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // ── Element references
  var loadingEl = document.getElementById("admin-loading");
  var loginSection = document.getElementById("admin-login-section");
  var panelSection = document.getElementById("admin-panel-section");
  var logoutBtn = document.getElementById("admin-logout-btn");

  var loginForm = document.getElementById("admin-login-form");
  var passwordInput = document.getElementById("admin-password-input");
  var loginBtn = document.getElementById("admin-login-btn");
  var loginError = document.getElementById("admin-login-error");

  var promoForm = document.getElementById("admin-promo-form");
  var activeToggle = document.getElementById("admin-active-toggle");
  var percentInput = document.getElementById("admin-percent-input");
  var labelInput = document.getElementById("admin-label-input");
  var saveBtn = document.getElementById("admin-save-btn");
  var promoError = document.getElementById("admin-promo-error");
  var promoSuccess = document.getElementById("admin-promo-success");

  var statusBadge = document.getElementById("admin-status-badge");
  var statusDetail = document.getElementById("admin-status-detail");
  var previewList = document.getElementById("admin-preview-list");

  // ── UI state helpers

  function showLoading() {
    loadingEl.hidden = false;
    loginSection.hidden = true;
    panelSection.hidden = true;
    logoutBtn.hidden = true;
  }

  function showLoginPanel() {
    loadingEl.hidden = true;
    loginSection.hidden = false;
    panelSection.hidden = true;
    logoutBtn.hidden = true;
    passwordInput.focus();
  }

  function showAdminPanel() {
    loadingEl.hidden = true;
    loginSection.hidden = true;
    panelSection.hidden = false;
    logoutBtn.hidden = false;
  }

  function showError(el, message) {
    el.textContent = message;
    el.hidden = false;
  }

  function clearFeedback() {
    promoError.hidden = true;
    promoSuccess.hidden = true;
    promoError.textContent = "";
    promoSuccess.textContent = "";
  }

  // ── Price preview

  function updatePreview() {
    var isActive = activeToggle.checked;
    var pct = parseFloat(percentInput.value);
    var previewSpans = previewList.querySelectorAll("span");

    PACKAGES.forEach(function (pkg, i) {
      var span = previewSpans[i];
      if (!span) return;
      if (isActive && !isNaN(pct) && pct >= 1 && pct <= 99) {
        var sale = Math.round(pkg.base * (1 - pct / 100) * 100) / 100;
        span.textContent = fmtFull.format(pkg.base) + " \u2192 " + fmtSale.format(sale);
      } else {
        span.textContent = fmtFull.format(pkg.base);
      }
    });
  }

  // ── Promo status display

  function updateStatusDisplay(promo) {
    var active = promo && promo.active;
    statusBadge.textContent = active ? "Active" : "Inactive";
    statusBadge.setAttribute("data-active", active ? "true" : "false");
    statusDetail.textContent = active
      ? (promo.percentOff + "% off \u2014 \u201C" + promo.label + "\u201D")
      : "No sale running";
  }

  // ── Populate form from promo config

  function populateForm(promo) {
    if (!promo) return;
    activeToggle.checked = Boolean(promo.active);
    activeToggle.setAttribute("aria-checked", String(Boolean(promo.active)));
    percentInput.value = promo.percentOff != null ? promo.percentOff : 50;
    labelInput.value = promo.label || "50% off";
    updateStatusDisplay(promo);
    updatePreview();
  }

  // ── API calls

  function checkSession() {
    showLoading();
    fetch("/.netlify/functions/admin-session")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.loggedIn) {
          return loadPromoState().then(function () {
            showAdminPanel();
          });
        } else {
          showLoginPanel();
        }
      })
      .catch(function () {
        // Network error — show login form as a safe fallback
        showLoginPanel();
      });
  }

  function loadPromoState() {
    return fetch("/.netlify/functions/promo-state")
      .then(function (res) { return res.json(); })
      .then(function (promo) {
        populateForm(promo);
      })
      .catch(function () {
        // Non-fatal — form will show defaults
      });
  }

  // ── Login form

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginError.hidden = true;
    loginError.textContent = "";

    var password = passwordInput.value;
    if (!password) {
      showError(loginError, "Please enter your password.");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in\u2026";

    fetch("/.netlify/functions/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: password }),
    })
      .then(function (res) {
        if (res.ok) return res.json();
        return res.json().then(function (body) {
          throw new Error(body.error || "Login failed");
        });
      })
      .then(function () {
        passwordInput.value = "";
        return loadPromoState();
      })
      .then(function () {
        showAdminPanel();
      })
      .catch(function (err) {
        showError(loginError, err.message || "Login failed. Check your password.");
      })
      .finally(function () {
        loginBtn.disabled = false;
        loginBtn.textContent = "Log in";
      });
  });

  // ── Promo form — live preview on change

  activeToggle.addEventListener("change", function () {
    activeToggle.setAttribute("aria-checked", String(activeToggle.checked));
    updatePreview();
  });

  percentInput.addEventListener("input", updatePreview);
  labelInput.addEventListener("input", updatePreview);

  // ── Promo form — save

  promoForm.addEventListener("submit", function (e) {
    e.preventDefault();
    clearFeedback();

    var active = activeToggle.checked;
    var percentOff = parseFloat(percentInput.value);
    var label = labelInput.value.trim();

    if (isNaN(percentOff) || percentOff < 1 || percentOff > 99) {
      showError(promoError, "Discount must be a number between 1 and 99.");
      return;
    }
    if (!label) {
      showError(promoError, "Promo label is required.");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving\u2026";

    fetch("/.netlify/functions/admin-update-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: active, percentOff: percentOff, label: label }),
    })
      .then(function (res) {
        if (res.ok) return res.json();
        return res.json().then(function (body) {
          throw new Error(body.error || "Save failed");
        });
      })
      .then(function (data) {
        updateStatusDisplay(data.promo);
        promoSuccess.textContent = active
          ? "Sale is now live for all visitors."
          : "Sale has been turned off.";
        promoSuccess.hidden = false;
      })
      .catch(function (err) {
        if (err.message && err.message.toLowerCase().includes("unauthorized")) {
          // Session expired — go back to login
          showLoginPanel();
          return;
        }
        showError(promoError, err.message || "Failed to save. Please try again.");
      })
      .finally(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = "Save changes";
      });
  });

  // ── Logout

  logoutBtn.addEventListener("click", function () {
    logoutBtn.disabled = true;
    fetch("/.netlify/functions/admin-logout", { method: "POST" })
      .then(function () {
        showLoginPanel();
      })
      .catch(function () {
        showLoginPanel();
      })
      .finally(function () {
        logoutBtn.disabled = false;
      });
  });

  // ── Init

  checkSession();
}());
