const marketData = require('./marketData');
const claude = require('./claude');
const boxes = require('./boxes');
const stocksRepo = require('../repositories/stocksRepo');
const reportsRepo = require('../repositories/reportsRepo');
const settingsRepo = require('../repositories/settingsRepo');
const alertService = require('./alertService');

async function gatherStockData(stock) {
  const data = { t: stock.t, mkt: stock.mkt };
  try {
    const [quote, ma] = await Promise.all([
      marketData.getQuote(stock.t, stock.mkt),
      marketData.getMovingAverages(stock.t, stock.mkt),
    ]);
    Object.assign(data, quote, ma);
  } catch (err) {
    data.error = `market data failed: ${err.message}`;
  }
  try {
    const fundamentals = await marketData.getFundamentals(stock.t, stock.mkt);
    Object.assign(data, fundamentals);
    if (fundamentals.sector) {
      data.sectorMomentum = await marketData.getSectorMomentum(fundamentals.sector);
    }
  } catch (err) {
    data.fundamentalsError = `fundamentals failed: ${err.message}`;
  }
  return data;
}

async function runScan(kind = 'manual_scan') {
  const watchlist = await stocksRepo.list();
  if (!watchlist.length) {
    return { stocks: [], report: null, lastScan: null, changes: [] };
  }

  const gathered = await Promise.all(watchlist.map(gatherStockData));
  const gatheredByTicker = new Map(gathered.map((d) => [d.t, d]));

  const claudeInput = gathered.map((d) => ({
    t: d.t,
    price: d.price ?? null,
    sma50: d.sma50 ?? null,
    sma200: d.sma200 ?? null,
    revenueGrowth: d.revenueGrowth ?? null,
    grossMargin: d.grossMargin ?? null,
    operatingMargin: d.operatingMargin ?? null,
    roe: d.roe ?? null,
    sector: d.sector ?? null,
    sectorMomentum: d.sectorMomentum ?? null,
  }));

  const claudeResult = await claude.synthesizeScan(claudeInput);
  const claudeByTicker = new Map((claudeResult.stocks || []).map((s) => [s.t.toUpperCase(), s]));

  const finalStocks = [];
  for (const stock of watchlist) {
    const gd = gatheredByTicker.get(stock.t) || {};
    const cr = claudeByTicker.get(stock.t.toUpperCase()) || {};
    const upBox = boxes.computeUpBox({ price: gd.price, sma50: gd.sma50, sma200: gd.sma200 });
    const status = boxes.computeStatus({ price: gd.price, trigger: stock.trigger, warn: stock.warn });
    const boxesResult = {
      ind: cr.box_ind || 'warn',
      best: cr.box_best || 'warn',
      up: upBox,
    };
    const note = cr.note || stock.note;
    const earn = gd.earningsDate || stock.earn;

    await stocksRepo.updateScanResult(stock.id, {
      price: gd.price,
      chg_pct: gd.changePercent,
      status,
      boxes: boxesResult,
      note,
      earn,
    });

    finalStocks.push({
      ...stock,
      price: gd.price,
      chg: gd.changePercent,
      status,
      boxes: boxesResult,
      note,
      earn,
    });
  }

  const changes = await alertService.notifyChanges(finalStocks);

  const now = new Date();
  const dateTxt =
    now.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' }) +
    ' · ' +
    now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  await reportsRepo.create({ date: dateTxt, text: claudeResult.report, kind });
  await settingsRepo.set('last_scan_at', dateTxt);

  return { stocks: finalStocks, report: { date: dateTxt, text: claudeResult.report }, lastScan: dateTxt, changes };
}

module.exports = { runScan };
