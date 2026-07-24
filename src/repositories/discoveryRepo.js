const crypto = require('crypto');
const db = require('../db');

function rowToCandidate(row) {
  if (!row) return null;
  return {
    id: row.id,
    t: row.ticker,
    name: row.name || '',
    mkt: row.market,
    verdict: row.verdict,
    boxes: { ind: row.box_ind, best: row.box_best, up: row.box_up },
    note: row.note || '',
    trigger: row.trigger_suggestion,
    date: row.source_date || '',
  };
}

async function list() {
  const res = await db.execute('SELECT * FROM discovery_candidates ORDER BY created_at DESC');
  return res.rows.map(rowToCandidate);
}

async function findById(id) {
  const res = await db.execute({ sql: 'SELECT * FROM discovery_candidates WHERE id = ?', args: [id] });
  return rowToCandidate(res.rows[0]);
}

async function create(candidate) {
  const id = 'disc_' + crypto.randomBytes(6).toString('hex');
  await db.execute({
    sql: `INSERT INTO discovery_candidates (id, ticker, name, market, verdict, box_ind, box_best, box_up, note, trigger_suggestion, source_date, source_excerpt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      candidate.ticker.toUpperCase(),
      candidate.name || '',
      candidate.market || 'US',
      candidate.verdict,
      candidate.boxes?.ind || 'warn',
      candidate.boxes?.best || 'warn',
      candidate.boxes?.up || 'warn',
      candidate.note || '',
      candidate.trigger ?? null,
      candidate.date || null,
      candidate.excerpt || null,
    ],
  });
  return findById(id);
}

async function remove(id) {
  await db.execute({ sql: 'DELETE FROM discovery_candidates WHERE id = ?', args: [id] });
}

module.exports = { list, findById, create, remove };
