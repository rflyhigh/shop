// controllers/adminController.js
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

exports.renderDashboard = async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .populate('products.product', 'name');

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      productCount,
      orderCount,
      userCount,
      recentOrders
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading dashboard data');
    res.redirect('/admin');
  }
};

exports.renderProductList = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin/products', {
      title: 'Product Management',
      products
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading products');
    res.redirect('/admin');
  }
};

exports.renderAddProduct = (req, res) => {
  res.render('admin/add-product', {
    title: 'Add New Product'
  });
};

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;
    
    // Create basic product
    const product = new Product({
      name,
      description,
      price,
      category,
      imageUrl,
      stock: parseInt(stock)
    });

    // Handle gift card codes or account details based on category
    if (category === 'giftcard' && req.body.codes) {
      const codesArray = req.body.codes.split('\n').filter(code => code.trim() !== '');
      product.codes = codesArray.map(code => ({ code: code.trim(), used: false }));
    } else if (category === 'account' && req.body.accounts) {
      const accountsArray = req.body.accounts.split('\n').filter(account => account.trim() !== '');
      product.accounts = accountsArray.map(account => {
        const [username, password] = account.split(':').map(item => item.trim());
        return { username, password, used: false };
      });
    }

    await product.save();
    req.flash('success_msg', 'Product added successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error adding product');
    res.redirect('/admin/products/add');
  }
};

exports.renderEditProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/admin/products');
    }
    
    res.render('admin/edit-product', {
      title: 'Edit Product',
      product
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading product');
    res.redirect('/admin/products');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      req.flash('error_msg', 'Product not found');
      return res.redirect('/admin/products');
    }
    
    // Update basic info
    product.name = name;
    product.description = description;
    product.price = parseFloat(price);
    product.category = category;
    product.imageUrl = imageUrl;
    product.stock = parseInt(stock);
    
    // Update codes or accounts if provided
    if (category === 'giftcard' && req.body.codes) {
      const codesArray = req.body.codes.split('\n').filter(code => code.trim() !== '');
      
      // Keep track of used codes
      const usedCodes = product.codes.filter(code => code.used).map(code => code.code);
      
      // Create new codes array
      product.codes = codesArray.map(code => {
        const trimmedCode = code.trim();
        return {
          code: trimmedCode,
          used: usedCodes.includes(trimmedCode)
        };
      });
    } else if (category === 'account' && req.body.accounts) {
      const accountsArray = req.body.accounts.split('\n').filter(account => account.trim() !== '');
      
      // Keep track of used accounts
      const usedAccounts = product.accounts.filter(acc => acc.used).map(acc => `${acc.username}:${acc.password}`);
      
      // Create new accounts array
      product.accounts = accountsArray.map(account => {
        const [username, password] = account.split(':').map(item => item.trim());
        return {
          username,
          password,
          used: usedAccounts.includes(`${username}:${password}`)
        };
      });
    }
    
    await product.save();
    req.flash('success_msg', 'Product updated successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating product: ' + err.message);
    res.redirect(`/admin/products/edit/${req.params.id}`);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Product deleted successfully');
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error deleting product');
    res.redirect('/admin/products');
  }
};

exports.renderOrderList = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('products.product', 'name');
      
    res.render('admin/orders', {
      title: 'Order Management',
      orders
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading orders');
    res.redirect('/admin');
  }
};

exports.renderOrderDetails = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('products.product');
      
    if (!order) {
      req.flash('error_msg', 'Order not found');
      return res.redirect('/admin/orders');
    }
    
    res.render('admin/order-details', {
      title: 'Order Details',
      order
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error loading order details');
    res.redirect('/admin/orders');
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    req.flash('success_msg', 'Order status updated successfully');
    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating order status');
    res.redirect(`/admin/orders/${req.params.id}`);
  }
};