import type { INodeProperties } from 'n8n-workflow';

export const productOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['product'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a product',
			description: 'Create a new product',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List products',
			description: 'Get a list of products',
		},
	],
	default: 'list',
};

export const productFields: INodeProperties[] = [
	// ------ Return All (list) ------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['list'],
			},
		},
	},

	// ------ Limit (list, when returnAll=false) ------
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},

	// ------ Product Name (create) ------
	{
		displayName: 'Product Name',
		name: 'productName',
		type: 'string',
		required: true,
		default: '',
		description: 'Product name',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
	},

	// ------ Total Price Gross (create) ------
	{
		displayName: 'Total Price Gross',
		name: 'totalPriceGross',
		type: 'number',
		required: true,
		default: 0,
		description: 'Total gross price',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
	},

	// ------ Tax (create) ------
	{
		displayName: 'Tax',
		name: 'tax',
		type: 'number',
		required: true,
		default: 23,
		description: 'Tax rate percentage (e.g., 23 for 23%)',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
	},

	// ------ Additional Fields (create) ------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				description: 'Product code/SKU',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Product description',
			},
			{
				displayName: 'Quantity Unit',
				name: 'quantity_unit',
				type: 'string',
				default: 'szt.',
				description: 'Unit of measure',
			},
		],
	},
];
