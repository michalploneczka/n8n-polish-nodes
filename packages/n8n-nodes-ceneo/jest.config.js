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
};