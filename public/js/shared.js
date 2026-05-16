window.CrowdFundUI = {
  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  formatRupees(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  },

  getProgress(campaign) {
    const target = Number(campaign.goal_amount || 0);
    const raised = Number(campaign.funded_amount || 0);

    if (!target) return 0;
    return Math.min(Math.round((raised / target) * 100), 100);
  },

  getDaysLeft(deadline) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(deadline);
    endDate.setHours(0, 0, 0, 0);

    return Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  },

  formatEndingText(deadline) {
    const daysLeft = window.CrowdFundUI.getDaysLeft(deadline);

    if (daysLeft < 0) return 'Ended';
    if (daysLeft === 0) return 'Ends today';
    if (daysLeft === 1) return 'Ends in 1 day';
    return `Ends in ${daysLeft} days`;
  },
};
