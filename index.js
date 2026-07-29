let app;
try {
  app = require('./dist/index').default;
} catch (err) {
  console.error('Failed to load app:', err);
  app = (req, res) => {
    res.status(500).json({ error: 'Server initialization failed', message: err.message, stack: err.stack });
  };
}
module.exports = app;
