const express = require('express');
const stocksRepo = require('../repositories/stocksRepo');
const discoveryRepo = require('../repositories/discoveryRepo');
const reportsRepo = require('../repositories/reportsRepo');
const settingsRepo = require('../repositories/settingsRepo');

const router = express.Router();

router.get('/state', async (req, res, next) => {
  try {
    const [watchlist, discovery, reports, lastScan] = await Promise.all([
      stocksRepo.list(),
      discoveryRepo.list(),
      reportsRepo.list(),
      settingsRepo.get('last_scan_at'),
    ]);
    res.json({ watchlist, discovery, reports, lastScan });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
