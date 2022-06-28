const path = require('path');

require('ts-node').register({
  transpileOnly: true,
  project: path.join(__dirname, 'src/main/tsconfig.json'),
});

require('./src/main/index');
