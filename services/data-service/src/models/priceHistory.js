import mongoose from 'mongoose';

const priceHistorySchema = new mongoose.Schema({
  token: { type: String, required: true },
  timestamp: { type: Date, required: true },
  price: { type: Number, required: true },
});

export default mongoose.model('PriceHistory', priceHistorySchema);
