// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');

exports.renderRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Register'
  });
};

exports.renderLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login'
  });
};

exports.register = async (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  // Check required fields
  if (!name || !email || !password || !password2) {
    errors.push({ msg: 'Please fill in all fields' });
  }

  // Check passwords match
  if (password !== password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  // Check password length
  if (password.length < 6) {
    errors.push({ msg: 'Password should be at least 6 characters' });
  }

  if (errors.length > 0) {
    return res.render('auth/register', {
      title: 'Register',
      errors,
      name,
      email
    });
  }

  try {
    // Check if user exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      errors.push({ msg: 'Email is already registered' });
      return res.render('auth/register', {
        title: 'Register',
        errors,
        name,
        email
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password
    });

    // Check if this is the admin email
    if (email === process.env.ADMIN_EMAIL) {
      newUser.isAdmin = true;
    }

    await newUser.save();
    req.flash('success_msg', 'You are now registered and can log in');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'An error occurred during registration');
    res.redirect('/auth/register');
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/auth/login');
  });
};