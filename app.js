require('dotenv').config();

const express = require('express');
const config = require('./config/appConfig');
const pageRoutes = require('./routes/pageRoutes');
const fundingRoutes = require('./routes/fundingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.disable('x-powered-by');

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(config.publicDir));
app.use('/uploads', express.static(config.uploadsDir));

app.use('/', pageRoutes);
app.use('/api/fundings', fundingRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
