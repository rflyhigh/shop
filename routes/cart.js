// routes/cart.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');

// View cart
router.get('/', cartController.viewCart);

// Add to cart
router.post('/add', cartController.addToCart);

// Update cart item
router.post('/update', cartController.updateCartItem);

// Remove cart item
router.get('/remove/:itemId', cartController.removeCartItem);

// Clear cart
router.get('/clear', cartController.clearCart);

module.exports = router;