import type { INodeProperties } from 'n8n-workflow';

export const orderOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['order'],
		},
	},
	options: [
		{
			name: 'Apply Transition',
			value: 'applyTransition',
			action: 'Apply a state transition to an order',
			description: 'Apply a state transition to an order',
		},
		{
			name: 'Cancel',
			value: 'cancel',
			action: 'Cancel an order',
			description: 'Cancel an order by ID',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create an order',
			description: 'Create a new order',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get an order',
			description: 'Get an order by ID',
		},
		{
			name: 'Get Transitions',
			value: 'getTransitions',
			action: 'Get allowed transitions for an order',
			description: 'Get allowed state transitions for an order',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List orders',
			description: 'Get a list of orders',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update an order',
			description: 'Update an order (full update via PUT)',
		},
		{
			name: 'Update Payment Status',
			value: 'updatePaymentStatus',
			action: 'Update payment status for an order',
			description: 'Update payment status for an order',
		},
		{
			name: 'Update Tracking Number',
			value: 'updateTrackingNumber',
			action: 'Update tracking number for an order',
			description: 'Update tracking number for an order',
		},
	],
	default: 'list',
};

export const orderFields: INodeProperties[] = [
	// ------ Order ID (get, update, cancel) ------
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the order',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['get', 'update', 'cancel', 'getTransitions', 'applyTransition', 'updateTrackingNumber', 'updatePaymentStatus'],
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
				resource: ['order'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'Created At From',
				name: 'created_at_with_time',
				type: 'string',
				default: '',
				placeholder: 'd.m.Y H:i:s',
				description: 'Filter by creation date start (format: d.m.Y H:i:s, e.g. 01.03.2026 00:00:00)',
			},
			{
				displayName: 'Created At To',
				name: 'created_at_with_time_to',
				type: 'string',
				default: '',
				placeholder: 'd.m.Y H:i:s',
				description: 'Filter by creation date end (format: d.m.Y H:i:s)',
			},
			{
				displayName: 'Sort Column',
				name: 'sortCol',
				type: 'string',
				default: 'order_date',
				description: 'Column to sort by (e.g. order_date, created_at)',
			},
			{
				displayName: 'Sort Direction',
				name: 'sortDir',
				type: 'options',
				options: [
					{ name: 'Ascending', value: 'ASC' },
					{ name: 'Descending', value: 'DESC' },
				],
				default: 'DESC',
				description: 'Sort direction for results',
			},
			{
				displayName: 'Updated At From',
				name: 'updatedAt',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Filter by update date start (format: YYYY-MM-DD HH:mm:ss)',
			},
			{
				displayName: 'Updated At To',
				name: 'updatedAtTo',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Filter by update date end (format: YYYY-MM-DD HH:mm:ss)',
			},
		],
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
				resource: ['order'],
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
				resource: ['order'],
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
		description: 'Order date (format: YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['order'],
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
		description: 'Execution date (format: YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Execution Due Date',
		name: 'executionDueDate',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'YYYY-MM-DD HH:mm:ss',
		description: 'Execution due date (format: YYYY-MM-DD HH:mm:ss)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Delivery Email',
		name: 'deliveryEmail',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'customer@example.com',
		description: 'Email address for delivery notifications',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'COD Amount',
		name: 'codAmount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Cash on delivery amount (0 if no COD)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Shipment Price',
		name: 'shipmentPrice',
		type: 'number',
		required: true,
		default: 0,
		description: 'Shipment price (gross)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Shipment Price Net',
		name: 'shipmentPriceNet',
		type: 'number',
		required: true,
		default: 0,
		description: 'Shipment price (net)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Discount',
		name: 'discount',
		type: 'number',
		required: true,
		default: 0,
		description: 'Discount amount',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['create'],
			},
		},
	},
	{
		displayName: 'Payment Transaction ID',
		name: 'paymentTransactionId',
		type: 'string',
		required: true,
		default: '',
		description: 'Payment transaction ID (empty string if none)',
		displayOptions: {
			show: {
				resource: ['order'],
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
		description: 'Order items as JSON array. Each item: { "sku": "...", "quantity": 1, "price_gross": 10.00, "description": "...", "serial_numbers": [], "custom_properties": [], "source_data": [], "batch_numbers": [] }. The arrays serial_numbers, custom_properties, source_data, and batch_numbers are required (use empty arrays [] if not applicable).',
		displayOptions: {
			show: {
				resource: ['order'],
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
				resource: ['order'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Carrier',
				name: 'carrier',
				type: 'string',
				default: '',
				description: 'Carrier name (e.g. InPost, DPD, DHL)',
			},
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
				description: 'Additional comments for the order',
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
				description: 'Custom properties as JSON array, e.g. []',
			},
			{
				displayName: 'Delivery City',
				name: 'deliveryCity',
				type: 'string',
				default: '',
				description: 'Delivery address city',
			},
			{
				displayName: 'Delivery Company',
				name: 'deliveryCompany',
				type: 'string',
				default: '',
				description: 'Delivery company name',
			},
			{
				displayName: 'Delivery Country',
				name: 'deliveryCountry',
				type: 'string',
				default: 'PL',
				description: 'Delivery country code (e.g. PL, DE, US)',
			},
			{
				displayName: 'Delivery Phone',
				name: 'deliveryPhone',
				type: 'string',
				default: '',
				description: 'Delivery phone number',
			},
			{
				displayName: 'Delivery Point ID',
				name: 'deliveryPointId',
				type: 'string',
				default: '',
				description: 'Parcel locker or pickup point ID',
			},
			{
				displayName: 'Delivery Post Code',
				name: 'deliveryPostCode',
				type: 'string',
				default: '',
				description: 'Delivery address postal code',
			},
			{
				displayName: 'Delivery Recipient',
				name: 'deliveryRecipient',
				type: 'string',
				default: '',
				description: 'Delivery recipient name',
			},
			{
				displayName: 'Delivery Street',
				name: 'deliveryStreet',
				type: 'string',
				default: '',
				description: 'Delivery address street',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'Depot/warehouse ID',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'External system ID',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'string',
				default: '',
				description: 'Payment method (e.g. transfer, card, cod)',
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
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '[]',
				description: 'Tags as JSON array, e.g. ["urgent","vip"]',
			},
			{
				displayName: 'Validation Errors',
				name: 'validationErrors',
				type: 'string',
				default: '[]',
				description: 'Validation errors as JSON array, e.g. []',
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
				resource: ['order'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Carrier',
				name: 'carrier',
				type: 'string',
				default: '',
				description: 'Carrier name (e.g. InPost, DPD, DHL)',
			},
			{
				displayName: 'Client Order Number',
				name: 'clientOrderNumber',
				type: 'string',
				default: '',
				description: 'Client-side order number',
			},
			{
				displayName: 'COD Amount',
				name: 'codAmount',
				type: 'number',
				default: 0,
				description: 'Cash on delivery amount',
			},
			{
				displayName: 'Comments',
				name: 'comments',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 3,
				},
				description: 'Additional comments for the order',
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
				displayName: 'Delivery City',
				name: 'deliveryCity',
				type: 'string',
				default: '',
				description: 'Delivery address city',
			},
			{
				displayName: 'Delivery Company',
				name: 'deliveryCompany',
				type: 'string',
				default: '',
				description: 'Delivery company name',
			},
			{
				displayName: 'Delivery Country',
				name: 'deliveryCountry',
				type: 'string',
				default: 'PL',
				description: 'Delivery country code',
			},
			{
				displayName: 'Delivery Email',
				name: 'deliveryEmail',
				type: 'string',
				default: '',
				description: 'Email address for delivery notifications',
			},
			{
				displayName: 'Delivery Phone',
				name: 'deliveryPhone',
				type: 'string',
				default: '',
				description: 'Delivery phone number',
			},
			{
				displayName: 'Delivery Point ID',
				name: 'deliveryPointId',
				type: 'string',
				default: '',
				description: 'Parcel locker or pickup point ID',
			},
			{
				displayName: 'Delivery Post Code',
				name: 'deliveryPostCode',
				type: 'string',
				default: '',
				description: 'Delivery address postal code',
			},
			{
				displayName: 'Delivery Recipient',
				name: 'deliveryRecipient',
				type: 'string',
				default: '',
				description: 'Delivery recipient name',
			},
			{
				displayName: 'Delivery Street',
				name: 'deliveryStreet',
				type: 'string',
				default: '',
				description: 'Delivery address street',
			},
			{
				displayName: 'Depot ID',
				name: 'depotId',
				type: 'string',
				default: '',
				description: 'Depot/warehouse ID',
			},
			{
				displayName: 'Discount',
				name: 'discount',
				type: 'number',
				default: 0,
				description: 'Discount amount',
			},
			{
				displayName: 'Execution Date',
				name: 'executionDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Execution date (format: YYYY-MM-DD HH:mm:ss)',
			},
			{
				displayName: 'Execution Due Date',
				name: 'executionDueDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Execution due date (format: YYYY-MM-DD HH:mm:ss)',
			},
			{
				displayName: 'External ID',
				name: 'externalId',
				type: 'string',
				default: '',
				description: 'External system ID',
			},
			{
				displayName: 'Items',
				name: 'items',
				type: 'string',
				default: '[]',
				typeOptions: {
					rows: 4,
				},
				description: 'Order items as JSON array. Each item: { "sku": "...", "quantity": 1, "price_gross": 10.00, "description": "...", "serial_numbers": [], "custom_properties": [], "source_data": [], "batch_numbers": [] }.',
			},
			{
				displayName: 'Order Date',
				name: 'orderDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD HH:mm:ss',
				description: 'Order date (format: YYYY-MM-DD HH:mm:ss)',
			},
			{
				displayName: 'Payment Method',
				name: 'paymentMethod',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Payment Transaction ID',
				name: 'paymentTransactionId',
				type: 'string',
				default: '',
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
				displayName: 'Shipment Price',
				name: 'shipmentPrice',
				type: 'number',
				default: 0,
				description: 'Shipment price (gross)',
			},
			{
				displayName: 'Shipment Price Net',
				name: 'shipmentPriceNet',
				type: 'number',
				default: 0,
				description: 'Shipment price (net)',
			},
			{
				displayName: 'Tags',
				name: 'tags',
				type: 'string',
				default: '[]',
				description: 'Tags as JSON array, e.g. ["urgent","vip"]',
			},
			{
				displayName: 'Validation Errors',
				name: 'validationErrors',
				type: 'string',
				default: '[]',
				description: 'Validation errors as JSON array',
			},
		],
	},

	// ------ Transition Name (applyTransition) ------
	{
		displayName: 'Transition Name',
		name: 'transitionName',
		type: 'string',
		required: true,
		default: '',
		description: 'Transition name to apply (get available transitions from Get Transitions operation first)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['applyTransition'],
			},
		},
	},

	// ------ Update Tracking Number Fields ------
	{
		displayName: 'Tracking Number',
		name: 'trackingNumber',
		type: 'string',
		required: true,
		default: '',
		description: 'Tracking number, e.g., 12312442',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updateTrackingNumber'],
			},
		},
	},
	{
		displayName: 'Operator',
		name: 'operator',
		type: 'string',
		required: true,
		default: '',
		description: 'Carrier/operator name, e.g., DHL, InPost',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updateTrackingNumber'],
			},
		},
	},
	{
		displayName: 'Tracking URL',
		name: 'trackingUrl',
		type: 'string',
		default: '',
		description: 'Tracking URL (optional)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updateTrackingNumber'],
			},
		},
	},

	// ------ Update Payment Status Fields ------
	{
		displayName: 'Payment Status',
		name: 'paymentStatus',
		type: 'options',
		required: true,
		options: [
			{ name: 'Paid', value: 'paid' },
			{ name: 'Underpayment', value: 'underpayment' },
			{ name: 'Overpaid', value: 'overpaid' },
			{ name: 'Unpaid', value: 'unpaid' },
		],
		default: 'paid',
		description: 'Payment status to set',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updatePaymentStatus'],
			},
		},
	},
	{
		displayName: 'Order Identifier Type',
		name: 'orderIdentifier',
		type: 'options',
		options: [
			{ name: 'ID', value: 'id' },
			{ name: 'External ID', value: 'externalId' },
			{ name: 'Client Order Number', value: 'clientOrderNumber' },
		],
		default: 'id',
		description: 'Which identifier to use for matching the order',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updatePaymentStatus'],
			},
		},
	},
	{
		displayName: 'Payment Date',
		name: 'paymentDate',
		type: 'string',
		default: '',
		placeholder: 'YYYY-MM-DDTHH:mm:ss',
		description: 'Payment date (ISO datetime, optional)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updatePaymentStatus'],
			},
		},
	},
	{
		displayName: 'Payment Transaction ID',
		name: 'paymentTransactionIdForPayment',
		type: 'string',
		default: '',
		description: 'Payment transaction ID (optional)',
		displayOptions: {
			show: {
				resource: ['order'],
				operation: ['updatePaymentStatus'],
			},
		},
	},
];
