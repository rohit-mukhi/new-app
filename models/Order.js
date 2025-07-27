const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [{
    product: { type: Object, required: true },
    quantity: { type: Number, required: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  totalPrice: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: 'Pending',
    enum: ['Pending', 'Confirmed', 'Delivered', 'Cancelled'],
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  ratingGiven: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Order', OrderSchema);