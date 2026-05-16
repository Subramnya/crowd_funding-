const fundingForm = document.getElementById('fundingForm');
const qrCodeInput = document.getElementById('qrCode');
const qrPreview = document.getElementById('qrPreview');
const formStatus = document.getElementById('formStatus');

let selectedQrFile = null;
let previewUrl = '';

const allowedQrTypes = new Set(['image/png', 'image/jpeg']);
const maxQrSize = 2 * 1024 * 1024;

function getDeadlineFromDays(days) {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + Number(days));

  const year = deadline.getFullYear();
  const month = String(deadline.getMonth() + 1).padStart(2, '0');
  const day = String(deadline.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function showStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.className = isError ? 'status-text error' : 'status-text';
}

function resetQrPreview() {
  selectedQrFile = null;

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  }

  qrPreview.innerHTML = '<p class="qr-placeholder">Upload a clear UPI or payment QR image.</p>';
}

function handleQrUpload(event) {
  const file = event.target.files[0];

  if (!file) {
    resetQrPreview();
    return;
  }

  if (!allowedQrTypes.has(file.type)) {
    resetQrPreview();
    qrCodeInput.value = '';
    showStatus('Only PNG, JPG, and JPEG QR images are allowed.', true);
    return;
  }

  if (file.size > maxQrSize) {
    resetQrPreview();
    qrCodeInput.value = '';
    showStatus('QR image must be 2 MB or smaller.', true);
    return;
  }

  selectedQrFile = file;

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
  }

  previewUrl = URL.createObjectURL(file);
  qrPreview.innerHTML = `<img src="${previewUrl}" alt="Uploaded payment QR code preview" />`;
  showStatus('');
}

async function handleFundingSubmit(event) {
  event.preventDefault();

  const formData = new FormData(fundingForm);
  const title = String(formData.get('title') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const goalAmount = Number(formData.get('goalAmount'));
  const deadline = getDeadlineFromDays(formData.get('durationDays'));

  if (!title || !description || !goalAmount || !selectedQrFile) {
    showStatus('Please fill every field and upload the payment QR code.', true);
    return;
  }

  if (!Number.isFinite(goalAmount) || goalAmount <= 0) {
    showStatus('Goal amount must be greater than zero.', true);
    return;
  }

  const payload = new FormData();
  payload.append('title', title);
  payload.append('description', description);
  payload.append('goal_amount', String(goalAmount));
  payload.append('deadline', deadline);
  payload.append('qrCode', selectedQrFile);

  showStatus('Creating your funding...');

  try {
    const response = await fetch('/api/fundings', {
      method: 'POST',
      body: payload,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create funding.');
    }

    const createdFunding = await response.json();
    sessionStorage.setItem('createdFundingCode', createdFunding.access_code);
    sessionStorage.setItem('createdFundingTitle', createdFunding.title);
    window.location.href = 'success.html';
  } catch (error) {
    showStatus(error.message || 'Could not create this funding.', true);
  }
}

if (qrCodeInput && fundingForm) {
  qrCodeInput.addEventListener('change', handleQrUpload);
  fundingForm.addEventListener('submit', handleFundingSubmit);
}
