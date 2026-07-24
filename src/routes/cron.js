const express = require('express');
const { requireCronSecret } = require('../middleware/cronAuth');
const scanService = require('../services/scanService');

const router = express.Router();

router.post('/cron/scan', requireCronSecret, async (req, res, next) => {
  try {
    const result = await scanService.runScan('hourly_auto');
    res.json({ ok: true, changed: result.changes.length, lastScan: result.lastScan });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
