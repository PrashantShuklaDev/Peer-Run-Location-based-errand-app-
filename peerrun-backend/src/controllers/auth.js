import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { HttpError, asyncHandler } from '../utils/HttpError.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const user = await User.create({ name, email, password }); // password is hashed in the model
  res.status(201).json({ user: user.toPublic(), token: signToken(user._id) });
});

export const login = asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new HttpError(401, 'Email or password is wrong.');
  res.json({ user: user.toPublic(), token: signToken(user._id) });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new HttpError(401, 'Please log in again.');
  res.json(user.toPublic());
});
