import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/HttpError.js';

export const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

// Protects a route: reads "Authorization: Bearer <token>" and sets req.user = { id }.
export function protect(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Please log in first.'));
  try {
    req.user = { id: verifyToken(token).id };
    next();
  } catch {
    next(new HttpError(401, 'Your session expired. Please log in again.'));
  }
}
