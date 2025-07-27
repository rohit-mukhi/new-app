const mongoose = require('mongoose');

const GrievanceSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    default: 'Pending Review',
    enum: ['Pending Review', 'Under Investigation', 'Resolved'],
  },
   supplierNote: {
    type: String,
    trim: true,
    default: ''
  }
}, { timestamps: true });


module.exports = mongoose.model('Grievance', GrievanceSchema);