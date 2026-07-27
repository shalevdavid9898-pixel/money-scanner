const scanService = require('./scanService');
const scanLogRepo = require('../repositories/scanLogRepo');
const telegram = require('./telegram');

const BOX_LABELS = { ind: 'תעשייה עולה', best: 'הכי טובה בענף', up: 'מחיר בתנופה' };
const STATUS_LABELS = { hold: 'מחזיקה', weak: 'נחלשת', broken: 'נשברה', check: 'לבדיקה' };

async function build24hChanges(stocks) {
  const lines = [];
  for (const stock of stocks) {
    const baseline = await scanLogRepo.baselineForStock(stock.id, 24);
    if (!baseline) continue;
    for (const key of ['ind', 'best', 'up']) {
      if (baseline.boxes[key] !== stock.boxes[key]) {
        lines.push(`${stock.t}: ${BOX_LABELS[key]} עברה מ-${baseline.boxes[key]} ל-${stock.boxes[key]}`);
      }
    }
    if (baseline.status !== stock.status) {
      const from = STATUS_LABELS[baseline.status] || baseline.status;
      const to = STATUS_LABELS[stock.status] || stock.status;
      lines.push(`${stock.t}: סטטוס השתנה מ"${from}" ל"${to}"`);
    }
  }
  return lines;
}

function buildUpcomingEarnings(stocks) {
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const lines = [];
  for (const s of stocks) {
    if (!s.earningsDateRaw) continue;
    const d = new Date(s.earningsDateRaw).getTime();
    if (!Number.isNaN(d) && d >= now && d - now <= sevenDaysMs) {
      lines.push(`${s.t}: ${s.earn}`);
    }
  }
  return lines;
}

function formatMessage({ dateTxt, reportText, earningsSoon, changes24h }) {
  const earningsBlock = earningsSoon.length ? earningsSoon.map((l) => '• ' + l).join('\n') : 'אין דוחות קרובים.';
  const changesBlock = changes24h.length ? changes24h.map((l) => '• ' + l).join('\n') : 'אין שינויים משמעותיים.';
  return (
    `☀️ דוח בוקר — ${dateTxt}\n\n${reportText || ''}\n\n` +
    `📅 דוחות/אירועים קרובים (7 ימים הקרובים):\n${earningsBlock}\n\n` +
    `📊 שינויים ב-24 השעות האחרונות:\n${changesBlock}`
  );
}

async function runMorningReport() {
  const result = await scanService.runScan('morning_auto');
  if (!result.stocks.length) return result;

  const changes24h = await build24hChanges(result.stocks);
  const earningsSoon = buildUpcomingEarnings(result.stocks);
  const dateTxt = new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
  const message = formatMessage({ dateTxt, reportText: result.report?.text, earningsSoon, changes24h });

  try {
    await telegram.sendMessage(message);
  } catch (err) {
    // Telegram delivery is best-effort — a failure here must not fail the morning job.
    console.error('morning report telegram failed:', err.message);
  }

  return { ...result, changes24h, earningsSoon };
}

module.exports = { runMorningReport };
