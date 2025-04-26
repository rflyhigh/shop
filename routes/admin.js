// routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { ensureAdmin } = require('../middleware/admin');

// Admin dashboard
router.get('/', ensureAdmin, adminController.renderDashboard);

// Product management
router.get('/products', ensureAdmin, adminController.renderProductList);
router.get('/products/add', ensureAdmin, adminController.renderAddProduct);
router.post('/products/add', ensureAdmin, adminController.addProduct);
router.get('/products/edit/:id', ensureAdmin, adminController.renderEditProduct);
router.put('/products/edit/:id', ensureAdmin, adminController.updateProduct);
router.delete('/products/delete/:id', ensureAdmin, adminController.deleteProduct);

// Order management
router.get('/orders', ensureAdmin, adminController.renderOrderList);
router.get('/orders/:id', ensureAdmin, adminController.renderOrderDetails);
router.put('/orders/:id/status', ensureAdmin, adminController.updateOrderStatus);

module.exports = router;