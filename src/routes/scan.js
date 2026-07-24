const express = require('express');
const scanService = require('../services/scanService');

const router = express.Router();

router.post('/scan', async (req, res, next) => {
  try {
    const result = await scanService.runScan('manual_scan');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
