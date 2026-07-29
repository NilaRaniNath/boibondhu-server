module.exports = async (req, res) => {
  try {
    console.log('Function invoked:', req.method, req.url);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok: true, url: req.url, method: req.method }));
  } catch (err) {
    console.error('Function error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err.message }));
  }
};
