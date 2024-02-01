const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({

  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  items: [
    { 
      product: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        description: {
          type: String,
        }
      },
      quantity: {
        type: Number,
        required: true,
      },
    }
  ]
});

orderSchema.set('toJSON', { virtuals: false, versionKey: false });
const Order = new mongoose.model('Order', orderSchema);
module.exports = Order;