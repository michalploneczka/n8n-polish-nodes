import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class SmsapiApi implements ICredentialType {
	name = 'smsapiApi';

	displayName = 'SMSAPI API';

	icon = 'file:../icons/smsapi.svg' as const;

	documentationUrl = 'https://www.smsapi.pl/docs';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API token from SMSAPI.pl panel - API Settings',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.smsapi.pl',
			url: '/profile',
			method: 'GET',
			qs: { format: 'json' },
		},
	};
}
