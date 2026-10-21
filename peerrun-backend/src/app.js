import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import errandRoutes from './routes/errands.js';
import userRoutes from './routes/users.js';
import { errorHandler, notFound } from './middleware/error.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '50kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/errands', errandRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);
export default app;
