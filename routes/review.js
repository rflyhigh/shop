// routes/review.js
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { ensureAuthenticated } = require('../middleware/auth');

// Add review
router.post('/add', ensureAuthenticated, reviewController.addReview);

// Update review
router.post('/update', ensureAuthenticated, reviewController.updateReview);

// Delete review
router.get('/delete/:reviewId', ensureAuthenticated, reviewController.deleteReview);

module.exports = router;