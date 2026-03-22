import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
	{ ignores: ['__tests__/**'] },
	...configWithoutCloudSupport,
	{
		files: ['credentials/**'],
		rules: {
			// GUS REGON SOAP login requires programmatic execution (session-based auth).
			// ICredentialTestRequest cannot handle SOAP envelope construction.
			'@n8n/community-nodes/credential-test-required': 'off',
		},
	},
];
