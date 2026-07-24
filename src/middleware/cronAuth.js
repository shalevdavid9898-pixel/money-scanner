const crypto = require('crypto');
const config = require('../config');

function requireCronSecret(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token, 'utf8');
  const b = Buffer.from(config.cronSecret, 'utf8');
  if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
}

module.exports = { requireCronSecret };
