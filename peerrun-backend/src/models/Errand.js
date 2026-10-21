import mongoose from 'mongoose';

export const STATUSES = ['posted', 'accepted', 'in-progress', 'completed'];

const errandSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Title is required.'], trim: true, maxlength: [80, 'Title can be at most 80 characters.'] },
    description: { type: String, required: [true, 'Details are required.'], trim: true, maxlength: [300, 'Details can be at most 300 characters.'] },
    reward: { type: Number, required: [true, 'Reward is required.'], min: [5, 'Minimum reward is ₹5.'], max: [5000, 'Maximum reward is ₹5000.'] },
    status: { type: String, enum: STATUSES, default: 'posted' },
    paid: { type: Boolean, default: false },
    // GeoJSON Point. NOTE: coordinates are [longitude, latitude], in that order.
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (c) => c.length === 2 && c[0] >= -180 && c[0] <= 180 && c[1] >= -90 && c[1] <= 90,
          message: 'Location needs valid [longitude, latitude] coordinates.',
        },
      },
      label: { type: String, default: '', trim: true, maxlength: 80 },
    },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    runner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// This index is what makes $geoNear ("errands within 3 km, nearest first") possible.
errandSchema.index({ location: '2dsphere' });
errandSchema.index({ requester: 1, createdAt: -1 });
errandSchema.index({ runner: 1, createdAt: -1 });

export default mongoose.model('Errand', errandSchema);
