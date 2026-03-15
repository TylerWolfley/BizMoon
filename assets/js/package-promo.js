(function () {
  const promo = window.BIZMOON_PROMO;
  if (!promo) return;

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

  const elements = document.querySelectorAll('[data-price-type="package"]');

  elements.forEach((el) => {
    const basePrice = parseFloat(el.getAttribute("data-base-price"));
    if (isNaN(basePrice)) return;

    if (promo.active) {
      const rawSale = basePrice * (1 - promo.percentOff / 100);
      const salePrice = Math.round(rawSale * 100) / 100;
      el.innerHTML =
        '<span class="price-stack">' +
          '<span class="promo-badge">' + promo.label + "</span>" +
          '<span class="price-original">' + fmtFull.format(basePrice) + "</span>" +
          '<strong class="price-sale">' + fmtSale.format(salePrice) + "</strong>" +
        "</span>";
    } else {
      el.textContent = fmtFull.format(basePrice);
    }
  });
}());
