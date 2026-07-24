const db = require('../db');

async function get(key) {
  const res = await db.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
  return res.rows[0]?.value ?? null;
}

async function set(key, value) {
  await db.execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, value],
  });
}

module.exports = { get, set };
