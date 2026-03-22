const base = require('../../jest.config.base.js');
module.exports = {
  ...base,
  rootDir: '.',
  moduleNameMapper: {
    '^@n8n-polish-nodes/test-utils$': '<rootDir>/../../shared/test-utils',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  transformIgnorePatterns: [
    '<rootDir>/../../node_modules/.pnpm/(?!(entities|fast-xml-parser))',
    'node_modules/(?!(\\.pnpm|entities|fast-xml-parser))',
  ],
  transform: {
    ...base.transform,
    '^.+\\.m?js$': ['ts-jest', { useESM: false, tsconfig: { allowJs: true, esModuleInterop: true } }],
  },
};
