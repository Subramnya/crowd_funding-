const crypto = require('crypto');
const database = require('../database/connection');
const config = require('../config/appConfig');

function getProgressMetrics(row) {
  const target = Number(row.goal_amount || 0);
  const raised = Number(row.funded_amount || 0);
  const progress = target ? Math.min(Math.round((raised / target) * 100), 100) : 0;

  return {
    target,
    raised,
    progress,
    remaining: Math.max(target - raised, 0),
  };
}

function toPublicFunding(row) {
  const metrics = getProgressMetrics(row);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    goal_amount: metrics.target,
    funded_amount: metrics.raised,
    progress_percent: metrics.progress,
    remaining_amount: metrics.remaining,
    deadline: row.deadline,
    qr_code: row.qr_code,
    created_at: row.created_at,
  };
}

function toAdminFunding(row, donations = []) {
  const publicFunding = toPublicFunding(row);

  return {
    ...publicFunding,
    funding_percent: publicFunding.progress_percent,
    qr_status: row.qr_code ? 'QR uploaded' : 'QR missing',
    qr_reference: row.qr_code && row.qr_code.startsWith('/uploads/') ? row.qr_code : '',
    access_code: row.access_code,
    donor_entries: donations.map((donation) => ({
      name: donation.donor_name,
      amount: donation.amount,
      method: donation.method,
      created_at: donation.created_at,
    })),
  };
}

async function findAll() {
  const rows = await database.all(`
    SELECT id, title, description, goal_amount, funded_amount, deadline, created_at
    FROM fundings
    ORDER BY id DESC
  `);

  return rows.map(toPublicFunding);
}

async function findById(id) {
  const row = await database.get(
    'SELECT * FROM fundings WHERE id = ?',
    [id]
  );

  return row || null;
}

async function findByAccessCode(accessCode) {
  return database.get('SELECT id FROM fundings WHERE access_code = ?', [accessCode]);
}

async function findForAdmin(accessCode, isUniversalAdmin) {
  const sql = isUniversalAdmin
    ? 'SELECT * FROM fundings ORDER BY id DESC'
    : 'SELECT * FROM fundings WHERE access_code = ? ORDER BY id DESC';
  const params = isUniversalAdmin ? [] : [accessCode];

  return database.all(sql, params);
}

async function createFunding({ title, description, goalAmount, deadline, qrPath, accessCode }) {
  const result = await database.run(
    `
      INSERT INTO fundings (title, description, goal_amount, deadline, qr_code, access_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [title, description, goalAmount, deadline, qrPath, accessCode]
  );

  return findById(result.id);
}

async function updateFundingAmount(id, fundedAmount, donors) {
  await database.run(
    `
      UPDATE fundings
      SET funded_amount = ?, donors = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [fundedAmount, donors, id]
  );
}

async function deleteFunding(id) {
  await database.run('DELETE FROM fundings WHERE id = ?', [id]);
}

async function generateFundingCode() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const code = String(crypto.randomInt(0, 10000)).padStart(4, '0');

    if (code === config.universalAdminCode) {
      continue;
    }

    const existing = await findByAccessCode(code);

    if (!existing) {
      return code;
    }
  }

  throw new Error('Could not generate a unique funding code.');
}

module.exports = {
  toPublicFunding,
  toAdminFunding,
  findAll,
  findById,
  findForAdmin,
  createFunding,
  updateFundingAmount,
  deleteFunding,
  generateFundingCode,
};
