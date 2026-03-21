import type { INodeProperties } from 'n8n-workflow';

export const inboundOrderOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['inboundOrder'],
		},
	},
	options: [
		{
			name: 'Confirm',
			value: 'confirm',
			action: 'Create an inbound confirmation document',
			description: 'Create an inbound confirmation document (POST /supplierorders/confirms)',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create an inbound order',
			description: 'Create a new inbound (supplier) order',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get an inbound order',
			description: 'Get an inbound order by ID',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List inbound orders',
			description: 'Get a list of inbound (supplier) orders',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update an inbound order',
			description: 'Update an inbound order by ID',
		},
	],
	default: 'list',
};

export const inboundOrderFields: INodeProperties[] = [
	// ------ Inbound Order ID (get, update) ------
	{
		displayName: 'Inbound Order ID',
		name: 'inboundOrderId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the inbound order',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['get', 'update'],
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
				resource: ['inboundOrder'],
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
				resource: ['inboundOrder'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},

	// ------ Create Required Fields ------
	{
		displayName: 'Order Date',
		name: 'orderDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD HH:mm:ss',
		description: 'Order date (YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Execution Date',
		name: 'executionDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD HH:mm:ss',
		description: 'Execution date (YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Price Gross',
		name: 'priceGross',
		type: 'number',
		required: true,
		default: 0,
		description: 'Total gross price of the inbound order',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Price Net',
		name: 'priceNet',
		type: 'number',
		required: true,
		default: 0,
		description: 'Total net price of the inbound order',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Supplier',
		name: 'supplier',
		type: 'string',
		required: true,
		default: '',
		description: 'Supplier name',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Supplier Object',
		name: 'supplierObject',
		type: 'string',
		required: true,
		default: '{}',
		typeOptions: {
			rows: 3,
		},
		description: 'Supplier details as JSON object, e.g. { "name": "...", "address": "..." }',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
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
		description: 'Items as JSON array. Each: { "sku": "...", "quantity": N, "price": N }',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
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
				resource: ['inboundOrder'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Client Order Number',
				name: 'clientOrderNumber',
				type: 'string',
				default: '',
				description: 'Client-side order number',
			},
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
				description: 'Additional comments',
			},
			{
				displayName: 'Currency Symbol',
				name: 'currencySymbol',
				type: 'string',
				default: 'PLN',
				description: 'Currency code (e.g. PLN, EUR, USD)',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'string',
				default: '[]',
				description: 'Custom properties as JSON array, default []',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'Depot/warehouse ID',
			},
			{
				displayName: 'Installment',
				name: 'installment',
				type: 'string',
				default: '',
				description: 'Installment information',
			},
			{
				displayName: 'Number of Containers',
				name: 'numberOfContainers',
				type: 'number',
				default: 0,
				description: 'Number of containers',
			},
			{
				displayName: 'Number of Pallets',
				name: 'numberOfPallets',
				type: 'number',
				default: 0,
				description: 'Number of pallets',
			},
			{
				displayName: 'Number of Parcels',
				name: 'numberOfParcels',
				type: 'number',
				default: 0,
				description: 'Number of parcels',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'number',
				default: 0,
				description: 'Priority level',
			},
		],
	},

	// ------ Update Fields ------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Client Order Number',
				name: 'clientOrderNumber',
				type: 'string',
				default: '',
				description: 'Client-side order number',
			},
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
				description: 'Additional comments',
			},
			{
				displayName: 'Currency Symbol',
				name: 'currencySymbol',
				type: 'string',
				default: 'PLN',
				description: 'Currency code (e.g. PLN, EUR, USD)',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'string',
				default: '[]',
				description: 'Custom properties as JSON array',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'Depot/warehouse ID',
			},
			{
				displayName: 'Execution Date',
				name: 'executionDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Execution date (YYYY-MM-DD HH:mm:ss)',
			},
			{
				displayName: 'Installment',
				name: 'installment',
				type: 'string',
				default: '',
				description: 'Installment information',
			},
			{
				displayName: 'Items',
				name: 'items',
				type: 'string',
				default: '[]',
				typeOptions: {
					rows: 4,
				},
				description: 'Items as JSON array. Each: { "sku": "...", "quantity": N, "price": N }',
			},
			{
				displayName: 'Number of Containers',
				name: 'numberOfContainers',
				type: 'number',
				default: 0,
				description: 'Number of containers',
			},
			{
				displayName: 'Number of Pallets',
				name: 'numberOfPallets',
				type: 'number',
				default: 0,
				description: 'Number of pallets',
			},
			{
				displayName: 'Number of Parcels',
				name: 'numberOfParcels',
				type: 'number',
				default: 0,
				description: 'Number of parcels',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Order date (YYYY-MM-DD HH:mm:ss)',
			},
			{
				displayName: 'Price Gross',
				name: 'priceGross',
				type: 'number',
				default: 0,
				description: 'Total gross price',
			},
			{
				displayName: 'Price Net',
				name: 'priceNet',
				type: 'number',
				default: 0,
				description: 'Total net price',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'number',
				default: 0,
				description: 'Priority level',
			},
			{
				displayName: 'Supplier',
				name: 'supplier',
				type: 'string',
				default: '',
				description: 'Supplier name',
			},
			{
				displayName: 'Supplier Object',
				name: 'supplierObject',
				type: 'string',
				default: '{}',
				typeOptions: {
					rows: 3,
				},
				description: 'Supplier details as JSON object',
			},
		],
	},

	// ------ Confirm Required Fields ------
	// POST /supplierorders/confirms creates a new inbound confirmation document
	// Body is SupplierOrderType (full order schema), NOT batch confirm by IDs
	{
		displayName: 'Order Date',
		name: 'orderDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD HH:mm:ss',
		description: 'Confirmation document date (YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
	},
	{
		displayName: 'Execution Date',
		name: 'executionDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD HH:mm:ss',
		description: 'Execution date (YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
	},
	{
		displayName: 'Price Gross',
		name: 'priceGross',
		type: 'number',
		required: true,
		default: 0,
		description: 'Total gross price',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
	},
	{
		displayName: 'Price Net',
		name: 'priceNet',
		type: 'number',
		required: true,
		default: 0,
		description: 'Total net price',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
	},
	{
		displayName: 'Supplier',
		name: 'supplier',
		type: 'string',
		required: true,
		default: '',
		description: 'Supplier name',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
	},
	{
		displayName: 'Supplier Object',
		name: 'supplierObject',
		type: 'string',
		required: true,
		default: '{}',
		typeOptions: {
			rows: 3,
		},
		description: 'Supplier details as JSON object, e.g. { "name": "...", "address": "..." }',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
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
		description: 'Items as JSON array. Each: { "sku": "...", "quantity": N, "price": N }',
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
	},

	// ------ Confirm Additional Fields ------
	{
		displayName: 'Additional Fields',
		name: 'confirmAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['inboundOrder'],
				operation: ['confirm'],
			},
		},
		options: [
			{
				displayName: 'Client Order Number',
				name: 'clientOrderNumber',
				type: 'string',
				default: '',
				description: 'Client-side order number',
			},
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
				description: 'Additional comments',
			},
			{
				displayName: 'Currency Symbol',
				name: 'currencySymbol',
				type: 'string',
				default: 'PLN',
				description: 'Currency code (e.g. PLN, EUR, USD)',
			},
			{
				displayName: 'Custom Properties',
				name: 'customProperties',
				type: 'string',
				default: '[]',
				description: 'Custom properties as JSON array, default []',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'Depot/warehouse ID',
			},
			{
				displayName: 'Installment',
				name: 'installment',
				type: 'string',
				default: '',
				description: 'Installment information',
			},
			{
				displayName: 'Number of Containers',
				name: 'numberOfContainers',
				type: 'number',
				default: 0,
				description: 'Number of containers',
			},
			{
				displayName: 'Number of Pallets',
				name: 'numberOfPallets',
				type: 'number',
				default: 0,
				description: 'Number of pallets',
			},
			{
				displayName: 'Number of Parcels',
				name: 'numberOfParcels',
				type: 'number',
				default: 0,
				description: 'Number of parcels',
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'number',
				default: 0,
				description: 'Priority level',
			},
		],
	},
];
