const PAYPAL_CLIENT_ID = "AThMC7ICE0EY2fvrBRvnzn_zj9J0oZqntEXqe-sQWfWdqoVwilzZJX1EVa8ZsL4KRLdpPUGNftXfDFJZ";

const currencySelect = document.getElementById("donationCurrency");
const amountInput = document.getElementById("donationAmount");
const donorNameInput = document.getElementById("donorName");
const donorEmailInput = document.getElementById("donorEmail");
const donorMessageInput = document.getElementById("donorMessage");
const paypalButtonContainer = document.getElementById("paypal-button-container");
const statusBox = document.getElementById("donationStatus");

let currentCurrency = currencySelect.value;

function showStatus(message, type = "info") {
  statusBox.textContent = message;

  statusBox.style.display = "block";
  statusBox.style.marginTop = "1rem";
  statusBox.style.padding = "0.8rem 1rem";
  statusBox.style.borderRadius = "6px";
  statusBox.style.fontSize = "0.9rem";

  if (type === "success") {
    statusBox.style.background = "#ecfdf5";
    statusBox.style.color = "#047857";
    statusBox.style.border = "1px solid #a7f3d0";
  } else if (type === "error") {
    statusBox.style.background = "#fef2f2";
    statusBox.style.color = "#b91c1c";
    statusBox.style.border = "1px solid #fecaca";
  } else {
    statusBox.style.background = "#eff6ff";
    statusBox.style.color = "#1d4ed8";
    statusBox.style.border = "1px solid #bfdbfe";
  }
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.style.display = "none";
}

function getDonationAmount() {
  const amount = Number(amountInput.value);

  if (!amount || amount < 1) {
    return null;
  }

  return amount.toFixed(2);
}

function removeOldPayPalScript() {
  const oldScript = document.querySelector("script[data-paypal-sdk]");
  if (oldScript) {
    oldScript.remove();
  }

  if (window.paypal) {
    delete window.paypal;
  }
}

function loadPayPalSdk() {
  clearStatus();

  if (!PAYPAL_CLIENT_ID || PAYPAL_CLIENT_ID === "YOUR_PAYPAL_CLIENT_ID_HERE") {
    showStatus(
      "PayPal Client ID has not been added yet. Add the PayPal Client ID inside assets/js/donation.js.",
      "error"
    );
    return;
  }

  paypalButtonContainer.innerHTML = "";
  removeOldPayPalScript();

  currentCurrency = currencySelect.value;

  const script = document.createElement("script");
  script.setAttribute("data-paypal-sdk", "true");

  script.src =
    `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}` +
    `&currency=${currentCurrency}` +
    `&intent=capture` +
    `&components=buttons`;

  script.onload = renderPayPalButton;

  script.onerror = () => {
    showStatus(
      "PayPal could not load. Please check the Client ID or internet connection.",
      "error"
    );
  };

  document.body.appendChild(script);
}

function renderPayPalButton() {
  if (!window.paypal) {
    showStatus("PayPal SDK loaded, but the PayPal button is unavailable.", "error");
    return;
  }

  paypal.Buttons({
    style: {
      layout: "vertical",
      color: "gold",
      shape: "rect",
      label: "paypal"
    },

    onClick: function () {
      const amount = getDonationAmount();

      if (!amount) {
        showStatus("Please enter a valid donation amount before continuing.", "error");
        return false;
      }

      showStatus(
        `Preparing your ${currentCurrency} ${amount} donation...`,
        "info"
      );

      return true;
    },

    createOrder: async function () {
      const amount = getDonationAmount();

      const donationData = {
        amount,
        currency: currentCurrency,
        donorName: donorNameInput.value.trim(),
        donorEmail: donorEmailInput.value.trim(),
        donorMessage: donorMessageInput.value.trim()
      };

      const response = await fetch("/.netlify/functions/create-paypal-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(donationData)
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || "Could not create PayPal order.");
      }

      return orderData.id;
    },

    onApprove: async function (data) {
      showStatus("Finalising your donation...", "info");

      const response = await fetch("/.netlify/functions/capture-paypal-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderID: data.orderID
        })
      });

      const captureData = await response.json();

      if (!response.ok) {
        showStatus(
          captureData.error || "Donation could not be completed.",
          "error"
        );
        return;
      }

      showStatus(
        "Thank you. Your donation was completed successfully.",
        "success"
      );

      console.log("Donation captured:", captureData);
    },

    onCancel: function () {
      showStatus("Donation was cancelled before completion.", "info");
    },

    onError: function (error) {
      console.error("PayPal error:", error);
      showStatus(
        "Something went wrong while processing the donation. Please try again.",
        "error"
      );
    }
  }).render("#paypal-button-container");
}

currencySelect.addEventListener("change", () => {
  showStatus("Currency changed. Reloading PayPal button...", "info");
  loadPayPalSdk();
});

amountInput.addEventListener("input", clearStatus);
donorNameInput.addEventListener("input", clearStatus);
donorEmailInput.addEventListener("input", clearStatus);
donorMessageInput.addEventListener("input", clearStatus);

loadPayPalSdk();