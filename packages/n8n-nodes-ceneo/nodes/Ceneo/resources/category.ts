import type { INodeProperties } from 'n8n-workflow';

export const categoryOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['category'],
		},
	},
	options: [
		{
			name: 'List',
			value: 'list',
			action: 'List all categories',
			description: 'Get all Ceneo categories',
		},
	],
	default: 'list',
};

export const categoryFields: INodeProperties[] = [];
