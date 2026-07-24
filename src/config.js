require('dotenv').config();

const REQUIRED = ['DATABASE_URL', 'ANTHROPIC_API_KEY', 'APP_PASSWORD', 'SESSION_SECRET', 'CRON_SECRET'];

function loadConfig() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL,
    tursoAuthToken: process.env.TURSO_AUTH_TOKEN || undefined,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
    appPassword: process.env.APP_PASSWORD,
    sessionSecret: process.env.SESSION_SECRET,
    cronSecret: process.env.CRON_SECRET,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || null,
    telegramChatId: process.env.TELEGRAM_CHAT_ID || null,
  };
}

module.exports = loadConfig();
