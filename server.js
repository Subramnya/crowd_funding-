require('dotenv').config();

const app = require('./app');
const config = require('./config/appConfig');
const initializeDatabase = require('./database/schema');

initializeDatabase()
  .then(() => {
    app.listen(config.port, () => {
      console.log(`CrowdFund Hub is running on http://localhost:${config.port}`);
    });
  })
  .catch((error) => {
    console.error('Could not start CrowdFund Hub:', error.message);
    process.exit(1);
  });
