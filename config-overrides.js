const {
  override,
  addBabelPlugins,
} = require('customize-cra');

module.exports = {
  webpack: override(
    addBabelPlugins(
      ['styled-jsx/babel', {
        "plugins": ["styled-jsx-plugin-postcss"]
      }]
    ),
  )
}
