const db = require('../db');

async function latestForStock(stockId) {
  const res = await db.execute({
    sql: 'SELECT * FROM scan_log WHERE stock_id = ? ORDER BY scanned_at DESC, id DESC LIMIT 1',
    args: [stockId],
  });
  const row = res.rows[0];
  if (!row) return null;
  return {
    price: row.price,
    status: row.status,
    boxes: { ind: row.box_ind, best: row.box_best, up: row.box_up },
  };
}

async function record(stockId, { price, status, boxes }) {
  await db.execute({
    sql: 'INSERT INTO scan_log (stock_id, price, status, box_ind, box_best, box_up) VALUES (?, ?, ?, ?, ?, ?)',
    args: [stockId, price ?? null, status, boxes.ind, boxes.best, boxes.up],
  });
}

module.exports = { latestForStock, record };
