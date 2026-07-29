const express = require('express');
const app = express();
const results = [];

function testRequire(name) {
  try {
    require(name);
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
  }
}

testRequire('mongodb');
testRequire('zod');
testRequire('bcryptjs');
testRequire('jsonwebtoken');
testRequire('cookie-parser');
testRequire('cors');
testRequire('dotenv');

app.get('/', (req, res) => res.json({ ok: true, results }));
module.exports = app;
