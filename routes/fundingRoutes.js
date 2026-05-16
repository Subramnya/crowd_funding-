const express = require('express');
const fundingController = require('../controllers/fundingController');
const uploadQr = require('../middleware/uploadMiddleware');

const router = express.Router();

router
  .route('/')
  .get(fundingController.listFundings)
  .post(uploadQr.single('qrCode'), fundingController.createFunding);

router
  .route('/:id')
  .get(fundingController.getFunding);

router
  .route('/:id/payments')
  .post(fundingController.recordPayment);

module.exports = router;
