import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CeidgApi implements ICredentialType {
	name = 'ceidgApi';

	displayName = 'CEIDG API';

	icon: Icon = 'file:ceidg.svg' as Icon;

	documentationUrl = 'https://dane.biznes.gov.pl/api';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API key from dane.biznes.gov.pl (free registration)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v2',
			url: '/firmy',
			qs: { nip: '1234567890' },
			method: 'GET',
		},
	};
}
