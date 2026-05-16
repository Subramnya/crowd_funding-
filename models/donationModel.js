const database = require('../database/connection');

async function createDonation({ fundingId, fundingTitle, fundingCode, donorName, amount, method }) {
  await database.run(
    `
      INSERT INTO donations (funding_id, funding_title, funding_code, donor_name, amount, method)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [fundingId, fundingTitle, fundingCode, donorName, amount, method]
  );
}

async function findForAdmin(accessCode, isUniversalAdmin) {
  const sql = isUniversalAdmin
    ? 'SELECT * FROM donations ORDER BY id DESC'
    : 'SELECT * FROM donations WHERE funding_code = ? ORDER BY id DESC';
  const params = isUniversalAdmin ? [] : [accessCode];

  return database.all(sql, params);
}

function toLedgerEntry(donation, activeFundings) {
  return {
    id: donation.id,
    funding_id: donation.funding_id,
    funding_code: donation.funding_code,
    funding_title: donation.funding_title,
    donor_name: donation.donor_name,
    amount: donation.amount,
    method: donation.method,
    created_at: donation.created_at,
    status: activeFundings.some((funding) => funding.id === donation.funding_id)
      ? 'Active funding'
      : 'Completed or removed funding',
  };
}

module.exports = {
  createDonation,
  findForAdmin,
  toLedgerEntry,
};
