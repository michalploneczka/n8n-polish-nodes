import type { INodeProperties } from 'n8n-workflow';

export const stockOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['stock'],
		},
	},
	options: [
		{
			name: 'List',
			value: 'list',
			action: 'List stock levels',
			description: 'Get a list of stock levels',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update stock levels',
			description: 'Batch update stock quantities by SKU',
		},
	],
	default: 'list',
};

export const stockFields: INodeProperties[] = [
	// ------ Return All (list) ------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['stock'],
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
				resource: ['stock'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},

	// ------ Filters (list) ------
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['stock'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'Filter by depot ID',
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				description: 'Filter by SKU',
			},
		],
	},

	// ------ Items (update, required) ------
	{
		displayName: 'Items',
		name: 'items',
		type: 'string',
		required: true,
		typeOptions: {
			rows: 4,
		},
		default: '',
		description: 'Stock update items as JSON array. Each item: { "sku": "ABC123", "totalQuantity": 100, "ean": "optional", "name": "optional" }.',
		displayOptions: {
			show: {
				resource: ['stock'],
				operation: ['update'],
			},
		},
	},

	// ------ Additional Options (update) ------
	{
		displayName: 'Additional Options',
		name: 'additionalOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['stock'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Fulfilment Site',
				name: 'fulfilmentSite',
				type: 'string',
				default: '',
				description: 'Fulfilment site identifier',
			},
			{
				displayName: 'Publish Stocks',
				name: 'publishStocks',
				type: 'string',
				default: '',
				description: 'Publish stocks option',
			},
		],
	},
];
