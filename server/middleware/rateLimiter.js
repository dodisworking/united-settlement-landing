const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 5,
  message: {
    success: false,
    message: 'Too many requests. Please try again later or call us at (516) 231-9239.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use X-Forwarded-For behind proxies (Railway, Render, etc.)
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
  }
});

module.exports = limiter;
