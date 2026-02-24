document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "https://open.er-api.com/v6/latest";
// Furst things first, get references to all the important elements in the page
  const amountInput = document.getElementById("amount");
  const fromInput = document.getElementById("fromCurrency");
  const toInput = document.getElementById("toCurrency");
  const fromName = document.getElementById("fromName");
  const toName = document.getElementById("toName");
  const resultEl = document.getElementById("resultValue");
  const rateEl = document.getElementById("rateLine");
  const statusEl = document.getElementById("statusLine");
  const metaEl = document.getElementById("metaLine");
  const swapBtn = document.getElementById("swapBtn");
  const refreshBtn = document.getElementById("refreshBtn");
  const clearBtn = document.getElementById("clearBtn");
  const copyBtn = document.getElementById("copyBtn");
  const datalist = document.getElementById("currencyList");

  // Check the safety if the markup is broken
  if (
    !amountInput ||
    !fromInput ||
    !toInput ||
    !resultEl ||
    !rateEl ||
    !statusEl ||
    !metaEl ||
    !swapBtn ||
    !refreshBtn ||
    !clearBtn ||
    !copyBtn ||
    !datalist
  ) {
    console.error("Currency converter: some elements are missing in index.html");
    return;
  }

  // Currency codes and their names for better display.
  const NAMES = {
    USD: "US Dollar",
    EUR: "Euro",
    GBP: "British Pound",
    JPY: "Japanese Yen",
    KES: "Kenyan Shilling",
    NGN: "Nigerian Naira",
    INR: "Indian Rupee",
  };

  let base = "USD";
  let rates = {}; // filled after fetching

  const code = (value) => (value || "").trim().toUpperCase();

  const setStatus = (text) => {
    statusEl.textContent = text;
  };

  const setNames = () => {
    const from = code(fromInput.value || base);
    const to = code(toInput.value || "EUR");
    fromName.textContent = NAMES[from] || from;
    toName.textContent = NAMES[to] || to;
  };

  const fillDatalist = () => {
    datalist.innerHTML = "";
    Object.keys(rates)
      .sort()
      .forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.label = NAMES[c] ? `${c} — ${NAMES[c]}` : c;
        datalist.appendChild(opt);
      });
  };

  async function fetchRates(newBase) {
    base = code(newBase || "USD");
    setStatus(`Loading rates for ${base}…`);
    refreshBtn.disabled = true;

    const res = await fetch(`${API_URL}/${encodeURIComponent(base)}`);
    const data = await res.json();

    if (data.result !== "success") {
      throw new Error(data["error-type"] || "API error");
    }

    rates = data.rates || {};
    fillDatalist();
    metaEl.textContent = `Last updated: ${data.time_last_update_utc} • Base: ${data.base_code}`;
    setStatus("Rates ready.");
    refreshBtn.disabled = false;
  }

  async function convert() {
    const amount = parseFloat((amountInput.value || "").replace(/,/g, ""));
    const from = code(fromInput.value || base);
    const to = code(toInput.value || "EUR");

    setNames();

    if (!amount) {
      resultEl.textContent = "—";
      rateEl.textContent = "Enter an amount to convert.";
      return;
    }

    if (!rates[to] || from !== base) {
      // If user changed "from", fetch with that as base
      await fetchRates(from);
    }

    const rate = rates[to];
    if (!rate) {
      resultEl.textContent = "—";
      rateEl.textContent = `No rate for ${to}.`;
      return;
    }

    const value = amount * rate;
    resultEl.textContent = `${value.toFixed(2)} ${to}`;
    rateEl.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
  }

  amountInput.addEventListener("input", () => {
    amountInput.value = amountInput.value.replace(/[^\d.,]/g, "");
    convert();
  });

  fromInput.addEventListener("change", convert);
  toInput.addEventListener("change", convert);
  fromInput.addEventListener("blur", convert);
  toInput.addEventListener("blur", convert);

  document.querySelectorAll("[data-set-from]").forEach((btn) => {
    btn.addEventListener("click", () => {
      fromInput.value = btn.getAttribute("data-set-from") || "";
      convert();
    });
  });

  document.querySelectorAll("[data-set-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      toInput.value = btn.getAttribute("data-set-to") || "";
      convert();
    });
  });

  swapBtn.addEventListener("click", () => {
    const oldFrom = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = oldFrom;
    convert();
  });

  refreshBtn.addEventListener("click", () => {
    fetchRates(fromInput.value).then(convert).catch((err) => {
      console.error(err);
      setStatus("Could not refresh rates.");
      refreshBtn.disabled = false;
    });
  });

  clearBtn.addEventListener("click", () => {
    amountInput.value = "";
    resultEl.textContent = "—";
    rateEl.textContent = "Enter an amount to convert.";
    setStatus("Amount cleared.");
    amountInput.focus();
  });
  
  // We first fetch USD rates and then do an initial conversion
  fetchRates("USD")
    .then(() => {
      setNames();
      convert();
    })
    .catch((err) => {
      console.error(err);
      setStatus("Could not load initial rates.");
    });
});


