document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://open.er-api.com/v6/latest";

  const amountInput = document.getElementById("amount");
  const fromInput = document.getElementById("fromCurrency");
  const toInput = document.getElementById("toCurrency");
  const resultEl = document.getElementById("resultValue");
  const rateEl = document.getElementById("rateLine");
  const swapBtn = document.getElementById("swapBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const clearBtn = document.getElementById("clearBtn");
  const copyBtn = document.getElementById("copyBtn");
  const datalist = document.getElementById("currencyList");

  let base = "USD";
  let rates = {};

  const code = (v) => (v || "").trim().toUpperCase();

  async function fetchRates(newBase = "USD") {
    base = code(newBase);
    refreshBtn.disabled = true;

    const res = await fetch(`${API_URL}/${base}`);
    const data = await res.json();

    rates = data.rates || {};
    datalist.innerHTML = "";

    Object.keys(rates).sort().forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      datalist.appendChild(opt);
    });

    refreshBtn.disabled = false;
  }

  async function convert() {
    const amount = parseFloat(amountInput.value || 0);
    const from = code(fromInput.value || base);
    const to = code(toInput.value || "EUR");

    if (!amount) {
      resultEl.textContent = "—";
      rateEl.textContent = "Enter an amount.";
      return;
    }

    if (from !== base) {
      await fetchRates(from);
    }

    const rate = rates[to];
    if (!rate) {
      resultEl.textContent = "—";
      rateEl.textContent = "Invalid currency.";
      return;
    }

    resultEl.textContent = `${(amount * rate).toFixed(2)} ${to}`;
    rateEl.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
  }

  amountInput.addEventListener("input", () => {
    amountInput.value = amountInput.value.replace(/[^\d.]/g, "");
    convert();
  });

  fromInput.addEventListener("change", convert);
  toInput.addEventListener("change", convert);

  document.querySelectorAll("[data-set-from]").forEach((btn) =>
    btn.addEventListener("click", () => {
      fromInput.value = btn.dataset.setFrom;
      convert();
    })
  );

  document.querySelectorAll("[data-set-to]").forEach((btn) =>
    btn.addEventListener("click", () => {
      toInput.value = btn.dataset.setTo;
      convert();
    })
  );

  swapBtn.addEventListener("click", () => {
    [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
    convert();
  });

  refreshBtn.addEventListener("click", () => {
    fetchRates(fromInput.value).then(convert);
  });

  clearBtn.addEventListener("click", () => {
    amountInput.value = "";
    resultEl.textContent = "—";
    rateEl.textContent = "Enter an amount.";
    amountInput.focus();
  });

  copyBtn.addEventListener("click", () => {
    const text = `${resultEl.textContent} (${rateEl.textContent})`;
    if (!text.startsWith("—")) navigator.clipboard.writeText(text);
  });

  fetchRates().then(convert);
});