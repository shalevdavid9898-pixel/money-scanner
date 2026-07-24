const express = require('express');
const cookie = require('cookie');
const config = require('../config');
const { timingSafeEqualStr, COOKIE_NAME } = require('../middleware/auth');

const router = express.Router();

function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  };
}

router.post('/login', (req, res) => {
  const { password } = req.body || {};
  if (typeof password !== 'string' || !timingSafeEqualStr(password, config.appPassword)) {
    return res.status(401).json({ error: 'invalid password' });
  }
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, config.sessionSecret, cookieOptions(60 * 60 * 24 * 365)));
  res.status(204).end();
});

router.post('/logout', (req, res) => {
  res.setHeader('Set-Cookie', cookie.serialize(COOKIE_NAME, '', cookieOptions(0)));
  res.status(204).end();
});

module.exports = router;
