// controllers/paymentController.js
const axios = require('axios');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD
  }
});

// Helper to get cart
const getCart = async (req) => {
  if (req.user) {
    return await Cart.findOne({ user: req.user._id }).populate('items.product');
  } else {
    return await Cart.findOne({ sessionId: req.sessionID }).populate('items.product');
  }
};

exports.checkout = async (req, res) => {
  try {
    const cart = await getCart(req);
    
    if (!cart || cart.items.length === 0) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }
    
    // Calculate total
    let total = 0;
    cart.items.forEach(item => {
      total += item.product.price * item.quantity;
    });
    
    res.render('payment/checkout', {
      title: 'Checkout',
      cart,
      total,
      email: req.user ? req.user.email : ''
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error processing checkout');
    res.redirect('/cart');
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { email } = req.body;
    const cart = await getCart(req);
    
    if (!cart || cart.items.length === 0) {
      req.flash('error_msg', 'Your cart is empty');
      return res.redirect('/cart');
    }
    
    // Calculate total
    let total = 0;
    cart.items.forEach(item => {
      total += item.product.price * item.quantity;
    });
    
    // Get base URL from environment variable
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    
    // Create payment via NOWPayments API
    const response = await axios.post(
      'https://api.nowpayments.io/v1/invoice',
      {
        price_amount: total,
        price_currency: 'USD',
        order_id: `ORDER-${Date.now()}`,
        order_description: `Purchase from Keykardz.shop`,
        ipn_callback_url: `${baseUrl}/payment/ipn`,
        success_url: `${baseUrl}/payment/success`,
        cancel_url: `${baseUrl}/payment/cancel`
      },
      {
        headers: {
          'x-api-key': process.env.NOWPAYMENTS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Create initial order in database
    const order = new Order({
      user: req.user ? req.user._id : null,
      guestEmail: req.user ? null : email,
      products: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
      })),
      totalAmount: total,
      paymentId: response.data.id,
      status: 'pending'
    });
    
    await order.save();
    
    // Redirect to payment page
    res.redirect(response.data.invoice_url);
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating payment');
    res.redirect('/payment/checkout');
  }
};

exports.handleIPN = async (req, res) => {
  try {
    console.log('IPN received:', JSON.stringify(req.body));
    
    // Verify IPN signature
    const hmac = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET);
    const payload = JSON.stringify(req.body);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    
    if (req.headers['x-nowpayments-sig'] !== signature) {
      console.error('Invalid IPN signature');
      return res.status(401).send('Invalid signature');
    }
    
    const { order_id, payment_status, pay_address, price_amount } = req.body;
    
    // Find the order
    const order = await Order.findOne({ paymentId: order_id });
    
    if (!order) {
      console.error('Order not found:', order_id);
      return res.status(404).send('Order not found');
    }
    
    console.log(`Processing order ${order._id} with status ${payment_status}`);
    
    // Update order status based on payment status
    if (payment_status === 'confirmed' || payment_status === 'finished') {
      // Payment successful
      order.status = 'completed';
      
      // Process digital items (assign codes or account details)
      for (const orderItem of order.products) {
        const product = await Product.findById(orderItem.product);
        
        if (!product) {
          console.error(`Product not found: ${orderItem.product}`);
          continue;
        }
        
        if (product.category === 'giftcard') {
          // Assign gift card codes
          const availableCodes = product.codes.filter(code => !code.used);
          const codesNeeded = orderItem.quantity;
          
          if (availableCodes.length < codesNeeded) {
            console.error(`Not enough codes available for product ${product._id}`);
            continue;
          }
          
          const assignedCodes = [];
          for (let i = 0; i < codesNeeded; i++) {
            availableCodes[i].used = true;
            assignedCodes.push(availableCodes[i].code);
          }
          
          orderItem.codes = assignedCodes;
          await product.save();
        } else if (product.category === 'account') {
          // Assign accounts
          const availableAccounts = product.accounts.filter(account => !account.used);
          const accountsNeeded = orderItem.quantity;
          
          if (availableAccounts.length < accountsNeeded) {
            console.error(`Not enough accounts available for product ${product._id}`);
            continue;
          }
          
          const assignedAccounts = [];
          for (let i = 0; i < accountsNeeded; i++) {
            availableAccounts[i].used = true;
            assignedAccounts.push({
              username: availableAccounts[i].username,
              password: availableAccounts[i].password
            });
          }
          
          orderItem.accounts = assignedAccounts;
          await product.save();
        }
        
        // Update stock
        product.stock -= orderItem.quantity;
        await product.save();
      }
      
      await order.save();
      
      // Send email with digital items
      const email = order.user ? (await order.user.populate('email')).email : order.guestEmail;
      
      // Populate product details for email
      await order.populate('products.product');
      
      try {
        // Send email
        await transporter.sendMail({
          from: `"Keykardz Shop" <${process.env.EMAIL_USERNAME}>`,
          to: email,
          subject: 'Your Keykardz Purchase',
          html: `
            <h1>Thank you for your purchase!</h1>
            <p>Your order has been completed successfully.</p>
            <h2>Order Details:</h2>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total Amount:</strong> $${order.totalAmount.toFixed(2)}</p>
            <h3>Items:</h3>
            <ul>
              ${order.products.map(item => `
                <li>
                  <strong>${item.product.name} x ${item.quantity}</strong><br>
                  ${item.codes && item.codes.length > 0 ? 
                    `<strong>Gift Card Codes:</strong><br>${item.codes.join('<br>')}` : ''}
                  ${item.accounts && item.accounts.length > 0 ? 
                    `<strong>Account Details:</strong><br>${item.accounts.map(acc => 
                      `Username: ${acc.username}<br>Password: ${acc.password}`).join('<br><br>')}` : ''}
                </li>
              `).join('')}
            </ul>
            <p>Thank you for shopping with Keykardz!</p>
          `
        });
        console.log(`Order confirmation email sent to ${email}`);
      } catch (emailErr) {
        console.error('Error sending email:', emailErr);
      }
      
      // Clear the cart
      if (order.user) {
        await Cart.findOneAndUpdate({ user: order.user }, { $set: { items: [] } });
      } else {
        // For guest users, we would need the session ID which we don't have in IPN
        // This will be handled when they return to the success page
      }
    } else if (payment_status === 'failed' || payment_status === 'expired') {
      // Payment failed
      order.status = 'failed';
      await order.save();
      console.log(`Order ${order._id} marked as failed`);
    }
    
    res.status(200).send('IPN received');
  } catch (err) {
    console.error('Error processing IPN:', err);
    res.status(500).send('Error processing IPN');
  }
};

exports.paymentSuccess = async (req, res) => {
  try {
    // Clear cart for guest users (for logged in users, it's done in IPN)
    if (!req.user) {
      await Cart.findOneAndUpdate(
        { sessionId: req.sessionID },
        { $set: { items: [] } }
      );
    }
    
    res.render('payment/success', {
      title: 'Payment Successful'
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error processing payment success');
    res.redirect('/');
  }
};

exports.paymentCancel = (req, res) => {
  req.flash('error_msg', 'Payment was cancelled');
  res.redirect('/cart');
};