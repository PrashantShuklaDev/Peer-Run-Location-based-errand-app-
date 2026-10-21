import { Router } from 'express';
import { acceptErrand, createErrand, getMine, getNearby, markPaid, rateErrand, updateStatus } from '../controllers/errands.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.post('/', createErrand);
r.get('/nearby', getNearby); // keep these two above any "/:id" route
r.get('/mine', getMine);
r.patch('/:id/accept', acceptErrand);
r.patch('/:id/status', updateStatus);
r.patch('/:id/paid', markPaid);
r.post('/:id/rating', rateErrand);
export default r;
