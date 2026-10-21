// End-to-end check of every endpoint + Socket.io, using a throwaway in-memory MongoDB.
import { MongoMemoryServer } from 'mongodb-memory-server';
import http from 'http';
import { io as ioc } from 'socket.io-client';
import assert from 'assert';

process.env.JWT_SECRET = 'test-secret';
process.env.CLIENT_URL = 'http://localhost:5173';

const mongod = await MongoMemoryServer.create();
const { connectDB } = await import('../src/config/db.js');
const { default: app } = await import('../src/app.js');
const { initSocket } = await import('../src/socket.js');
const { default: Errand } = await import('../src/models/Errand.js');
const { default: User } = await import('../src/models/User.js');
const { default: Rating } = await import('../src/models/Rating.js');

await connectDB(mongod.getUri());
await Promise.all([User.init(), Errand.init(), Rating.init()]);
const server = http.createServer(app);
initSocket(server);
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const call = async (method, path, token, body) => {
  const res = await fetch(base + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
};
const ok = (name) => console.log('  ok  ', name);

// ---- auth
const a = await call('POST', '/auth/register', null, { name: 'Asha', email: 'Asha@x.in', password: 'secret1' });
assert.equal(a.status, 201); assert(a.body.token); assert.equal(a.body.user.email, 'asha@x.in'); assert(!a.body.user.password);
ok('register (email lowercased, no password leaked)');
assert.equal((await call('POST', '/auth/register', null, { name: 'Asha', email: 'asha@x.in', password: 'secret1' })).status, 409);
ok('duplicate email rejected (409)');
assert.equal((await call('POST', '/auth/login', null, { email: 'asha@x.in', password: 'nope' })).status, 401);
ok('wrong password rejected (401)');
const b = await call('POST', '/auth/register', null, { name: 'Bilal', email: 'bilal@x.in', password: 'secret2' });
const A = a.body.token, B = b.body.token;
assert.equal((await call('GET', '/auth/me', A)).body.name, 'Asha');
assert.equal((await call('GET', '/errands/mine')).status, 401);
ok('/auth/me works, protected routes need a token');

// ---- real-time: Asha (requester) listens
const events = [];
const sock = ioc(base, { auth: { token: A } });
await new Promise((res, rej) => { sock.on('connect', res); sock.on('connect_error', rej); });
sock.on('errand:accepted', (p) => events.push(['accepted', p]));
sock.on('errand:updated', (p) => events.push(['updated', p]));
const bad = ioc(base, { auth: { token: 'garbage' } });
await new Promise((res) => bad.on('connect_error', (e) => { assert.equal(e.message, 'Unauthorized'); res(); }));
ok('socket connects with a valid JWT, rejects a bad one');

// ---- geospatial
const here = [77.209, 28.6139]; // [lng, lat]
const mk = (title, lng, lat) => call('POST', '/errands', A, { title, description: 'd', reward: 30, location: { type: 'Point', coordinates: [lng, lat], label: title } });
const near = await mk('Near (about 0.4 km)', 77.211, 28.6169);
const far = await mk('Far (about 1.9 km)', 77.199, 28.5989);
const veryFar = await mk('Very far (about 15 km)', 77.3, 28.7);
assert.equal(near.status, 201);
assert.equal((await call('POST', '/errands', A, { title: 't', description: 'd', reward: 1, location: { coordinates: here } })).status, 400);
assert.equal((await call('POST', '/errands', A, { title: 't', description: 'd', reward: 30 })).status, 400);
ok('create errand + validation (min reward, missing location)');

const q = (r) => call('GET', `/errands/nearby?lat=28.6139&lng=77.209&radius=${r}`, B);
const r3 = await q(3);
assert.deepEqual(r3.body.map((e) => e.title), ['Near (about 0.4 km)', 'Far (about 1.9 km)']);
assert(r3.body[0].distanceKm > 0.3 && r3.body[0].distanceKm < 0.6, `distanceKm was ${r3.body[0].distanceKm}`);
assert.equal(r3.body[0].requester.name, 'Asha'); assert.equal(r3.body[0].runner, null);
assert.equal((await q(1)).body.length, 1);
assert.equal((await q(20)).body.length, 3);
assert.equal((await call('GET', '/errands/nearby?lat=28.6139&lng=77.209&radius=20', A)).body.length, 0);
ok('$geoNear: radius filter, nearest-first, distanceKm, own errands hidden');

// ---- lifecycle
const id = near.body._id;
assert.equal((await call('PATCH', `/errands/${id}/accept`, A)).status, 400);
ok('cannot accept your own errand');
const [x, y] = await Promise.all([call('PATCH', `/errands/${id}/accept`, B), call('PATCH', `/errands/${id}/accept`, B)]);
assert.deepEqual([x.status, y.status].sort(), [200, 409]);
ok('two simultaneous accepts: exactly one wins (200 + 409)');
assert.equal((await q(3)).body.length, 1);
await new Promise((r) => setTimeout(r, 200));
assert.equal(events[0][0], 'accepted'); assert.equal(events[0][1].runnerName, 'Bilal'); assert.equal(events[0][1].requesterId, a.body.user._id);
ok('requester got errand:accepted over Socket.io');

assert.equal((await call('PATCH', `/errands/${id}/status`, B, { status: 'completed' })).status, 409);
assert.equal((await call('PATCH', `/errands/${id}/status`, A, { status: 'in-progress' })).status, 403);
assert.equal((await call('PATCH', `/errands/${id}/status`, B, { status: 'in-progress' })).body.status, 'in-progress');
const done = await call('PATCH', `/errands/${id}/status`, B, { status: 'completed' });
assert.equal(done.body.status, 'completed'); assert(done.body.completedAt);
await new Promise((r) => setTimeout(r, 200));
assert.deepEqual(events.slice(1).map((e) => e[1].status), ['in-progress', 'completed']);
ok('status order enforced, only runner can move it, updates pushed live');

// ---- paid + ratings
assert.equal((await call('PATCH', `/errands/${id}/paid`, B)).status, 403);
assert.equal((await call('PATCH', `/errands/${id}/paid`, A)).body.paid, true);
assert.equal((await call('POST', `/errands/${id}/rating`, A, { score: 9 })).status, 400);
assert.equal((await call('POST', `/errands/${id}/rating`, A, { score: 5, comment: 'Quick!' })).status, 201);
assert.equal((await call('POST', `/errands/${id}/rating`, A, { score: 4 })).status, 409);
assert.equal((await call('POST', `/errands/${id}/rating`, B, { score: 3 })).status, 201);
const mine = await call('GET', '/errands/mine', A);
assert.equal(mine.body.posted.find((e) => e._id === id).rated, true);
assert.equal(mine.body.posted.find((e) => e._id === far.body._id).rated, false);
ok('mark paid (requester only), ratings validated, one per person, `rated` flag');

const pb = await call('GET', '/users/me/profile', B);
assert.equal(pb.body.user.avgRating, 5); assert.equal(pb.body.stats.completedRuns, 1);
assert.equal(pb.body.stats.earned, 30); assert.equal(pb.body.reviews[0].fromName, 'Asha');
const pa = await call('GET', '/users/me/profile', A);
assert.equal(pa.body.user.avgRating, 3); assert.equal(pa.body.stats.posted, 3);
ok('profile: avgRating, earned, reviews, stats');

sock.close(); bad.close(); server.close(); await mongod.stop();
console.log('\nAll checks passed.');
process.exit(0);
