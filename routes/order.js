// routes/order.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { ensureAuthenticated } = require('../middleware/auth');

// Get user orders
router.get('/', ensureAuthenticated, orderController.getUserOrders);

// Get order details
router.get('/:id', ensureAuthenticated, orderController.getOrderDetails);

module.exports = router;