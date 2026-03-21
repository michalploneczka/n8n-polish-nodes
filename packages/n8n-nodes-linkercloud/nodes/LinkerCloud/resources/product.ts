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
			description: 'Create a new product in the catalog',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List products',
			description: 'Get a list of products',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update a product',
			description: 'Update an existing product',
		},
	],
	default: 'list',
};

export const productFields: INodeProperties[] = [
	// ------ Product ID (update) ------
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the product to update',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['update'],
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

	// ------ Name (create, required) ------
	{
		displayName: 'Name',
		name: 'name',
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

	// ------ SKU (create, required) ------
	{
		displayName: 'SKU',
		name: 'sku',
		type: 'string',
		required: true,
		default: '',
		description: 'Stock Keeping Unit code',
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
				displayName: 'Always Ask for Serial Number',
				name: 'always_ask_for_serial_number',
				type: 'boolean',
				default: false,
				description: 'Whether to always ask for serial number during warehouse operations',
			},
			{
				displayName: 'Barcode',
				name: 'barcode',
				type: 'string',
				default: '',
				description: 'Product barcode (EAN)',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'ID of the depot/warehouse',
			},
			{
				displayName: 'Has Batch Number',
				name: 'has_batch_number',
				type: 'boolean',
				default: false,
				description: 'Whether the product uses batch numbers',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Height in mm',
			},
			{
				displayName: 'Ignore in WMS',
				name: 'ignore_in_wms',
				type: 'boolean',
				default: false,
				description: 'Whether to ignore this product in WMS operations',
			},
			{
				displayName: 'Ignore When Packing',
				name: 'ignore_when_packing',
				type: 'boolean',
				default: false,
				description: 'Whether to ignore this product during packing',
			},
			{
				displayName: 'Is Bio',
				name: 'is_bio',
				type: 'boolean',
				default: false,
				description: 'Whether the product is a bio/organic product',
			},
			{
				displayName: 'Is Expirable',
				name: 'is_expirable',
				type: 'boolean',
				default: false,
				description: 'Whether the product has an expiration date',
			},
			{
				displayName: 'Is Food',
				name: 'is_food',
				type: 'boolean',
				default: false,
				description: 'Whether the product is a food item',
			},
			{
				displayName: 'Is Fragile',
				name: 'is_fragile',
				type: 'boolean',
				default: false,
				description: 'Whether the product is fragile and requires careful handling',
			},
			{
				displayName: 'Is Insert',
				name: 'is_insert',
				type: 'boolean',
				default: false,
				description: 'Whether the product is an insert (marketing material added to packages)',
			},
			{
				displayName: 'Length',
				name: 'length',
				type: 'number',
				default: 0,
				description: 'Length in mm',
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				default: 0,
				description: 'Weight in grams',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Width in mm',
			},
		],
	},

	// ------ Update Fields (update) ------
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Always Ask for Serial Number',
				name: 'always_ask_for_serial_number',
				type: 'boolean',
				default: false,
				description: 'Whether to always ask for serial number during warehouse operations',
			},
			{
				displayName: 'Barcode',
				name: 'barcode',
				type: 'string',
				default: '',
				description: 'Product barcode (EAN)',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'ID of the depot/warehouse',
			},
			{
				displayName: 'Has Batch Number',
				name: 'has_batch_number',
				type: 'boolean',
				default: false,
				description: 'Whether the product uses batch numbers',
			},
			{
				displayName: 'Height',
				name: 'height',
				type: 'number',
				default: 0,
				description: 'Height in mm',
			},
			{
				displayName: 'Ignore in WMS',
				name: 'ignore_in_wms',
				type: 'boolean',
				default: false,
				description: 'Whether to ignore this product in WMS operations',
			},
			{
				displayName: 'Ignore When Packing',
				name: 'ignore_when_packing',
				type: 'boolean',
				default: false,
				description: 'Whether to ignore this product during packing',
			},
			{
				displayName: 'Is Bio',
				name: 'is_bio',
				type: 'boolean',
				default: false,
				description: 'Whether the product is a bio/organic product',
			},
			{
				displayName: 'Is Expirable',
				name: 'is_expirable',
				type: 'boolean',
				default: false,
				description: 'Whether the product has an expiration date',
			},
			{
				displayName: 'Is Food',
				name: 'is_food',
				type: 'boolean',
				default: false,
				description: 'Whether the product is a food item',
			},
			{
				displayName: 'Is Fragile',
				name: 'is_fragile',
				type: 'boolean',
				default: false,
				description: 'Whether the product is fragile and requires careful handling',
			},
			{
				displayName: 'Is Insert',
				name: 'is_insert',
				type: 'boolean',
				default: false,
				description: 'Whether the product is an insert (marketing material added to packages)',
			},
			{
				displayName: 'Length',
				name: 'length',
				type: 'number',
				default: 0,
				description: 'Length in mm',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Product name',
			},
			{
				displayName: 'SKU',
				name: 'sku',
				type: 'string',
				default: '',
				description: 'Stock Keeping Unit code',
			},
			{
				displayName: 'Weight',
				name: 'weight',
				type: 'number',
				default: 0,
				description: 'Weight in grams',
			},
			{
				displayName: 'Width',
				name: 'width',
				type: 'number',
				default: 0,
				description: 'Width in mm',
			},
		],
	},
];
