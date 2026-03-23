import type { INodeProperties } from 'n8n-workflow';

export const accountOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['account'],
		},
	},
	options: [
		{
			name: 'Get Limits',
			value: 'getLimits',
			action: 'Get API execution limits',
			description: 'Get current API usage limits and remaining quota',
		},
	],
	default: 'getLimits',
};

export const accountFields: INodeProperties[] = [];
