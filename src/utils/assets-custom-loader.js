const path = require('path');

const rootPath = path.join(__dirname, '../..');

module.exports = function assetsCustomLoader() {
  const filePath = this.resourcePath;

  if (process.env.NODE_ENV === 'development') {
    const uri = `file://${filePath.replaceAll('\\', '/')}`;
    return `export default ${JSON.stringify(uri)};`;
  }

  const relativePath = filePath.replace(rootPath, '').replaceAll('\\', '/');
  console.log(`export default \`file://\${process.resourcesPath.replaceAll('\\\\', '/')}${relativePath}\`;`);
  return `export default \`file://\${process.resourcesPath.replaceAll('\\\\', '/')}${relativePath}\`;`;
};
