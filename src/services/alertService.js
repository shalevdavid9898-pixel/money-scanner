const scanLogRepo = require('../repositories/scanLogRepo');
const telegram = require('./telegram');

const BOX_LABELS = { ind: 'תעשייה עולה', best: 'הכי טובה בענף', up: 'מחיר בתנופה' };
const STATUS_LABELS = { hold: 'מחזיקה', weak: 'נחלשת', broken: 'נשברה', check: 'לבדיקה' };

async function checkAndNotify(stock) {
  const prev = await scanLogRepo.latestForStock(stock.id);
  const lines = [];

  if (prev) {
    for (const key of ['ind', 'best', 'up']) {
      if (prev.boxes[key] !== stock.boxes[key]) {
        lines.push(`${stock.t}: ${BOX_LABELS[key]} עברה מ-${prev.boxes[key]} ל-${stock.boxes[key]}`);
      }
    }
    if (prev.status !== stock.status) {
      const from = STATUS_LABELS[prev.status] || prev.status;
      const to = STATUS_LABELS[stock.status] || stock.status;
      lines.push(`${stock.t}: סטטוס השתנה מ"${from}" ל"${to}"`);
    }
    const allOkNow = stock.boxes.ind === 'ok' && stock.boxes.best === 'ok' && stock.boxes.up === 'ok';
    const allOkBefore = prev.boxes.ind === 'ok' && prev.boxes.best === 'ok' && prev.boxes.up === 'ok';
    if (allOkNow && !allOkBefore) {
      lines.push(`${stock.t}: יושבת בול על כל שלושת הכללים 🟢`);
    }
  }

  await scanLogRepo.record(stock.id, { price: stock.price, status: stock.status, boxes: stock.boxes });
  return lines;
}

async function notifyChanges(stocks) {
  const allLines = [];
  for (const stock of stocks) {
    const lines = await checkAndNotify(stock);
    allLines.push(...lines);
  }
  if (allLines.length) {
    try {
      await telegram.sendMessage('📊 סורק הכסף — שינוי בכללים:\n' + allLines.join('\n'));
    } catch (err) {
      // Telegram delivery is best-effort — a failure here must not fail the scan itself.
      console.error('telegram alert failed:', err.message);
    }
  }
  return allLines;
}

module.exports = { notifyChanges };
