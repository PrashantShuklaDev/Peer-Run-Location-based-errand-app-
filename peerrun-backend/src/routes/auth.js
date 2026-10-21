import { Router } from 'express';
import { getMe, login, register } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.post('/register', register);
r.post('/login', login);
r.get('/me', protect, getMe);
export default r;
