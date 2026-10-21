import { Router } from 'express';
import { getProfile } from '../controllers/users.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.get('/me/profile', protect, getProfile);
export default r;
