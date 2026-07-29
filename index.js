const express = require('express');
const app = express();

try {
  require('mongodb');
  console.log('mongodb loaded');
} catch(e) {
  console.log('mongodb failed:', e.message);
}

try {
  require('zod');
  console.log('zod loaded');
} catch(e) {
  console.log('zod failed:', e.message);
}

try {
  require('bcryptjs');
  console.log('bcryptjs loaded');
} catch(e) {
  console.log('bcryptjs failed:', e.message);
}

app.get('/', (req, res) => res.json({ ok: true }));
module.exports = app;
