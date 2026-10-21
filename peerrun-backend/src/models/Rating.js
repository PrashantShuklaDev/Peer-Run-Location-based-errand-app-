import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    errand: { type: mongoose.Schema.Types.ObjectId, ref: 'Errand', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

// One rating per person per errand, enforced by the database, not just the code.
ratingSchema.index({ errand: 1, fromUser: 1 }, { unique: true });
ratingSchema.index({ toUser: 1, createdAt: -1 });

export default mongoose.model('Rating', ratingSchema);
