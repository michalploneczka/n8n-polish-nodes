import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class CeneoApi implements ICredentialType {
	name = 'ceneoApi';

	displayName = 'Ceneo API';

	icon = 'file:../icons/ceneo.svg' as const;

	documentationUrl = 'https://developers.ceneo.pl';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'API key from Ceneo Partner Panel. Used for v2 endpoints directly and to obtain Bearer token for v3 endpoints.',
		},
	];
	// No ICredentialTestRequest -- GetToken is two-step programmatic flow
}