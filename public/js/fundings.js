const fundingList = document.getElementById('fundingList');
const { escapeHtml, formatRupees, getProgress, formatEndingText } = window.CrowdFundUI;

function renderFundingCard(campaign) {
  const target = Number(campaign.goal_amount || 0);
  const raised = Number(campaign.funded_amount || 0);
  const remaining = Math.max(target - raised, 0);
  const progress = Number(campaign.progress_percent ?? getProgress(campaign));

  return `
    <article class="funding-card">
      <div class="funding-content">
        <span class="meta-pill">${formatEndingText(campaign.deadline)}</span>
        <h2>${escapeHtml(campaign.title)}</h2>
        <p class="funding-description">${escapeHtml(campaign.description)}</p>

        <div class="funding-progress">
          <div class="progress-summary">
            <span><strong>${formatRupees(raised)}</strong> raised</span>
            <span>Target ${formatRupees(target)}</span>
          </div>
          <div class="progress-track" aria-label="${progress}% funded">
            <span class="progress-fill" style="width: ${progress}%"></span>
          </div>
          <div class="progress-summary progress-bottom">
            <span>${progress}% funded</span>
            <span>${formatRupees(remaining)} remaining</span>
          </div>
        </div>
      </div>

      <div class="funding-action">
        <a class="btn btn-primary fund-btn" href="payment.html?id=${campaign.id}">Fund This Cause</a>
      </div>
    </article>
  `;
}

async function loadFundings() {
  try {
    const response = await fetch('/api/fundings');

    if (!response.ok) {
      throw new Error('Could not load fundings.');
    }

    const campaigns = await response.json();

    if (!campaigns.length) {
      fundingList.innerHTML = `
        <div class="empty-panel">
          <h2>No funding has been created yet</h2>
          <p>Start by creating the first request.</p>
          <a class="btn btn-primary" href="create.html">Create New Funding</a>
        </div>
      `;
      return;
    }

    fundingList.innerHTML = campaigns.map(renderFundingCard).join('');
  } catch (_error) {
    fundingList.innerHTML = '<div class="message">Could not load saved fundings from the backend.</div>';
  }
}

loadFundings();
