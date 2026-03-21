import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class LinkerCloudApi implements ICredentialType {
	name = 'linkerCloudApi';

	displayName = 'Linker Cloud API';

	icon = 'file:linkercloud.svg' as const;

	documentationUrl = 'https://linkercloud.com';

	properties: INodeProperties[] = [
		{
			displayName: 'Domain',
			name: 'domain',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'your-company.linker.shop',
			description:
				'Your Linker Cloud domain (e.g., your-company.linker.shop or api-demo.linker.shop for testing)',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'API key received from your Linker Cloud operator or customer service',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{`https://${$credentials.domain}/public-api/v1/orders`}}',
			qs: {
				apikey: '={{$credentials.apiKey}}',
				limit: '1',
			},
		},
	};
}
