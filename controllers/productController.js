// controllers/productController.js
const Product = require('../models/Product');
const Review = require('../models/Review');

exports.getAllProducts = async (req, res) => {
  try {
    const category = req.query.category;
    const search = req.query.search;
    
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    res.render('products/index', {
      title: 'All Products',
      products,
      currentCategory: category || 'all',
      searchTerm: search || ''
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading products');
    res.redirect('/');
  }
};

exports.getProductDetails = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/products');
    }
    
    // Get reviews for this product
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    
    // Calculate average rating
    let avgRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      avgRating = (totalRating / reviews.length).toFixed(1);
    }
    
    // Check if user has purchased this product (required for reviewing)
    let hasPurchased = false;
    if (req.user) {
      const Order = require('../models/Order');
      const userOrders = await Order.find({
        user: req.user._id,
        status: 'completed',
        'products.product': req.params.id
      });
      
      hasPurchased = userOrders.length > 0;
    }
    
    // Check if user has already reviewed this product
    let hasReviewed = false;
    if (req.user) {
      const existingReview = await Review.findOne({
        user: req.user._id,
        product: req.params.id
      });
      
      hasReviewed = !!existingReview;
    }
    
    res.render('products/details', {
      title: product.name,
      product,
      reviews,
      avgRating,
      hasPurchased,
      hasReviewed
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading product details');
    res.redirect('/products');
  }
};