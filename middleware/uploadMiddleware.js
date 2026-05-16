const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const AppError = require('./AppError');
const config = require('../config/appConfig');

const allowedExtensions = new Set(['.png', '.jpg', '.jpeg']);
const allowedMimeTypes = new Set(['image/png', 'image/jpeg']);

fs.mkdirSync(config.qrUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, config.qrUploadDir);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase() === '.jpeg'
      ? '.jpg'
      : path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${extension}`;
    callback(null, safeName);
  },
});

function fileFilter(_req, file, callback) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
    callback(new AppError('Only PNG, JPG, and JPEG QR images are allowed.', 400));
    return;
  }

  callback(null, true);
}

const uploadQr = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxUploadSize,
  },
});

module.exports = uploadQr;
