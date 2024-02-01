const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    image: {
      type: String,
      required: true,
    }
});

productSchema.set('toJSON', { virtuals: false, versionKey: false });
const Product = new mongoose.model('Product', productSchema);
module.exports = Product;