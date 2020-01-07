const { createTransformer } = require('babel-jest');

module.exports = createTransformer({
  plugins: [require.resolve('@babel/plugin-transform-modules-commonjs')]
});
