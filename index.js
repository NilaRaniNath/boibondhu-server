const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB, closeDB } = require('./dist/lib/db');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

connectDB().catch(err => console.error('DB connection failed:', err));

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'BoiBondhu API is running' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'BoiBondhu API is running' });
});

app.use('/api/auth', require('./dist/routes/auth').default);
app.use('/api/books', require('./dist/routes/book.routes').default);
app.use('/api/orders', require('./dist/routes/order.routes').default);
app.use('/api/reviews', require('./dist/routes/review.routes').default);
app.use('/api/admin', require('./dist/routes/admin.routes').default);

module.exports = app;
