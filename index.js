module.exports = (req, res) => {
  res.json({ ok: true, url: req.url });
};
