const express = require('express');
const discoveryRepo = require('../repositories/discoveryRepo');
const stocksRepo = require('../repositories/stocksRepo');
const discoveryService = require('../services/discoveryService');

const router = express.Router();

router.get('/discovery', async (req, res, next) => {
  try {
    res.json(await discoveryRepo.list());
  } catch (err) {
    next(err);
  }
});

router.post('/discovery/analyze', async (req, res, next) => {
  try {
    const { text } = req.body || {};
    if (!text || text.trim().length < 30) {
      return res.status(400).json({ error: 'text too short' });
    }
    const candidates = await discoveryService.analyzeText(text.trim());
    res.status(201).json({ candidates });
  } catch (err) {
    next(err);
  }
});

router.post('/discovery/:id/promote', async (req, res, next) => {
  try {
    const candidate = await discoveryRepo.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'not found' });
    const existing = await stocksRepo.findByTicker(candidate.t);
    if (existing) {
      await discoveryRepo.remove(req.params.id);
      return res.status(409).json({ error: 'already tracked' });
    }
    const stock = await stocksRepo.create({
      ticker: candidate.t,
      market: candidate.mkt || 'US',
      trigger: candidate.trigger,
      note: candidate.note,
      boxes: candidate.boxes,
    });
    await discoveryRepo.remove(req.params.id);
    res.status(201).json(stock);
  } catch (err) {
    next(err);
  }
});

router.delete('/discovery/:id', async (req, res, next) => {
  try {
    await discoveryRepo.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
