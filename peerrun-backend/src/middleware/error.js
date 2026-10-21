export const notFound = (req, res) => res.status(404).json({ message: `No route for ${req.method} ${req.originalUrl}` });

// Every error leaves as { message }, which is exactly what the frontend's errMsg() reads.
export function errorHandler(err, _req, res, _next) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors)[0].message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'That id is not valid.' });
  if (err.code === 11000) {
    const msg = err.keyPattern?.email ? 'That email is already registered. Log in instead.' : 'That already exists.';
    return res.status(409).json({ message: msg });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our side. Try again.' });
}
