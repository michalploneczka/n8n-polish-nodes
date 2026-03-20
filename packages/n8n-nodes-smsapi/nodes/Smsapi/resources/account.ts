import type { INodeProperties } from 'n8n-workflow';

const showOnlyForAccount = {
	resource: ['account'],
};

export const accountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForAccount,
		},
		options: [
			{
				name: 'Get Balance',
				value: 'getBalance',
				action: 'Get account balance',
				description: 'Get the account balance and profile information',
				routing: {
					request: {
						method: 'GET',
						url: '/profile',
					},
				},
			},
		],
		default: 'getBalance',
	},
];
