const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const config = require('../config/appConfig');
const Funding = require('../models/fundingModel');
const Donation = require('../models/donationModel');

function normalizeAccessCode(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 4);
}

const getOverview = asyncHandler(async (req, res) => {
  const code = normalizeAccessCode(req.query.code);

  if (code.length !== 4) {
    throw new AppError('Enter your 4 digit admin code.', 400);
  }

  const isUniversalAdmin = code === config.universalAdminCode;
  const [fundings, donations] = await Promise.all([
    Funding.findForAdmin(code, isUniversalAdmin),
    Donation.findForAdmin(code, isUniversalAdmin),
  ]);

  const donationsByFunding = donations.reduce((map, donation) => {
    const list = map.get(donation.funding_id) || [];
    list.push(donation);
    map.set(donation.funding_id, list);
    return map;
  }, new Map());

  res.json({
    scope: isUniversalAdmin ? 'all' : 'creator',
    fundings: fundings.map((funding) => Funding.toAdminFunding(
      funding,
      donationsByFunding.get(funding.id) || []
    )),
    donations: donations.map((donation) => Donation.toLedgerEntry(donation, fundings)),
  });
});

module.exports = {
  getOverview,
};
