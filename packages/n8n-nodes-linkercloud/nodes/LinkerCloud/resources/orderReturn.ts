import type { INodeProperties } from 'n8n-workflow';

export const orderReturnOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['orderReturn'],
		},
	},
	options: [
		{
			name: 'Accept',
			value: 'accept',
			action: 'Accept an order return',
			description: 'Accept an order return by ID',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create an order return',
			description: 'Create a new order return',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get an order return',
			description: 'Get an order return by ID',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List order returns',
			description: 'Get a list of order returns',
		},
	],
	default: 'list',
};

export const orderReturnFields: INodeProperties[] = [
	// ------ Order Return ID (get, accept) ------
	{
		displayName: 'Order Return ID',
		name: 'orderReturnId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the order return',
		displayOptions: {
			show: {
				resource: ['orderReturn'],
				operation: ['get', 'accept'],
			},
		},
	},

	// ------ Return All (list) ------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['orderReturn'],
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
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
		displayOptions: {
			show: {
				resource: ['orderReturn'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},

	// ------ Create Required Fields ------
	{
		displayName: 'Order Number',
		name: 'orderNumber',
		type: 'string',
		required: true,
		default: '',
		description: 'Original order number for the return',
		displayOptions: {
			show: {
				resource: ['orderReturn'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Items',
		name: 'items',
		type: 'string',
		required: true,
		default: '[]',
		typeOptions: {
			rows: 4,
		},
		description: 'Return items as JSON array',
		displayOptions: {
			show: {
				resource: ['orderReturn'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		description: 'Reason for return',
		displayOptions: {
			show: {
				resource: ['orderReturn'],
				operation: ['create'],
			},
		},
	},

	// ------ Create Additional Fields ------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['orderReturn'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
				description: 'Additional comments for the return',
			},
		],
	},
];
