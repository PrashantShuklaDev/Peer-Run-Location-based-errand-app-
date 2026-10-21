import Errand from '../models/Errand.js';
import Rating from '../models/Rating.js';
import User from '../models/User.js';
import { HttpError, asyncHandler } from '../utils/HttpError.js';

/* GET /api/users/me/profile */
export const getProfile = asyncHandler(async (req, res) => {
  const uid = req.user.id;
  const user = await User.findById(uid);
  if (!user) throw new HttpError(401, 'Please log in again.');

  const [posted, completedRuns, paidRuns, reviews] = await Promise.all([
    Errand.countDocuments({ requester: uid }),
    Errand.countDocuments({ runner: uid, status: 'completed' }),
    Errand.find({ runner: uid, status: 'completed', paid: true }).select('reward').lean(),
    Rating.find({ toUser: uid }).sort('-createdAt').limit(50).populate('fromUser', 'name').lean(),
  ]);

  res.json({
    user: user.toPublic(),
    stats: {
      posted,
      completedRuns,
      earned: paidRuns.reduce((sum, e) => sum + e.reward, 0),
      ratingsCount: user.ratingsCount,
    },
    reviews: reviews.map((r) => ({
      _id: r._id, score: r.score, comment: r.comment, createdAt: r.createdAt, fromName: r.fromUser?.name || 'Someone',
    })),
  });
});
