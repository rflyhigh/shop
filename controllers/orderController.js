// controllers/orderController.js
const Order = require('../models/Order');

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('products.product');
      
    res.render('user/orders', {
      title: 'Your Orders',
      orders
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading orders');
    res.redirect('/');
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('products.product');
      
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/orders');
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/orders');
    }
    
    res.render('user/order-details', {
      title: 'Order Details',
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading order details');
    res.redirect('/orders');
  }
};