const featuredCampaigns = document.getElementById('featuredCampaigns');
const { escapeHtml, formatRupees, getProgress, formatEndingText } = window.CrowdFundUI;

function renderFeaturedCard(campaign) {
  const target = Number(campaign.goal_amount || 0);
  const raised = Number(campaign.funded_amount || 0);
  const progress = getProgress(campaign);

  return `
    <article class="featured-card">
      <span class="meta-pill">${formatEndingText(campaign.deadline)}</span>
      <h3>${escapeHtml(campaign.title)}</h3>
      <p>${escapeHtml(campaign.description)}</p>
      <div class="funding-progress">
        <div class="progress-summary">
          <span><strong>${formatRupees(raised)}</strong> raised</span>
          <span>${progress}% funded</span>
        </div>
        <div class="progress-track" aria-label="${progress}% funded">
          <span class="progress-fill" style="width: ${progress}%"></span>
        </div>
        <div class="progress-summary progress-bottom">
          <span>Target ${formatRupees(target)}</span>
        </div>
      </div>
      <a class="btn btn-primary" href="payment.html?id=${campaign.id}">Support Campaign</a>
    </article>
  `;
}

async function loadFeaturedCampaigns() {
  if (!featuredCampaigns) return;

  try {
    const response = await fetch('/api/fundings');

    if (!response.ok) {
      throw new Error('Could not load featured campaigns.');
    }

    const campaigns = await response.json();
    const featured = campaigns.slice(0, 3);

    if (!featured.length) {
      featuredCampaigns.innerHTML = `
        <div class="empty-panel">
          <h3>No campaigns are active yet</h3>
          <p>Create the first campaign to feature it here.</p>
          <a class="btn btn-primary" href="create.html">Create Funding</a>
        </div>
      `;
      return;
    }

    featuredCampaigns.innerHTML = featured.map(renderFeaturedCard).join('');
  } catch (_error) {
    featuredCampaigns.innerHTML = '<div class="message">Featured campaigns could not be loaded.</div>';
  }
}

loadFeaturedCampaigns();
