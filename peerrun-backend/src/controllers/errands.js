import mongoose from 'mongoose';
import Errand from '../models/Errand.js';
import Rating from '../models/Rating.js';
import User from '../models/User.js';
import { notifyUser } from '../socket.js';
import { HttpError, asyncHandler } from '../utils/HttpError.js';

const POPULATE = [{ path: 'requester', select: 'name' }, { path: 'runner', select: 'name' }];
const isId = (id) => mongoose.isValidObjectId(id);

// Tell the requester about a change. The frontend shows it as a live toast.
function notifyRequester(event, errand, runnerName) {
  const requesterId = String(errand.requester._id ?? errand.requester);
  notifyUser(requesterId, event, {
    errandId: String(errand._id),
    requesterId,
    title: errand.title,
    status: errand.status,
    runnerName,
  });
}

/* POST /api/errands */
export const createErrand = asyncHandler(async (req, res) => {
  const { title, description, reward, location } = req.body;
  const coords = location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2 || coords.some((n) => typeof n !== 'number')) {
    throw new HttpError(400, 'Pick a location for the errand.');
  }
  const errand = await Errand.create({
    title, description, reward: Number(reward),
    location: { type: 'Point', coordinates: coords, label: location.label || '' },
    requester: req.user.id,
  });
  res.status(201).json(await errand.populate(POPULATE));
});

/* GET /api/errands/nearby?lat=&lng=&radius=   (radius in km) */
export const getNearby = asyncHandler(async (req, res) => {
  const lat = Number(req.query.lat), lng = Number(req.query.lng);
  const radius = Math.min(Math.max(Number(req.query.radius) || 3, 0.1), 50);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new HttpError(400, 'Send valid lat and lng.');
  }

  // $geoNear: only open errands that are not mine, inside the radius, nearest first.
  // (Aggregation does not auto-cast ids, so the ObjectId is built by hand.)
  const results = await Errand.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceMeters',
        maxDistance: radius * 1000,
        spherical: true,
        query: { status: 'posted', requester: { $ne: new mongoose.Types.ObjectId(req.user.id) } },
      },
    },
    { $addFields: { distanceKm: { $divide: ['$distanceMeters', 1000] } } },
    { $limit: 50 },
  ]);
  res.json(await Errand.populate(results, POPULATE));
});

/* GET /api/errands/mine  ->  { posted, running } each errand has `rated` */
export const getMine = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const [posted, running] = await Promise.all([
    Errand.find({ requester: uid }).sort('-createdAt').populate(POPULATE).lean(),
    Errand.find({ runner: uid }).sort('-createdAt').populate(POPULATE).lean(),
  ]);
  const myRatings = await Rating.find({ fromUser: uid, errand: { $in: [...posted, ...running].map((e) => e._id) } })
    .select('errand').lean();
  const rated = new Set(myRatings.map((r) => String(r.errand)));
  const tag = (e) => ({ ...e, rated: rated.has(String(e._id)) });
  res.json({ posted: posted.map(tag), running: running.map(tag) });
});

/* PATCH /api/errands/:id/accept
   One atomic update: it only succeeds if the errand is STILL "posted", so two runners
   tapping Accept at the same moment cannot both win. */
export const acceptErrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) throw new HttpError(400, 'That id is not valid.');

  const errand = await Errand.findOneAndUpdate(
    { _id: id, status: 'posted', requester: { $ne: req.user.id } },
    { status: 'accepted', runner: req.user.id },
    { new: true }
  ).populate(POPULATE);

  if (!errand) {
    const existing = await Errand.findById(id).select('requester status');
    if (!existing) throw new HttpError(404, 'That errand no longer exists.');
    if (String(existing.requester) === req.user.id) throw new HttpError(400, 'You cannot accept your own errand.');
    throw new HttpError(409, 'Someone already took this errand.');
  }
  notifyRequester('errand:accepted', errand, errand.runner.name);
  res.json(errand);
});

/* PATCH /api/errands/:id/status   body: { status: 'in-progress' | 'completed' } */
const NEXT = { accepted: 'in-progress', 'in-progress': 'completed' };
const PREV = { 'in-progress': 'accepted', completed: 'in-progress' };

export const updateStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!isId(id)) throw new HttpError(400, 'That id is not valid.');
  if (!PREV[status]) throw new HttpError(400, 'Status must be in-progress or completed.');

  const update = { status, ...(status === 'completed' && { completedAt: new Date() }) };
  const errand = await Errand.findOneAndUpdate(
    { _id: id, runner: req.user.id, status: PREV[status] },
    update,
    { new: true }
  ).populate(POPULATE);

  if (!errand) {
    const existing = await Errand.findById(id).select('runner status');
    if (!existing) throw new HttpError(404, 'That errand no longer exists.');
    if (String(existing.runner) !== req.user.id) throw new HttpError(403, 'Only the runner can update this errand.');
    throw new HttpError(409, `This errand cannot move to ${status} right now.`);
  }
  notifyRequester('errand:updated', errand, errand.runner.name);
  res.json(errand);
});

/* PATCH /api/errands/:id/paid  (requester confirms they paid the runner; no real payments) */
export const markPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isId(id)) throw new HttpError(400, 'That id is not valid.');
  const errand = await Errand.findById(id);
  if (!errand) throw new HttpError(404, 'That errand no longer exists.');
  if (String(errand.requester) !== req.user.id) throw new HttpError(403, 'Only the requester can mark an errand as paid.');
  if (errand.status !== 'completed') throw new HttpError(400, 'You can mark it as paid once the errand is completed.');
  errand.paid = true;
  await errand.save();
  res.json(await errand.populate(POPULATE));
});

/* POST /api/errands/:id/rating   body: { score, comment } */
export const rateErrand = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const score = Number(req.body.score);
  if (!isId(id)) throw new HttpError(400, 'That id is not valid.');
  if (!Number.isInteger(score) || score < 1 || score > 5) throw new HttpError(400, 'Rating must be between 1 and 5.');

  const errand = await Errand.findById(id);
  if (!errand) throw new HttpError(404, 'That errand no longer exists.');
  if (errand.status !== 'completed') throw new HttpError(400, 'You can rate once the errand is completed.');

  const me = req.user.id;
  const isRequester = String(errand.requester) === me;
  const isRunner = String(errand.runner) === me;
  if (!isRequester && !isRunner) throw new HttpError(403, 'You were not part of this errand.');
  const toUser = isRequester ? errand.runner : errand.requester;

  try {
    await Rating.create({ errand: id, fromUser: me, toUser, score, comment: req.body.comment || '' });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'You already rated this errand.');
    throw err;
  }

  // Recompute and cache the other person's average rating.
  const [agg] = await Rating.aggregate([
    { $match: { toUser: new mongoose.Types.ObjectId(String(toUser)) } },
    { $group: { _id: null, avg: { $avg: '$score' }, n: { $sum: 1 } } },
  ]);
  await User.findByIdAndUpdate(toUser, { avgRating: Math.round(agg.avg * 10) / 10, ratingsCount: agg.n });
  res.status(201).json({ ok: true });
});
