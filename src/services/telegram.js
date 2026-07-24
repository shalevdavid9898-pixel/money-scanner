const config = require('../config');

async function sendMessage(text) {
  if (!config.telegramBotToken || !config.telegramChatId) return;
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: config.telegramChatId, text }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`telegram sendMessage failed: ${res.status} ${body}`);
  }
}

module.exports = { sendMessage };
