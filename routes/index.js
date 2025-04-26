// routes/index.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { ensureAuthenticated } = require('../middleware/auth');

// Home page
router.get('/', async (req, res) => {
  try {
    // Get featured products (newest 8 products)
    const featuredProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(8);
      
    // Get products by category
    const giftcards = await Product.find({ category: 'giftcard' })
      .sort({ createdAt: -1 })
      .limit(4);
      
    const accounts = await Product.find({ category: 'account' })
      .sort({ createdAt: -1 })
      .limit(4);
      
    const currencies = await Product.find({ category: 'currency' })
      .sort({ createdAt: -1 })
      .limit(4);
    
    res.render('home', {
      title: 'Keykardz - Digital Marketplace',
      featuredProducts,
      giftcards,
      accounts,
      currencies
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', {
      title: 'Error',
      message: 'An error occurred while loading the homepage'
    });
  }
});

// routes/index.js
router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('user/profile', {
    title: 'Your Profile',
    user: req.user
  });
});

// Add these routes to routes/index.js

// FAQ page
router.get('/faq', (req, res) => {
  res.render('pages/faq', {
    title: 'Frequently Asked Questions'
  });
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('pages/contact', {
    title: 'Contact Us'
  });
});

// Terms of Service page
router.get('/terms', (req, res) => {
  res.render('pages/terms', {
    title: 'Terms of Service'
  });
});

// Privacy Policy page
router.get('/privacy', (req, res) => {
  res.render('pages/privacy', {
    title: 'Privacy Policy'
  });
});


router.get('/health', async (req, res) => {
    try {
      // Check database connection
      await mongoose.connection.db.admin().ping();
      
      res.status(200).json({
        status: 'UP',
        database: 'Connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: 'All systems operational'
      });
    } catch (error) {
      res.status(500).json({
        status: 'DOWN',
        database: 'Disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

module.exports = router;