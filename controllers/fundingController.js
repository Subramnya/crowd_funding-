const fs = require('fs/promises');
const AppError = require('../middleware/AppError');
const asyncHandler = require('../middleware/asyncHandler');
const Funding = require('../models/fundingModel');
const Donation = require('../models/donationModel');

function normalizeText(value = '', maxLength = 500) {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeDonorName(value = '') {
  return String(value)
    .replace(/[\r\n\t,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function formatDonorEntry(name, amount) {
  return `${name}: ${Number(amount || 0)}`;
}

function isValidDeadline(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return false;
  }

  const deadline = new Date(`${value}T00:00:00`);

  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return deadline >= today;
}

async function removeUploadedFile(file) {
  if (!file?.path) return;

  try {
    await fs.unlink(file.path);
  } catch (_error) {
    // The upload is already disposable when validation fails.
  }
}

function validateCampaignPayload(payload, file) {
  if (!payload.title) {
    return 'Campaign title is required.';
  }

  if (!payload.description) {
    return 'Campaign description is required.';
  }

  if (!Number.isFinite(payload.goalAmount) || payload.goalAmount <= 0) {
    return 'Goal amount must be a number greater than zero.';
  }

  if (!payload.deadline || !isValidDeadline(payload.deadline)) {
    return 'Deadline must be a valid date that is not in the past.';
  }

  if (!file) {
    return 'Upload a PNG, JPG, or JPEG payment QR image.';
  }

  return '';
}

const listFundings = asyncHandler(async (_req, res) => {
  const fundings = await Funding.findAll();
  res.json(fundings);
});

const getFunding = asyncHandler(async (req, res) => {
  const funding = await Funding.findById(req.params.id);

  if (!funding) {
    throw new AppError('Funding not found.', 404);
  }

  res.json(Funding.toPublicFunding(funding));
});

const createFunding = asyncHandler(async (req, res) => {
  const payload = {
    title: normalizeText(req.body.title, 120),
    description: normalizeText(req.body.description, 1200),
    goalAmount: Number(req.body.goal_amount || req.body.goalAmount),
    deadline: String(req.body.deadline || '').trim(),
  };

  const validationMessage = validateCampaignPayload(payload, req.file);

  if (validationMessage) {
    await removeUploadedFile(req.file);
    throw new AppError(validationMessage, 400);
  }

  const qrPath = `/uploads/qr/${req.file.filename}`;
  const accessCode = await Funding.generateFundingCode();
  const funding = await Funding.createFunding({
    ...payload,
    qrPath,
    accessCode,
  });

  res.status(201).json({
    ...Funding.toPublicFunding(funding),
    access_code: accessCode,
  });
});

const recordPayment = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  const method = String(req.body.method || '').trim();
  const donorName = normalizeDonorName(req.body.donor_name || req.body.donorName);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError('Donation amount must be greater than zero.', 400);
  }

  if (method !== 'UPI') {
    throw new AppError('This service is currently not available. Please go with UPI / PhonePe.', 400);
  }

  if (!donorName) {
    throw new AppError('Please enter your name before continuing.', 400);
  }

  const funding = await Funding.findById(req.params.id);

  if (!funding) {
    throw new AppError('Funding not found.', 404);
  }

  const totalCollected = Number(funding.funded_amount || 0) + amount;
  const completed = totalCollected >= Number(funding.goal_amount);
  const donorEntry = formatDonorEntry(donorName, amount);
  const donors = funding.donors ? `${funding.donors}, ${donorEntry}` : donorEntry;
  const fundingCode = funding.access_code || '';

  await Donation.createDonation({
    fundingId: funding.id,
    fundingTitle: funding.title,
    fundingCode,
    donorName,
    amount,
    method,
  });

  if (completed) {
    await Funding.deleteFunding(funding.id);

    res.json({
      completed: true,
      deleted: true,
      amount_paid: amount,
      total_collected: totalCollected,
      target_amount: Number(funding.goal_amount),
      remaining_amount: 0,
      funding: Funding.toPublicFunding({
        ...funding,
        funded_amount: totalCollected,
      }),
      message: 'Funding target reached. This funding has been removed from active fundings.',
    });
    return;
  }

  await Funding.updateFundingAmount(funding.id, totalCollected, donors);

  res.json({
    completed: false,
    deleted: false,
    amount_paid: amount,
    total_collected: totalCollected,
    target_amount: Number(funding.goal_amount),
    remaining_amount: Number(funding.goal_amount) - totalCollected,
    funding: Funding.toPublicFunding({
      ...funding,
      funded_amount: totalCollected,
    }),
    message: 'Payment amount saved.',
  });
});

module.exports = {
  listFundings,
  getFunding,
  createFunding,
  recordPayment,
};
