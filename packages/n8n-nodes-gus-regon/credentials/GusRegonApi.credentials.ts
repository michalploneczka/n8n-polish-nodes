import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class GusRegonApi implements ICredentialType {
	name = 'gusRegonApi';

	displayName = 'GUS REGON API';

	icon = 'file:gus-regon.svg' as const;

	documentationUrl = 'https://api.stat.gov.pl/Home/RegonApi';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'User key obtained by emailing regon_bir@stat.gov.pl (free). Test key: abcde12345abcde12345',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			default: 'test',
			options: [
				{
					name: 'Test',
					value: 'test',
					description: 'Test environment (wyszukiwarkaregontest.stat.gov.pl)',
				},
				{
					name: 'Production',
					value: 'production',
					description:
						'Production environment (wyszukiwarkaregon.stat.gov.pl)',
				},
			],
			description:
				'Select API environment. Test environment uses public test key.',
		},
	];
}
