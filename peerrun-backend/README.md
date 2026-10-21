# PeerRun backend (Express + MongoDB + Socket.io)

## Run it
1. Have MongoDB running locally (`mongodb://127.0.0.1:27017`), or paste a MongoDB Atlas URI into `.env`.
2. ```
   npm install
   cp .env.example .env     # then set JWT_SECRET to any long random string
   npm run seed             # optional: same sample people and errands as the frontend demo
   npm run dev              # API + Socket.io on http://localhost:5000
   ```
3. Frontend: set `VITE_USE_MOCK=false` in the frontend `.env`, restart `npm run dev` there.
   The frontend must run on http://localhost:5173 (or change `CLIENT_URL` in this `.env`, it is used for CORS and Socket.io).

Seeded logins: `meera@demo.in`, `rohan@demo.in`, `aarav@demo.in`, password `password123`.

## Test real-time with two accounts
Log in as yourself in a normal window and as meera@demo.in in a private window. Post an errand as one, accept it as the other, and the requester gets a live toast. Keep the map centre in `seed.js` and the frontend `src/utils.js` identical.

## Automated check
`npm test` starts a throwaway in-memory MongoDB (downloads it the first time) and exercises every endpoint plus Socket.io: radius search, nearest-first order, the double-accept race, status rules, payments, ratings, profile.

## Where things are
- `models/Errand.js`: GeoJSON `location` and the `2dsphere` index
- `controllers/errands.js`: `$geoNear` search, atomic accept, status rules, ratings
- `socket.js`: JWT handshake, one private room per user, `notifyUser()`
- `middleware/`: JWT `protect`, error handler (every error is `{ message }`)
