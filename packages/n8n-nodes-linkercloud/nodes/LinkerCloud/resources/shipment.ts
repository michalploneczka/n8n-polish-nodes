import type { INodeProperties } from 'n8n-workflow';

export const shipmentOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['shipment'],
		},
	},
	options: [
		{
			name: 'Cancel Packages',
			value: 'cancel',
			action: 'Cancel selected packages',
			description: 'Cancel selected packages in a shipment via PATCH',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create a shipment',
			description: 'Create a shipment for an order',
		},
		{
			name: 'Create by Order Number',
			value: 'createByOrderNumber',
			action: 'Create shipment by order number',
			description: 'Create a shipment by order number with delivery packages',
		},
		{
			name: 'Get Label',
			value: 'getLabel',
			action: 'Get a shipment label',
			description: 'Download a shipment label as binary PDF or PNG',
		},
		{
			name: 'Get Status',
			value: 'getStatus',
			action: 'Get shipment status',
			description: 'Get the status of a shipment delivery',
		},
	],
	default: 'create',
};

export const shipmentFields: INodeProperties[] = [
	// ----------------------------------
	//         Order ID (shared)
	// ----------------------------------
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['cancel', 'getStatus', 'getLabel'],
			},
		},
		description: 'The ID of the order',
	},

	// ----------------------------------
	//         Cancel: Package IDs
	// ----------------------------------
	{
		displayName: 'Package IDs to Cancel',
		name: 'packageIdsToCancel',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['cancel'],
			},
		},
		description: 'Comma-separated list of package IDs to cancel',
	},

	// ----------------------------------
	//         Get Label fields
	// ----------------------------------
	{
		displayName: 'Package ID',
		name: 'packageId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['getLabel'],
			},
		},
		description: 'The ID of the package',
	},
	{
		displayName: 'Parcel ID',
		name: 'parcelId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['getLabel'],
			},
		},
		description: 'The ID of the parcel',
	},
	{
		displayName: 'Label Format',
		name: 'labelFormat',
		type: 'options',
		default: 'pdf',
		options: [
			{ name: 'PDF', value: 'pdf' },
			{ name: 'PNG', value: 'png' },
		],
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['getLabel'],
			},
		},
		description: 'The format of the label to download',
	},

	// ----------------------------------
	//         Create fields
	// ----------------------------------
	{
		displayName: 'Order Number',
		name: 'orderNumber',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create', 'createByOrderNumber'],
			},
		},
		description: 'The order number for the shipment',
	},
	{
		displayName: 'Packages',
		name: 'packages',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create', 'createByOrderNumber'],
			},
		},
		description: 'Packages as JSON array. Each: { "weight": 1.5, "items": [{ "sku": "ABC", "quantity": 1 }] }',
	},
	{
		displayName: 'Mark as Packed',
		name: 'markAsPacked',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		description: 'Whether to mark the order as packed after creating the shipment',
	},
	{
		displayName: 'Create Additional',
		name: 'createAdditional',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		description: 'Whether to create additional shipment data',
	},

	// ----------------------------------
	//         Create: Additional Fields
	// ----------------------------------
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Batch Numbers',
				name: 'batchNumbers',
				type: 'string',
				default: '',
				description: 'Batch numbers as JSON array (default: [])',
			},
			{
				displayName: 'Label Format',
				name: 'labelFormat',
				type: 'string',
				default: '',
				description: 'Label format (e.g., pdf)',
			},
			{
				displayName: 'Pack Order',
				name: 'packOrder',
				type: 'boolean',
				default: false,
				description: 'Whether to pack the order',
			},
		],
	},
];
