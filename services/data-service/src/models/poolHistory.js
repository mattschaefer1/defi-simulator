import mongoose from 'mongoose';

const poolHistorySchema = new mongoose.Schema({
  poolId: { type: String, required: true },
  timestamp: { type: Date, required: true },
  tvl: { type: Number, required: true },
  volume: { type: Number, required: true },
  fees: { type: Number, required: true },
});

export default mongoose.model('PoolHistory', poolHistorySchema);
