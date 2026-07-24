const express = require('express');
const reportsRepo = require('../repositories/reportsRepo');

const router = express.Router();

router.get('/reports', async (req, res, next) => {
  try {
    res.json(await reportsRepo.list());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
