// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['giftcard', 'account', 'currency', 'other']
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  codes: [{
    code: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  accounts: [{
    username: String,
    password: String,
    used: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', ProductSchema);