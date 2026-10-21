import axios from 'axios';
import { USE_MOCK, API_URL } from './config';
import { bus } from './realtime';
import { PLACES, km } from './utils';

/* ======================= REAL API (Express backend) ======================= */
const http = axios.create({ baseURL: API_URL });
http.interceptors.request.use((c) => {
  const t = localStorage.getItem('pr_token');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
const data = (p) => p.then((r) => r.data);

const realApi = {
  register: (b) => data(http.post('/auth/register', b)),
  login: (b) => data(http.post('/auth/login', b)),
  getMe: () => data(http.get('/auth/me')),
  getNearby: ({ lat, lng, radius }) => data(http.get('/errands/nearby', { params: { lat, lng, radius } })),
  createErrand: (b) => data(http.post('/errands', b)),
  getMyErrands: () => data(http.get('/errands/mine')),
  acceptErrand: (id) => data(http.patch(`/errands/${id}/accept`)),
  updateStatus: (id, status) => data(http.patch(`/errands/${id}/status`, { status })),
  markPaid: (id) => data(http.patch(`/errands/${id}/paid`)),
  rateErrand: (id, b) => data(http.post(`/errands/${id}/rating`, b)),
  getProfile: () => data(http.get('/users/me/profile')),
};

/* ================== MOCK API (sample data in localStorage) ================== */
const BOT = { _id: 'u_kabir', name: 'Kabir' };
const lag = () => new Promise((r) => setTimeout(r, 250));
const bad = (m) => { throw { response: { data: { message: m } } }; };
const rid = () => Math.random().toString(36).slice(2, 10);
const save = (d) => localStorage.setItem('pr_db', JSON.stringify(d));
const load = () => JSON.parse(localStorage.getItem('pr_db')) || seed();
const me = (d) => d.users.find((u) => u._id === localStorage.getItem('pr_token'));
const pub = (u) => ({ _id: u._id, name: u.name, email: u.email });
const avg = (d, uid) => {
  const r = d.ratings.filter((x) => x.toUserId === uid);
  return r.length ? +(r.reduce((s, x) => s + x.score, 0) / r.length).toFixed(1) : 0;
};

function seed() {
  const users = [
    { _id: 'u_meera', name: 'Meera', email: 'meera@demo.in', password: 'x' },
    { _id: 'u_rohan', name: 'Rohan', email: 'rohan@demo.in', password: 'x' },
    { _id: 'u_aarav', name: 'Aarav', email: 'aarav@demo.in', password: 'x' },
  ];
  const P = Object.fromEntries(PLACES.map((p) => [p.label, p]));
  const mk = (n, title, description, reward, place, by, mins) => ({
    _id: 'e_' + n, title, description, reward, status: 'posted', paid: false,
    location: { type: 'Point', coordinates: [place.lng, place.lat], label: place.label },
    requester: { _id: by._id, name: by.name }, runner: null,
    createdAt: new Date(Date.now() - mins * 60000).toISOString(), completedAt: null,
  });
  const errands = [
    mk(1, 'Pick up my printouts', 'Two pages are waiting at the copy shop. Pay them ₹12 and bring me the sheets.', 30, P['Library'], users[0], 6),
    mk(2, 'Two chai from the canteen', 'Less sugar in one. Bring them to Hostel Block A while they are hot.', 25, P['Canteen'], users[1], 14),
    mk(3, 'Collect a parcel at the Main Gate', 'The courier cannot enter campus. Meet him at the gate and carry it in.', 40, P['Main Gate'], users[2], 35),
    mk(4, 'Buy a power strip on Market Road', 'Any 4-socket strip under ₹400. I will pay you back on delivery.', 80, P['Market Road'], users[0], 50),
    mk(5, 'Hand in my form at the metro help desk', 'The form is filled. Hand it over and bring back the receipt.', 60, P['Metro Station'], users[1], 120),
  ];
  const d = { users, errands, ratings: [] };
  save(d);
  return d;
}

// Demo only: a sample runner (Kabir) moves your errand along so you can see live updates.
function advance(id, status) {
  const d = load(), e = d.errands.find((x) => x._id === id);
  if (!e) return;
  const prev = { accepted: 'posted', 'in-progress': 'accepted', completed: 'in-progress' }[status];
  if (e.status !== prev || (status !== 'accepted' && e.runner?._id !== BOT._id)) return;
  e.status = status;
  if (status === 'accepted') e.runner = BOT;
  if (status === 'completed') e.completedAt = new Date().toISOString();
  save(d);
  bus.emit(status === 'accepted' ? 'errand:accepted' : 'errand:updated', {
    errandId: id, requesterId: e.requester._id, title: e.title, status, runnerName: e.runner.name,
  });
}

const mockApi = {
  async register({ name, email, password }) {
    await lag();
    const d = load(), mail = email.toLowerCase();
    if (d.users.some((u) => u.email === mail)) bad('That email is already registered. Log in instead.');
    const u = { _id: 'u_' + rid(), name, email: mail, password };
    d.users.push(u); save(d);
    return { user: { ...pub(u), avgRating: 0 }, token: u._id };
  },
  async login({ email, password }) {
    await lag();
    const d = load();
    const u = d.users.find((x) => x.email === email.toLowerCase() && x.password === password);
    if (!u) bad('Email or password is wrong.');
    return { user: { ...pub(u), avgRating: avg(d, u._id) }, token: u._id };
  },
  async getMe() {
    await lag();
    const d = load(), u = me(d);
    if (!u) bad('Please log in again.');
    return { ...pub(u), avgRating: avg(d, u._id) };
  },
  async getNearby({ lat, lng, radius }) {
    await lag();
    const d = load(), u = me(d);
    return d.errands
      .filter((e) => e.status === 'posted' && e.requester._id !== u?._id)
      .map((e) => ({ ...e, distanceKm: km({ lat, lng }, { lat: e.location.coordinates[1], lng: e.location.coordinates[0] }) }))
      .filter((e) => e.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  },
  async createErrand(b) {
    await lag();
    const d = load(), u = me(d);
    const e = {
      _id: 'e_' + rid(), ...b, reward: Number(b.reward), status: 'posted', paid: false,
      requester: { _id: u._id, name: u.name }, runner: null,
      createdAt: new Date().toISOString(), completedAt: null,
    };
    d.errands.unshift(e); save(d);
    setTimeout(() => advance(e._id, 'accepted'), 7000);
    setTimeout(() => advance(e._id, 'in-progress'), 13000);
    setTimeout(() => advance(e._id, 'completed'), 19000);
    return e;
  },
  async getMyErrands() {
    await lag();
    const d = load(), u = me(d);
    const withRated = (e) => ({ ...e, rated: d.ratings.some((r) => r.errandId === e._id && r.fromUserId === u._id) });
    const byDate = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
    return {
      posted: d.errands.filter((e) => e.requester._id === u._id).map(withRated).sort(byDate),
      running: d.errands.filter((e) => e.runner?._id === u._id).map(withRated).sort(byDate),
    };
  },
  async acceptErrand(id) {
    await lag();
    const d = load(), u = me(d), e = d.errands.find((x) => x._id === id);
    if (!e || e.status !== 'posted') bad('Someone already took this errand.');
    if (e.requester._id === u._id) bad('You cannot accept your own errand.');
    e.status = 'accepted'; e.runner = { _id: u._id, name: u.name }; save(d);
    bus.emit('errand:accepted', { errandId: id, requesterId: e.requester._id, title: e.title, status: 'accepted', runnerName: u.name });
    return e;
  },
  async updateStatus(id, status) {
    await lag();
    const d = load(), u = me(d), e = d.errands.find((x) => x._id === id);
    if (!e || e.runner?._id !== u._id) bad('Only the runner can update this errand.');
    const next = { accepted: 'in-progress', 'in-progress': 'completed' }[e.status];
    if (next !== status) bad(`This errand cannot move to ${status} right now.`);
    e.status = status;
    if (status === 'completed') e.completedAt = new Date().toISOString();
    save(d);
    bus.emit('errand:updated', { errandId: id, requesterId: e.requester._id, title: e.title, status, runnerName: u.name });
    return e;
  },
  async markPaid(id) {
    await lag();
    const d = load(), u = me(d), e = d.errands.find((x) => x._id === id);
    if (!e || e.requester._id !== u._id) bad('Only the requester can mark an errand as paid.');
    if (e.status !== 'completed') bad('You can mark it as paid once the errand is completed.');
    e.paid = true; save(d);
    return e;
  },
  async rateErrand(id, { score, comment }) {
    await lag();
    const d = load(), u = me(d), e = d.errands.find((x) => x._id === id);
    if (!e || e.status !== 'completed') bad('You can rate once the errand is completed.');
    const to = e.requester._id === u._id ? e.runner : e.requester;
    if (!to || (e.requester._id !== u._id && e.runner?._id !== u._id)) bad('You were not part of this errand.');
    if (d.ratings.some((r) => r.errandId === id && r.fromUserId === u._id)) bad('You already rated this errand.');
    d.ratings.push({ _id: 'r_' + rid(), errandId: id, fromUserId: u._id, fromName: u.name, toUserId: to._id, score, comment, createdAt: new Date().toISOString() });
    save(d);
    return { ok: true };
  },
  async getProfile() {
    await lag();
    const d = load(), u = me(d);
    const reviews = d.ratings.filter((r) => r.toUserId === u._id);
    const ran = d.errands.filter((e) => e.runner?._id === u._id && e.status === 'completed');
    return {
      user: { ...pub(u), avgRating: avg(d, u._id) },
      stats: {
        posted: d.errands.filter((e) => e.requester._id === u._id).length,
        completedRuns: ran.length,
        earned: ran.filter((e) => e.paid).reduce((s, e) => s + e.reward, 0),
        ratingsCount: reviews.length,
      },
      reviews: reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    };
  },
};

export default USE_MOCK ? mockApi : realApi;
