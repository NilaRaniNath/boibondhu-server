const express = require('express');
const app = express();
app.get('/', (req, res) => res.json({ ok: true, url: req.url }));
module.exports = app;
