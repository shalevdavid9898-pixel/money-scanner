const crypto = require('crypto');
const cookie = require('cookie');
const config = require('../config');

const COOKIE_NAME = 'session';

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAuth(req, res, next) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const session = cookies[COOKIE_NAME];
  if (session && timingSafeEqualStr(session, config.sessionSecret)) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
}

module.exports = { requireAuth, timingSafeEqualStr, COOKIE_NAME };
