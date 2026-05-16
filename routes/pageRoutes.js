const express = require('express');
const { renderPage } = require('../controllers/pageController');

const router = express.Router();

router.get('/', renderPage('index.html'));
router.get('/index.html', renderPage('index.html'));
router.get('/create.html', renderPage('create.html'));
router.get('/fundings.html', renderPage('fundings.html'));
router.get('/payment.html', renderPage('payment.html'));
router.get('/admin.html', renderPage('admin.html'));
router.get('/success.html', renderPage('success.html'));

module.exports = router;
