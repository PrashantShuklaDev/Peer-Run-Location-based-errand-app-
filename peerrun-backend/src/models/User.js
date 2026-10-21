import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required.'], trim: true, minlength: [2, 'Name needs at least 2 characters.'], maxlength: 50 },
    email: { type: String, required: [true, 'Email is required.'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email.'] },
    password: { type: String, required: true, minlength: [6, 'Password needs at least 6 characters.'], select: false },
    // Cached so the profile and navbar do not recompute it every time. Updated whenever a rating is written.
    avgRating: { type: Number, default: 0 },
    ratingsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Shape the frontend expects: { _id, name, email, avgRating }
userSchema.methods.toPublic = function () {
  return { _id: this._id, name: this.name, email: this.email, avgRating: this.avgRating };
};

export default mongoose.model('User', userSchema);
