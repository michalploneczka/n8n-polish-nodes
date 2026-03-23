import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';
export default [
  { ignores: ['__tests__/**'] },
  ...configWithoutCloudSupport,
];
