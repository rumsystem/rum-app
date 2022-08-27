const path = require('path');

const rootPath = path.join(__dirname, '../..');

module.exports = function assetsCustomLoader() {
  const filePath = this.resourcePath;

  if (process.env.NODE_ENV === 'development' || process.env.TEST_ENV) {
    const uri = `file://${filePath.replace(/\\/g, '/')}`;
    return `export default ${JSON.stringify(uri)};`;
  }

  const relativePath = filePath.replace(rootPath, '').replace(/\\/g, '/');
  return `export default \`file://\${process.resourcesPath.replace(/\\\\/g, '/')}${relativePath}\`;`;
};
