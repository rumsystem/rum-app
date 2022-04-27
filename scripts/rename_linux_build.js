const fs = require("fs");
const path = require("path");
const packageJson = require('../package.json');

fs.renameSync(
  path.join(__dirname, `../release/RUM-${packageJson.version}.zip`),
  path.join(__dirname, `../release/RUM-${packageJson.version}.linux.zip`),
)
