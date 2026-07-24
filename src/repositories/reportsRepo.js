const db = require('../db');

async function list(limit = 15) {
  const res = await db.execute({ sql: 'SELECT * FROM reports ORDER BY id DESC LIMIT ?', args: [limit] });
  return res.rows.map((row) => ({ date: row.report_date, text: row.report_text, kind: row.kind }));
}

async function create({ date, text, kind = 'manual_scan' }) {
  await db.execute({
    sql: 'INSERT INTO reports (report_date, report_text, kind) VALUES (?, ?, ?)',
    args: [date, text, kind],
  });
}

module.exports = { list, create };
