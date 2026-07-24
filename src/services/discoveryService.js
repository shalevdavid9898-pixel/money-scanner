const marketData = require('./marketData');
const claude = require('./claude');
const boxes = require('./boxes');
const discoveryRepo = require('../repositories/discoveryRepo');

async function verifyCandidate(cand) {
  const [quote, ma, fundamentals] = await Promise.all([
    marketData.getQuote(cand.t, 'US'),
    marketData.getMovingAverages(cand.t, 'US'),
    marketData.getFundamentals(cand.t, 'US'),
  ]);
  if (quote.price == null) return null;
  let sectorMomentum = null;
  if (fundamentals.sector) {
    sectorMomentum = await marketData.getSectorMomentum(fundamentals.sector);
  }
  return {
    t: cand.t.toUpperCase(),
    name: cand.name,
    price: quote.price,
    sma50: ma.sma50,
    sma200: ma.sma200,
    revenueGrowth: fundamentals.revenueGrowth,
    grossMargin: fundamentals.grossMargin,
    operatingMargin: fundamentals.operatingMargin,
    roe: fundamentals.roe,
    sector: fundamentals.sector,
    sectorMomentum,
  };
}

async function analyzeText(text) {
  const extracted = await claude.extractTickers(text);
  const now = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

  const verified = [];
  for (const cand of extracted) {
    try {
      const v = await verifyCandidate(cand);
      if (v) verified.push(v);
    } catch {
      // not a real/tradable ticker on Yahoo — drop it silently
    }
  }
  if (!verified.length) return [];

  const synthesized = await claude.synthesizeDiscovery(verified);
  const byTicker = new Map(synthesized.map((s) => [s.t.toUpperCase(), s]));

  const created = [];
  for (const v of verified) {
    const s = byTicker.get(v.t) || {};
    const boxUp = boxes.computeUpBox({ price: v.price, sma50: v.sma50, sma200: v.sma200 });
    const boxesResult = { ind: s.box_ind || 'warn', best: s.box_best || 'warn', up: boxUp };
    const verdict = boxes.computeVerdict(boxesResult);
    const row = await discoveryRepo.create({
      ticker: v.t,
      name: v.name,
      market: 'US',
      verdict,
      boxes: boxesResult,
      note: s.note || '',
      trigger: s.trigger_suggestion ?? null,
      date: now,
      excerpt: null,
    });
    created.push(row);
  }
  return created;
}

module.exports = { analyzeText };
