import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FakturowniaApi implements ICredentialType {
	name = 'fakturowniaApi';

	displayName = 'Fakturownia API';

	icon = 'file:../icons/fakturownia.svg' as const;

	documentationUrl = 'https://app.fakturownia.pl/api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'API token from Settings > Account Settings > Integration > API Authorization Code',
		},
		{
			displayName: 'Subdomain',
			name: 'subdomain',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'mycompany',
			description:
				'Your Fakturownia subdomain (e.g., "mycompany" from mycompany.fakturownia.pl). Enter only the subdomain, not the full URL.',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{`https://${$credentials.subdomain}.fakturownia.pl/account.json`}}',
			qs: {
				api_token: '={{$credentials.apiToken}}',
			},
		},
	};
}
