const gatewayPanel = document.getElementById('gatewayPanel');
const qrPanel = document.getElementById('qrPanel');
const paymentTitle = document.getElementById('paymentTitle');
const paymentDescription = document.getElementById('paymentDescription');
const paymentNotice = document.getElementById('paymentNotice');
const paymentForm = document.getElementById('paymentForm');
const payDrawer = document.getElementById('payDrawer');
const selectedMethodText = document.getElementById('selectedMethodText');
const donorName = document.getElementById('donorName');
const paymentAmount = document.getElementById('paymentAmount');
const qrTitle = document.getElementById('qrTitle');
const paymentQrBox = document.getElementById('paymentQrBox');
const thankYouMessage = document.getElementById('thankYouMessage');
const { escapeHtml, formatRupees, getProgress } = window.CrowdFundUI;

const params = new URLSearchParams(window.location.search);
const fundingId = params.get('id');
const mode = params.get('mode');

let activeFunding = null;
const unavailablePaymentMessage = 'This service is currently not available. Please go with UPI / PhonePe.';

function getStoredPaymentResult() {
  const stored = sessionStorage.getItem('lastPaymentResult');
  if (!stored) return null;

  try {
    const result = JSON.parse(stored);
    return String(result.funding?.id) === String(fundingId) ? result : null;
  } catch (error) {
    return null;
  }
}

function showMessage(message) {
  gatewayPanel.innerHTML = `<div class="message">${escapeHtml(message)}</div>`;
}

function showGatewayNotice(message) {
  if (!paymentNotice) return;
  paymentNotice.textContent = message;
  paymentNotice.hidden = false;
}

function hideGatewayNotice() {
  if (!paymentNotice) return;
  paymentNotice.textContent = '';
  paymentNotice.hidden = true;
}

function renderGateway(funding) {
  const progress = getProgress(funding);
  const target = Number(funding.goal_amount || 0);
  const raised = Number(funding.funded_amount || 0);
  const remaining = Math.max(target - raised, 0);

  paymentTitle.textContent = 'Choose payment method';
  paymentDescription.innerHTML = `
    Funding selected: <strong>${escapeHtml(funding.title)}</strong><br />
    ${formatRupees(raised)} collected from ${formatRupees(target)} target.
  `;

  gatewayPanel.insertAdjacentHTML(
    'afterbegin',
    `
      <div class="gateway-progress">
        <div class="progress-summary">
          <span><strong>${formatRupees(raised)}</strong> collected</span>
          <span>${progress}% funded</span>
        </div>
        <div class="progress-track" aria-label="${progress}% funded">
          <span class="progress-fill" style="width: ${progress}%"></span>
        </div>
        <div class="progress-summary progress-bottom">
          <span>Target ${formatRupees(target)}</span>
          <span>${formatRupees(remaining)} remaining</span>
        </div>
      </div>
    `
  );
}

function renderQrFromPayment(result) {
  const funding = result.funding;
  const title = funding.title || 'Selected funding';
  const totalCollected = Number(result.total_collected || funding.funded_amount || 0);
  const targetAmount = Number(result.target_amount || funding.goal_amount || 0);
  const amountPaid = Number(result.amount_paid || 0);
  const remaining = Math.max(targetAmount - totalCollected, 0);

  gatewayPanel.hidden = true;
  qrPanel.hidden = false;
  qrTitle.textContent = title;

  if (result.completed) {
    thankYouMessage.innerHTML = `
      <h2>Thank you for your funding for ${escapeHtml(title)}</h2>
      <p>
        Your contribution of <strong>${formatRupees(amountPaid)}</strong> has been recorded.
        Total collected is now <strong>${formatRupees(totalCollected)}</strong>.
        This funding has reached its required limit of <strong>${formatRupees(targetAmount)}</strong>,
        so after your payment this funding has been terminated.
      </p>
    `;
  } else {
    thankYouMessage.innerHTML = `
      <h2>Thank you for your funding for ${escapeHtml(title)}</h2>
      <p>
        Your contribution of <strong>${formatRupees(amountPaid)}</strong> has been recorded.
        Total collected is now <strong>${formatRupees(totalCollected)}</strong>,
        with <strong>${formatRupees(remaining)}</strong> still remaining.
      </p>
    `;
  }

  paymentQrBox.innerHTML = funding.qr_code
    ? `<img src="${funding.qr_code}" alt="Payment QR code for ${escapeHtml(title)}" />`
    : '<p class="qr-placeholder">QR code not available for this funding.</p>';
}

function renderQrFromFunding(funding) {
  renderQrFromPayment({
    completed: false,
    amount_paid: 0,
    total_collected: Number(funding.funded_amount || 0),
    target_amount: Number(funding.goal_amount || 0),
    funding,
  });
}

async function loadFunding() {
  if (!fundingId) {
    showMessage('Funding id is missing. Please go back and choose a funding.');
    return;
  }

  if (mode === 'qr') {
    const storedResult = getStoredPaymentResult();
    if (storedResult) {
      renderQrFromPayment(storedResult);
      return;
    }
  }

  try {
    const response = await fetch(`/api/fundings/${fundingId}`);

    if (!response.ok) {
      throw new Error('Could not load this funding. It may already be completed.');
    }

    activeFunding = await response.json();

    if (mode === 'qr') {
      renderQrFromFunding(activeFunding);
      return;
    }

    renderGateway(activeFunding);
  } catch (error) {
    showMessage(error.message || 'Could not load this funding.');
  }
}

paymentForm.addEventListener('change', (event) => {
  if (event.target.name !== 'paymentMethod') return;

  if (event.target.value !== 'UPI') {
    event.target.checked = false;
    paymentAmount.required = false;
    donorName.required = false;
    payDrawer.hidden = true;
    showGatewayNotice(unavailablePaymentMessage);
    window.alert(unavailablePaymentMessage);
    return;
  }

  hideGatewayNotice();
  selectedMethodText.textContent = 'UPI / PhonePe selected. Enter your name and contribution amount to continue.';
  paymentAmount.required = true;
  donorName.required = true;
  payDrawer.hidden = false;
});

paymentForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(paymentForm);
  const selectedMethod = formData.get('paymentMethod');
  const amount = Number(formData.get('paymentAmount'));
  const payerName = String(formData.get('donorName') || '').trim();

  if (!selectedMethod || !activeFunding) return;

  if (selectedMethod !== 'UPI') {
    showGatewayNotice(unavailablePaymentMessage);
    window.alert(unavailablePaymentMessage);
    return;
  }

  if (!payerName) {
    selectedMethodText.textContent = 'Please enter your name before continuing.';
    donorName.focus();
    return;
  }

  if (!amount || amount <= 0) {
    selectedMethodText.textContent = 'Please enter a valid amount in rupees.';
    paymentAmount.focus();
    return;
  }

  selectedMethodText.textContent = 'Saving your contribution...';

  try {
    const response = await fetch(`/api/fundings/${activeFunding.id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, method: selectedMethod, donor_name: payerName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Could not save payment.');
    }

    const result = await response.json();
    sessionStorage.setItem('lastPaymentResult', JSON.stringify(result));
    window.location.href = `payment.html?id=${activeFunding.id}&mode=qr`;
  } catch (error) {
    selectedMethodText.textContent = error.message || 'Could not save payment.';
  }
});

loadFunding();
