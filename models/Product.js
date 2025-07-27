const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'dozen', 'piece', 'bunch', 'litre'],
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  // Unique code for trust, can be generated upon creation
  uniqueCode: {
    type: String,
    required: true,
    unique: true
  }, image: {
    type: String,
    required: 'Please upload an image.',
  },
  cloudinaryId: {
    type: String,
    required: true,
  },
   stock: {
    type: Number,
    required: true,
    default: 0
  },
  unitsSold: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);