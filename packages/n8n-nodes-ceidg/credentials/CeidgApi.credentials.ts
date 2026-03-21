import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CeidgApi implements ICredentialType {
	name = 'ceidgApi';

	displayName = 'CEIDG API';

	icon = 'file:../icons/ceidg.svg' as const;

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

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v3',
			url: '/firma?nip=6351723862',
			method: 'GET',
		},
	};

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

}
