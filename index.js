const results = [];

function load(name) {
  try {
    const m = require(name);
    results.push({ name, ok: true, type: typeof m });
    return m;
  } catch (e) {
    results.push({ name, ok: false, error: e.message });
    return null;
  }
}

load('express');
load('cors');
load('cookie-parser');
load('mongodb');
load('zod');
load('bcryptjs');
load('jsonwebtoken');
load('dotenv');

const dbMod = load('./dist/lib/db');
const indexMod = load('./dist/index');
const authMod = load('./dist/routes/auth');
const bookMod = load('./dist/routes/book.routes');
const orderMod = load('./dist/routes/order.routes');
const reviewMod = load('./dist/routes/review.routes');
const adminMod = load('./dist/routes/admin.routes');

module.exports = (req, res) => {
  res.json({ results });
};
