// @flow
module.exports = {
  presets: ['@babel/react', '@babel/flow'],
  plugins: [
    '@babel/proposal-class-properties',
    '@babel/proposal-export-default-from',
    'version-inline',
  ],
  env: {
    test: {
      presets: ['@babel/env', '@babel/react', '@babel/flow'],
      plugins: [
        '@babel/transform-runtime',
        '@babel/proposal-class-properties',
        '@babel/proposal-export-default-from',
        'version-inline',
      ],
    },
  },
};
