const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const config = {
  rootDir,
  port: Number(process.env.PORT) || 3000,
  sessionSecret: process.env.SESSION_SECRET,
  universalAdminCode: String(process.env.UNIVERSAL_ADMIN_CODE || '8726').replace(/\D/g, '').slice(0, 4),
  dbPath: process.env.DB_PATH || path.join(rootDir, 'crowdfunding.db'),
  publicDir: path.join(rootDir, 'public'),
  viewsDir: path.join(rootDir, 'views'),
  uploadsDir: path.join(rootDir, 'uploads'),
  qrUploadDir: path.join(rootDir, 'uploads', 'qr'),
  maxUploadSize: 2 * 1024 * 1024,
};

module.exports = config;
