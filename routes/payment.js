// routes/payment.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Checkout page
router.get('/checkout', paymentController.checkout);

// Create payment
router.post('/create', paymentController.createPayment);

// IPN handler
router.post('/ipn', paymentController.handleIPN);

// Success page
router.get('/success', paymentController.paymentSuccess);

// Cancel page
router.get('/cancel', paymentController.paymentCancel);

module.exports = router;