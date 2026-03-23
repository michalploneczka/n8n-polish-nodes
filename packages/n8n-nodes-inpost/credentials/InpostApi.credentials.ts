import type {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class InpostApi implements ICredentialType {
	name = 'inpostApi';

	displayName = 'InPost ShipX API';

	icon = 'file:../icons/inpost.svg' as const;

	documentationUrl = 'https://dokumentacja-inpost.atlassian.net/wiki/spaces/PL';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Bearer token from InPost Manager Panel',
		},
		{
			displayName: 'Organization ID',
			name: 'organizationId',
			type: 'string',
			default: '',
			required: true,
			description: 'Organization ID from InPost Manager Panel (numeric)',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			default: 'sandbox',
			required: true,
			options: [
				{
					name: 'Sandbox',
					value: 'sandbox',
				},
				{
					name: 'Production',
					value: 'production',
				},
			],
			description: 'Whether to use the sandbox or production API',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			method: 'GET',
			url: '={{$credentials.environment === "sandbox" ? "https://sandbox-api-shipx-pl.easypack24.net" : "https://api-shipx-pl.easypack24.net"}}/v1/organizations',
			headers: {
				Authorization: '={{`Bearer ${$credentials.apiToken}`}}',
			},
		},
	};
}
