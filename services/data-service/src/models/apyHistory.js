import mongoose from 'mongoose';

const apyHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  apy: { type: Number, required: true },
});

export default mongoose.model('APYHistory', apyHistorySchema);
