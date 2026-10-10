/**
 * Tiny in-memory rate limiter (no extra package needed).
 * Limits how many requests one IP address can make in a time window.
 * Good enough for a single server; use Redis-based limiting if you ever run several servers.
 */
export function rateLimit({ windowMs = 15 * 60 * 1000, max = 30, message = 'Too many attempts. Please wait a few minutes and try again.' } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  // forget old entries now and then so memory does not grow forever
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.resetAt <= now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    let h = hits.get(ip);
    if (!h || h.resetAt <= now) {
      h = { count: 0, resetAt: now + windowMs };
      hits.set(ip, h);
    }
    h.count += 1;
    if (h.count > max) {
      res.set('Retry-After', String(Math.ceil((h.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

export default rateLimit;
