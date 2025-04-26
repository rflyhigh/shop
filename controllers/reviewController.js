// controllers/reviewController.js
const Review = require('../models/Review');
const Order = require('../models/Order');

exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    
    // Check if user has purchased the product
    const hasPurchased = await Order.findOne({
      user: req.user._id,
      'products.product': productId,
      status: 'completed'
    });
    
    if (!hasPurchased) {
      req.flash('error_msg', 'You must purchase this product before reviewing it');
      return res.redirect(`/products/${productId}`);
    }
    
    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: productId
    });
    
    if (existingReview) {
      req.flash('error_msg', 'You have already reviewed this product');
      return res.redirect(`/products/${productId}`);
    }
    
    // Create review
    const review = new Review({
      user: req.user._id,
      product: productId,
      rating: parseInt(rating),
      comment
    });
    
    await review.save();
    req.flash('success_msg', 'Review added successfully');
    res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding review');
    res.redirect(`/products/${req.body.productId}`);
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId, rating, comment } = req.body;
    
    // Find review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      req.flash('error_msg', 'Review not found');
      return res.redirect(`/products/${req.body.productId}`);
    }
    
    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect(`/products/${req.body.productId}`);
    }
    
    // Update review
    review.rating = parseInt(rating);
    review.comment = comment;
    
    await review.save();
    req.flash('success_msg', 'Review updated successfully');
    res.redirect(`/products/${review.product}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating review');
    res.redirect(`/products/${req.body.productId}`);
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    
    // Find review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      req.flash('error_msg', 'Review not found');
      return res.redirect('/products');
    }
    
    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect(`/products/${review.product}`);
    }
    
    const productId = review.product;
    
    await review.remove();
    req.flash('success_msg', 'Review deleted successfully');
    res.redirect(`/products/${productId}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting review');
    res.redirect('/products');
  }
};