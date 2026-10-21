# PeerRun frontend (React + Vite + Tailwind)

## Run it
```
npm install
npm run dev
```
Opens at http://localhost:5173. `.env` has `VITE_USE_MOCK=true`, so everything works with sample data stored in your browser. No backend needed yet.

## Switching to the real backend (next step)
Set `VITE_USE_MOCK=false` in `.env`. All calls live in `src/api.js` (`realApi`); the pages never change.

### REST contract the Express backend must match
| Method | Route | Body / query | Returns |
|---|---|---|---|
| POST | /api/auth/register | name, email, password | { user, token } |
| POST | /api/auth/login | email, password | { user, token } |
| GET | /api/auth/me | | user (with avgRating) |
| GET | /api/errands/nearby | lat, lng, radius (km) | errands with distanceKm, status "posted", not the caller's own, nearest first |
| POST | /api/errands | title, description, reward, location { type:"Point", coordinates:[lng,lat], label } | errand |
| GET | /api/errands/mine | | { posted: [...], running: [...] }, each with `rated` boolean |
| PATCH | /api/errands/:id/accept | | errand |
| PATCH | /api/errands/:id/status | status: "in-progress" or "completed" | errand |
| PATCH | /api/errands/:id/paid | | errand |
| POST | /api/errands/:id/rating | score (1-5), comment | { ok: true } |
| GET | /api/users/me/profile | | { user, stats:{posted,completedRuns,earned,ratingsCount}, reviews:[{score,comment,fromName,createdAt}] } |

Errand shape: `{ _id, title, description, reward, status, paid, location:{type,coordinates,label}, requester:{_id,name}, runner:{_id,name}|null, createdAt, completedAt }`

### Socket.io events (server to requester)
`errand:accepted` and `errand:updated`, payload `{ errandId, requesterId, title, status, runnerName }`. The client connects with `auth: { token }`.
