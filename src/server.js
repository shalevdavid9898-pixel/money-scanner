const express = require('express');
const path = require('path');
const config = require('./config');
const migrate = require('./db/migrate');
const { requireAuth } = require('./middleware/auth');

const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const cronRoutes = require('./routes/cron');
const stateRoutes = require('./routes/state');
const stocksRoutes = require('./routes/stocks');
const discoveryRoutes = require('./routes/discovery');
const reportsRoutes = require('./routes/reports');
const scanRoutes = require('./routes/scan');

const app = express();
app.use(express.json());

// Public routes (no session cookie required)
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', cronRoutes); // protected separately via CRON_SECRET

// Routes behind the user session cookie
app.use('/api', requireAuth, stateRoutes);
app.use('/api', requireAuth, stocksRoutes);
app.use('/api', requireAuth, discoveryRoutes);
app.use('/api', requireAuth, reportsRoutes);
app.use('/api', requireAuth, scanRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

async function start() {
  await migrate();
  app.listen(config.port, () => {
    console.log(`money-scanner listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('failed to start:', err);
  process.exit(1);
});
