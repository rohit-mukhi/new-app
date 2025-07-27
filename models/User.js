const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const CartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 }
});

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['vendor', 'supplier', 'admin'], 
    required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  cart: [CartItemSchema],

  // ## ADD THESE FIELDS FOR THE RATING SYSTEM ##
  averageRating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  }
});

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

module.exports = mongoose.model('User', UserSchema);