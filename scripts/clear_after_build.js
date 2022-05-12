const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const packageJson = require('../package.json');

const removedFiles = [
  'builder-debug.yml',
  'builder-effective-config.yaml',
  'win-ia32-unpacked',
  'win-unpacked',
  'linux-unpacked',
  'latest-linux.yml',
  `RUM-${packageJson.version}.exe.blockmap`,
  `RUM-${packageJson.version}.dmg.blockmap`,
];

(async () => {
  for (const file of removedFiles) {
    try {
      await fs.remove(path.join(__dirname, `../release/${file}`));
    } catch (err) {}
  }
})();
