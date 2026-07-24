const express = require('express');
const stocksRepo = require('../repositories/stocksRepo');

const router = express.Router();

function parseNumberOrNull(v) {
  if (v === '' || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

router.get('/stocks', async (req, res, next) => {
  try {
    res.json(await stocksRepo.list());
  } catch (err) {
    next(err);
  }
});

router.post('/stocks', async (req, res, next) => {
  try {
    const { ticker, market, trigger } = req.body || {};
    if (!ticker || typeof ticker !== 'string' || !ticker.trim()) {
      return res.status(400).json({ error: 'missing ticker' });
    }
    const existing = await stocksRepo.findByTicker(ticker.trim());
    if (existing) return res.status(409).json({ error: 'already tracked' });
    const created = await stocksRepo.create({
      ticker: ticker.trim(),
      market: ['US', 'TASE', 'CRYPTO'].includes(market) ? market : 'US',
      trigger: parseNumberOrNull(trigger),
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/stocks/:id', async (req, res, next) => {
  try {
    const stock = await stocksRepo.findById(req.params.id);
    if (!stock) return res.status(404).json({ error: 'not found' });
    const fields = {};
    if ('trigger' in req.body) fields.trigger = parseNumberOrNull(req.body.trigger);
    if ('warn' in req.body) fields.warn = parseNumberOrNull(req.body.warn);
    if ('note' in req.body) fields.note = req.body.note;
    const updated = await stocksRepo.update(req.params.id, fields);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/stocks/:id', async (req, res, next) => {
  try {
    await stocksRepo.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
