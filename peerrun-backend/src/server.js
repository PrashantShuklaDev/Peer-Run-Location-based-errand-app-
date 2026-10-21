import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './socket.js';
import User from './models/User.js';
import Errand from './models/Errand.js';
import Rating from './models/Rating.js';

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env first.');
  process.exit(1);
}

await connectDB();
// Wait for indexes (2dsphere for $geoNear, unique email, one rating per person per errand)
await Promise.all([User.init(), Errand.init(), Rating.init()]);

const server = http.createServer(app);
initSocket(server);
server.listen(PORT, () => console.log(`PeerRun API + Socket.io on http://localhost:${PORT}`));
