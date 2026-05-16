const adminAccessForm = document.getElementById('adminAccessForm');
const adminCode = document.getElementById('adminCode');
const adminAccessStatus = document.getElementById('adminAccessStatus');
const adminDashboard = document.getElementById('adminDashboard');
const adminStats = document.getElementById('adminStats');
const adminFundingList = document.getElementById('adminFundingList');
const donationLedger = document.getElementById('donationLedger');
const adminScopeTitle = document.getElementById('adminScopeTitle');
const { escapeHtml, formatRupees } = window.CrowdFundUI;

function formatDate(value) {
  if (!value) return 'Not set';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function renderStats(data) {
  const totalTarget = data.fundings.reduce((sum, funding) => sum + Number(funding.goal_amount || 0), 0);
  const totalCollected = data.fundings.reduce((sum, funding) => sum + Number(funding.funded_amount || 0), 0);
  const totalDonations = data.donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

  adminStats.innerHTML = `
    <article class="admin-stat-card">
      <span>${data.scope === 'all' ? 'Active fundings' : 'Your fundings'}</span>
      <strong>${data.fundings.length}</strong>
    </article>
    <article class="admin-stat-card">
      <span>Collected on active causes</span>
      <strong>${formatRupees(totalCollected)}</strong>
    </article>
    <article class="admin-stat-card">
      <span>Total donor entries</span>
      <strong>${data.donations.length}</strong>
    </article>
    <article class="admin-stat-card">
      <span>Active target value</span>
      <strong>${formatRupees(totalTarget)}</strong>
    </article>
    <article class="admin-stat-card accent-stat">
      <span>All-time donation value</span>
      <strong>${formatRupees(totalDonations)}</strong>
    </article>
  `;
}

function renderDonorPills(donors) {
  if (!donors.length) {
    return '<p class="admin-muted">No donations recorded yet.</p>';
  }

  return `
    <div class="donor-pills">
      ${donors.map((donor) => `
        <span class="donor-pill">
          ${escapeHtml(donor.name)} <strong>${formatRupees(donor.amount)}</strong>
        </span>
      `).join('')}
    </div>
  `;
}

function renderFundingList(fundings) {
  if (!fundings.length) {
    adminFundingList.innerHTML = `
      <div class="empty-panel">
        <h2>No active fundings</h2>
        <p>Create a funding to see admin records here.</p>
        <a class="btn btn-primary" href="create.html">Create Funding</a>
      </div>
    `;
    return;
  }

  adminFundingList.innerHTML = fundings.map((funding) => `
    <article class="admin-funding-card">
      <div class="admin-funding-main">
        <span class="meta-pill">${escapeHtml(funding.qr_status)}</span>
        <span class="meta-pill code-pill">Code ${escapeHtml(funding.access_code || '----')}</span>
        <h3>${escapeHtml(funding.title)}</h3>
        <p>${escapeHtml(funding.description)}</p>
        ${renderDonorPills(funding.donor_entries)}
      </div>
      <div class="admin-metrics">
        <div>
          <span>Target</span>
          <strong>${formatRupees(funding.goal_amount)}</strong>
        </div>
        <div>
          <span>Collected</span>
          <strong>${formatRupees(funding.funded_amount)}</strong>
        </div>
        <div>
          <span>Progress</span>
          <strong>${funding.funding_percent}%</strong>
        </div>
        <div>
          <span>Start</span>
          <strong>${formatDate(funding.created_at)}</strong>
        </div>
        <div>
          <span>End</span>
          <strong>${formatDate(funding.deadline)}</strong>
        </div>
      </div>
    </article>
  `).join('');
}

function renderDonationLedger(donations) {
  if (!donations.length) {
    donationLedger.innerHTML = '<div class="message">No donor names have been recorded yet.</div>';
    return;
  }

  donationLedger.innerHTML = `
    <div class="ledger-table" role="table" aria-label="Donation ledger">
      <div class="ledger-row ledger-head" role="row">
        <span role="columnheader">Funder name</span>
        <span role="columnheader">Cause</span>
        <span role="columnheader">Amount</span>
        <span role="columnheader">Method</span>
        <span role="columnheader">Date</span>
      </div>
      ${donations.map((donation) => `
        <div class="ledger-row" role="row">
          <span role="cell">${escapeHtml(donation.donor_name)}</span>
          <span role="cell">${escapeHtml(donation.funding_title)}</span>
          <span role="cell">${formatRupees(donation.amount)}</span>
          <span role="cell">${escapeHtml(donation.method)}</span>
          <span role="cell">${formatDate(donation.created_at)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

async function loadAdminData() {
  const code = String(adminCode.value || '').replace(/\D/g, '').slice(0, 4);

  if (code.length !== 4) {
    adminAccessStatus.textContent = 'Enter the 4 digit code.';
    adminAccessStatus.className = 'status-text error';
    adminCode.focus();
    return;
  }

  adminAccessStatus.textContent = 'Opening dashboard...';
  adminAccessStatus.className = 'status-text';

  try {
    const response = await fetch(`/api/admin/overview?code=${encodeURIComponent(code)}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Could not load admin data.');
    }

    const data = await response.json();
    adminDashboard.hidden = false;
    adminScopeTitle.textContent = data.scope === 'all' ? 'All funding data' : 'Your funding data';
    adminAccessStatus.textContent = data.scope === 'all'
      ? 'Universal admin access opened.'
      : 'Creator dashboard opened.';
    renderStats(data);
    renderFundingList(data.fundings);
    renderDonationLedger(data.donations);
  } catch (error) {
    const message = `<div class="message">${escapeHtml(error.message || 'Could not load admin dashboard.')}</div>`;
    adminDashboard.hidden = false;
    adminStats.innerHTML = '';
    adminFundingList.innerHTML = message;
    donationLedger.innerHTML = message;
    adminAccessStatus.textContent = error.message || 'Could not open admin dashboard.';
    adminAccessStatus.className = 'status-text error';
  }
}

if (adminCode) {
  const creatorCode = sessionStorage.getItem('createdFundingCode');
  if (creatorCode) {
    adminCode.value = creatorCode;
  }

  adminCode.addEventListener('input', () => {
    adminCode.value = adminCode.value.replace(/\D/g, '').slice(0, 4);
  });
}

if (adminAccessForm) {
  adminAccessForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadAdminData();
  });
}
