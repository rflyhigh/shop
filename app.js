// app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const methodOverride = require('method-override');
const path = require('path');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

// Initialize app
const app = express();

// Connect to MongoDB
mongoose.set('strictQuery', false); 
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));
// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// EJS Layouts middleware
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Session configuration
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { maxAge: 60 * 60 * 1000 } // 1 hour
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  
  // Get cart count for header
  if (req.user) {
    const Cart = require('./models/Cart');
    Cart.findOne({ user: req.user._id })
      .then(cart => {
        if (cart) {
          let count = 0;
          cart.items.forEach(item => {
            count += item.quantity;
          });
          res.locals.cartCount = count;
        } else {
          res.locals.cartCount = 0;
        }
        next();
      })
      .catch(err => {
        console.error(err);
        res.locals.cartCount = 0;
        next();
      });
  } else if (req.sessionID) {
    const Cart = require('./models/Cart');
    Cart.findOne({ sessionId: req.sessionID })
      .then(cart => {
        if (cart) {
          let count = 0;
          cart.items.forEach(item => {
            count += item.quantity;
          });
          res.locals.cartCount = count;
        } else {
          res.locals.cartCount = 0;
        }
        next();
      })
      .catch(err => {
        console.error(err);
        res.locals.cartCount = 0;
        next();
      });
  } else {
    res.locals.cartCount = 0;
    next();
  }
});

// Routes
app.use('/', require('./routes/index'));
app.use('/auth', require('./routes/auth'));
app.use('/products', require('./routes/product'));
app.use('/cart', require('./routes/cart'));
app.use('/orders', require('./routes/order'));
app.use('/reviews', require('./routes/review'));
app.use('/admin', require('./routes/admin'));
app.use('/payment', require('./routes/payment'));

// Error handling
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));