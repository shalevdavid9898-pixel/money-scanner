const { createClient } = require('@libsql/client');
const config = require('../config');

const client = createClient({
  url: config.databaseUrl,
  authToken: config.tursoAuthToken,
});

module.exports = client;
