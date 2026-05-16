const path = require('path');
const config = require('../config/appConfig');

function renderPage(fileName) {
  return (_req, res) => {
    res.sendFile(path.join(config.viewsDir, fileName));
  };
}

module.exports = {
  renderPage,
};
