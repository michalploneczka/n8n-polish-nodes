import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

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

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://developers.ceneo.pl',
			url: '/AuthorizationService.svc/GetToken',
			method: 'GET',
			headers: {
				Authorization: '=Basic {{$credentials?.apiKey}}',
			},
		},
	};
}