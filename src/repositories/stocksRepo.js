const crypto = require('crypto');
const db = require('../db');

function rowToStock(row) {
  if (!row) return null;
  return {
    id: row.id,
    t: row.ticker,
    name: row.name || '',
    mkt: row.market,
    trigger: row.trigger_price,
    warn: row.warn_price,
    price: row.price,
    chg: row.chg_pct,
    status: row.status,
    boxes: { ind: row.box_ind, best: row.box_best, up: row.box_up },
    note: row.note || '',
    earn: row.earnings_date || '',
  };
}

async function list() {
  const res = await db.execute('SELECT * FROM stocks ORDER BY created_at ASC');
  return res.rows.map(rowToStock);
}

async function findById(id) {
  const res = await db.execute({ sql: 'SELECT * FROM stocks WHERE id = ?', args: [id] });
  return rowToStock(res.rows[0]);
}

async function findByTicker(ticker) {
  const res = await db.execute({ sql: 'SELECT * FROM stocks WHERE ticker = ?', args: [ticker.toUpperCase()] });
  return rowToStock(res.rows[0]);
}

async function create({ ticker, market, trigger, note, boxes }) {
  const id = ticker.toLowerCase() + '_' + crypto.randomBytes(4).toString('hex');
  const b = boxes || {};
  await db.execute({
    sql: `INSERT INTO stocks (id, ticker, market, trigger_price, status, box_ind, box_best, box_up, note)
          VALUES (?, ?, ?, ?, 'check', ?, ?, ?, ?)`,
    args: [
      id,
      ticker.toUpperCase(),
      market,
      trigger ?? null,
      b.ind || 'warn',
      b.best || 'warn',
      b.up || 'warn',
      note || 'חדשה — תנותח בסריקה הבאה.',
    ],
  });
  return findById(id);
}

async function update(id, fields) {
  const map = { trigger: 'trigger_price', warn: 'warn_price', note: 'note' };
  const sets = [];
  const args = [];
  for (const [key, col] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      sets.push(`${col} = ?`);
      args.push(fields[key]);
    }
  }
  if (!sets.length) return findById(id);
  sets.push("updated_at = datetime('now')");
  args.push(id);
  await db.execute({ sql: `UPDATE stocks SET ${sets.join(', ')} WHERE id = ?`, args });
  return findById(id);
}

async function updateScanResult(id, { price, chg_pct, status, boxes, note, earn }) {
  await db.execute({
    sql: `UPDATE stocks SET price = ?, chg_pct = ?, status = ?, box_ind = ?, box_best = ?, box_up = ?, note = ?, earnings_date = ?, updated_at = datetime('now')
          WHERE id = ?`,
    args: [price ?? null, chg_pct ?? null, status, boxes.ind, boxes.best, boxes.up, note || '', earn || '', id],
  });
}

async function remove(id) {
  await db.execute({ sql: 'DELETE FROM stocks WHERE id = ?', args: [id] });
}

module.exports = { list, findById, findByTicker, create, update, updateScanResult, remove };
