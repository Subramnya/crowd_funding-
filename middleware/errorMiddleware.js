const path = require('path');
const multer = require('multer');
const config = require('../config/appConfig');

function wantsJson(req) {
  return req.path.startsWith('/api/') || req.accepts(['html', 'json']) === 'json';
}

function notFoundHandler(req, res, next) {
  if (wantsJson(req)) {
    res.status(404).json({ message: 'The requested API route was not found.' });
    return;
  }

  res.status(404).sendFile(path.join(config.viewsDir, 'errors', '404.html'));
}

function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.isOperational ? error.message : 'Something went wrong. Please try again later.';

  if (error instanceof multer.MulterError) {
    statusCode = 400;
    message = error.code === 'LIMIT_FILE_SIZE'
      ? 'QR image must be 2 MB or smaller.'
      : 'The uploaded file could not be processed.';
  }

  if (statusCode >= 500 && !error.isOperational) {
    console.error(error);
  }

  if (res.headersSent) {
    next(error);
    return;
  }

  if (wantsJson(req)) {
    res.status(statusCode).json({ message });
    return;
  }

  res.status(statusCode).sendFile(path.join(config.viewsDir, 'errors', 'error.html'));
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
