// Fills the database with the same sample people and errands the frontend demo uses.
// Run once: npm run seed   (log in as meera@demo.in / password123 to test as another user)
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Errand from '../models/Errand.js';
import Rating from '../models/Rating.js';

// Keep CENTER identical to CENTER in the frontend's src/utils.js
const CENTER = { lat: 28.6139, lng: 77.209 };
const at = (label, dLat, dLng) => ({ label, lat: CENTER.lat + dLat, lng: CENTER.lng + dLng });
const P = {
  'Main Gate': at('Main Gate', 0, 0), Library: at('Library', 0.003, 0.002),
  'Hostel Block A': at('Hostel Block A', -0.004, 0.003), Canteen: at('Canteen', 0.002, -0.003),
  'Metro Station': at('Metro Station', 0.012, 0.008), 'Market Road': at('Market Road', -0.015, -0.01),
};

await connectDB();
await Promise.all([User.deleteMany({}), Errand.deleteMany({}), Rating.deleteMany({})]);

const [meera, rohan, aarav] = await Promise.all(
  [['Meera', 'meera@demo.in'], ['Rohan', 'rohan@demo.in'], ['Aarav', 'aarav@demo.in']]
    .map(([name, email]) => User.create({ name, email, password: 'password123' }))
);

const mk = (title, description, reward, place, requester) => ({
  title, description, reward, requester: requester._id,
  location: { type: 'Point', coordinates: [P[place].lng, P[place].lat], label: place },
});
await Errand.create([
  mk('Pick up my printouts', 'Two pages are waiting at the copy shop. Pay them ₹12 and bring me the sheets.', 30, 'Library', meera),
  mk('Two chai from the canteen', 'Less sugar in one. Bring them to Hostel Block A while they are hot.', 25, 'Canteen', rohan),
  mk('Collect a parcel at the Main Gate', 'The courier cannot enter campus. Meet him at the gate and carry it in.', 40, 'Main Gate', aarav),
  mk('Buy a power strip on Market Road', 'Any 4-socket strip under ₹400. I will pay you back on delivery.', 80, 'Market Road', meera),
  mk('Hand in my form at the metro help desk', 'The form is filled. Hand it over and bring back the receipt.', 60, 'Metro Station', rohan),
]);

console.log('Seeded 3 users (password: password123) and 5 errands.');
await mongoose.disconnect();
