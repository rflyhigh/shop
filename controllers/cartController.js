// controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to get or create cart
const getCart = async (req) => {
  let cart;
  
  if (req.user) {
    // Logged in user - find cart by user ID
    cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      // Create new cart for user
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
  } else {
    // Guest user - find cart by session ID
    const sessionId = req.sessionID;
    cart = await Cart.findOne({ sessionId });
    
    if (!cart) {
      // Create new cart for guest
      cart = new Cart({ sessionId, items: [] });
      await cart.save();
    }
  }
  
  return cart;
};

exports.viewCart = async (req, res) => {
  try {
    const cart = await getCart(req);
    
    // Populate product details
    await cart.populate('items.product');
    
    // Calculate total
    let total = 0;
    cart.items.forEach(item => {
      total += item.product.price * item.quantity;
    });
    
    res.render('cart/index', {
      title: 'Your Cart',
      cart,
      total
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading cart');
    res.redirect('/');
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/products');
    }
    
    // Check stock
    if (product.stock < quantity) {
      req.flash('error_msg', 'Not enough stock available');
      return res.redirect(`/products/${productId}`);
    }
    
    // Get or create cart
    const cart = await getCart(req);
    
    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      const newQty = cart.items[existingItemIndex].quantity + parseInt(quantity);
      
      // Check if new quantity exceeds stock
      if (newQty > product.stock) {
        req.flash('error_msg', 'Cannot add more of this item (stock limit)');
        return res.redirect('/cart');
      }
      
      cart.items[existingItemIndex].quantity = newQty;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity)
      });
    }
    
    await cart.save();
    req.flash('success_msg', 'Item added to cart');
    
    // Redirect based on request source
    const referer = req.get('referer');
    if (referer && referer.includes('/products/')) {
      res.redirect('/cart');
    } else {
      res.redirect(referer || '/products');
    }
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding item to cart');
    res.redirect('/products');
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;
    
    // Get cart
    const cart = await getCart(req);
    
    // Find item in cart
    const item = cart.items.id(itemId);
    if (!item) {
      req.flash('error_msg', 'Item not found in cart');
      return res.redirect('/cart');
    }
    
    // Check stock
    const product = await Product.findById(item.product);
    if (parseInt(quantity) > product.stock) {
      req.flash('error_msg', 'Not enough stock available');
      return res.redirect('/cart');
    }
    
    // Update quantity
    if (parseInt(quantity) <= 0) {
      // Remove item if quantity is 0 or negative
      item.remove();
    } else {
      item.quantity = parseInt(quantity);
    }
    
    await cart.save();
    req.flash('success_msg', 'Cart updated');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating cart');
    res.redirect('/cart');
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Get cart
    const cart = await getCart(req);
    
    // Find and remove item
    const item = cart.items.id(itemId);
    if (item) {
      item.remove();
      await cart.save();
      req.flash('success_msg', 'Item removed from cart');
    } else {
      req.flash('error_msg', 'Item not found in cart');
    }
    
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error removing item from cart');
    res.redirect('/cart');
  }
};

exports.clearCart = async (req, res) => {
  try {
    // Get cart
    const cart = await getCart(req);
    
    // Clear items
    cart.items = [];
    await cart.save();
    
    req.flash('success_msg', 'Cart cleared');
    res.redirect('/cart');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error clearing cart');
    res.redirect('/cart');
  }
};