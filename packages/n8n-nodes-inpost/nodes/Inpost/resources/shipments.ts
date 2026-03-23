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
			name: 'Cancel',
			value: 'cancel',
			action: 'Cancel a shipment',
			description: 'Cancel a shipment',
		},
		{
			name: 'Create',
			value: 'create',
			action: 'Create a shipment',
			description: 'Create a new shipment',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a shipment',
			description: 'Get a shipment by ID',
		},
		{
			name: 'Get Label',
			value: 'getLabel',
			action: 'Get shipment label',
			description: 'Download shipment label as PDF',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many shipments',
			description: 'Get a list of shipments',
		},
	],
	default: 'create',
};

export const shipmentFields: INodeProperties[] = [
	// ------ Shipment ID (shared by get, cancel, getLabel) ------
	{
		displayName: 'Shipment ID',
		name: 'shipmentId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the shipment',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['get', 'cancel', 'getLabel'],
			},
		},
	},

	// ------ Label Format (getLabel) ------
	{
		displayName: 'Label Format',
		name: 'labelFormat',
		type: 'options',
		default: 'normal',
		description: 'Label paper format',
		options: [
			{
				name: 'A4',
				value: 'normal',
			},
			{
				name: 'A6',
				value: 'A6',
			},
		],
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['getLabel'],
			},
		},
	},

	// ------ Return All (getAll) ------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['getAll'],
			},
		},
	},

	// ------ Limit (getAll, when returnAll=false) ------
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
				resource: ['shipment'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},

	// ------ Service (create) ------
	{
		displayName: 'Service',
		name: 'service',
		type: 'options',
		required: true,
		default: 'inpost_locker_standard',
		description: 'InPost shipping service type',
		options: [
			{
				name: 'InPost Courier Express',
				value: 'inpost_courier_express',
			},
			{
				name: 'InPost Courier Palette',
				value: 'inpost_courier_palette',
			},
			{
				name: 'InPost Courier Standard',
				value: 'inpost_courier_standard',
			},
			{
				name: 'InPost Locker Express',
				value: 'inpost_locker_express',
			},
			{
				name: 'InPost Locker Standard',
				value: 'inpost_locker_standard',
			},
		],
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
	},

	// ------ Target Point (create, locker services only) ------
	{
		displayName: 'Target Point',
		name: 'targetPoint',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'KRA010',
		description: 'Paczkomat code (e.g., KRA010)',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
				service: ['inpost_locker_standard', 'inpost_locker_express'],
			},
		},
	},

	// ------ Receiver (create) ------
	{
		displayName: 'Receiver',
		name: 'receiver',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		required: true,
		default: {},
		placeholder: 'Add Receiver Details',
		description: 'Receiver contact information',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'receiverDetails',
				displayName: 'Receiver Details',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						description: 'Full name of the receiver',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						description: 'Email address of the receiver',
					},
					{
						displayName: 'Phone',
						name: 'phone',
						type: 'string',
						default: '',
						required: true,
						description: 'Phone number (9 digits)',
					},
					{
						displayName: 'First Name',
						name: 'first_name',
						type: 'string',
						default: '',
						description: 'First name of the receiver',
					},
					{
						displayName: 'Last Name',
						name: 'last_name',
						type: 'string',
						default: '',
						description: 'Last name of the receiver',
					},
					{
						displayName: 'Company Name',
						name: 'company_name',
						type: 'string',
						default: '',
						description: 'Company name of the receiver',
					},
				],
			},
		],
	},

	// ------ Receiver Address (create, courier services only) ------
	{
		displayName: 'Receiver Address',
		name: 'receiverAddress',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: false,
		},
		default: {},
		placeholder: 'Add Address Details',
		description: 'Receiver delivery address (required for courier services)',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
				service: ['inpost_courier_standard', 'inpost_courier_express', 'inpost_courier_palette'],
			},
		},
		options: [
			{
				name: 'addressDetails',
				displayName: 'Address Details',
				values: [
					{
						displayName: 'Street',
						name: 'street',
						type: 'string',
						required: true,
						default: '',
						description: 'Street name',
					},
					{
						displayName: 'Building Number',
						name: 'building_number',
						type: 'string',
						required: true,
						default: '',
						description: 'Building number',
					},
					{
						displayName: 'City',
						name: 'city',
						type: 'string',
						required: true,
						default: '',
						description: 'City name',
					},
					{
						displayName: 'Post Code',
						name: 'post_code',
						type: 'string',
						required: true,
						default: '',
						placeholder: '00-000',
						description: 'Postal code',
					},
					{
						displayName: 'Country Code',
						name: 'country_code',
						type: 'string',
						default: 'PL',
						description: 'Country code (ISO 3166-1 alpha-2)',
					},
				],
			},
		],
	},

	// ------ Parcels (create) ------
	{
		displayName: 'Parcels',
		name: 'parcels',
		type: 'fixedCollection',
		typeOptions: {
			multipleValues: true,
		},
		required: true,
		default: {},
		placeholder: 'Add Parcel',
		description: 'Parcel dimensions and weight',
		displayOptions: {
			show: {
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		options: [
			{
				name: 'parcelValues',
				displayName: 'Parcel',
				values: [
					{
						displayName: 'Template',
						name: 'template',
						type: 'options',
						default: 'small',
						description: 'Predefined parcel size template (locker services only)',
						options: [
							{
								name: 'Small (A)',
								value: 'small',
							},
							{
								name: 'Medium (B)',
								value: 'medium',
							},
							{
								name: 'Large (C)',
								value: 'large',
							},
							{
								name: 'Custom',
								value: 'custom',
							},
						],
						displayOptions: {
							show: {
								'/service': ['inpost_locker_standard', 'inpost_locker_express'],
							},
						},
					},
					{
						displayName: 'Length (mm)',
						name: 'length',
						type: 'number',
						default: 80,
						description: 'Length in millimeters',
						displayOptions: {
							show: {
								'/service': [
									'inpost_courier_standard',
									'inpost_courier_express',
									'inpost_courier_palette',
								],
							},
						},
					},
					{
						displayName: 'Width (mm)',
						name: 'width',
						type: 'number',
						default: 360,
						description: 'Width in millimeters',
						displayOptions: {
							show: {
								'/service': [
									'inpost_courier_standard',
									'inpost_courier_express',
									'inpost_courier_palette',
								],
							},
						},
					},
					{
						displayName: 'Height (mm)',
						name: 'height',
						type: 'number',
						default: 640,
						description: 'Height in millimeters',
						displayOptions: {
							show: {
								'/service': [
									'inpost_courier_standard',
									'inpost_courier_express',
									'inpost_courier_palette',
								],
							},
						},
					},
					{
						displayName: 'Weight (kg)',
						name: 'weight',
						type: 'number',
						default: 5,
						description: 'Weight in kilograms',
					},
					{
						displayName: 'Non-Standard',
						name: 'isNonStandard',
						type: 'boolean',
						default: false,
						description: 'Whether the parcel is non-standard',
					},
				],
			},
		],
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
				resource: ['shipment'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Cash on Delivery Amount',
				name: 'codAmount',
				type: 'number',
				default: 0,
				description: 'Cash on delivery amount in PLN',
			},
			{
				displayName: 'Insurance Amount',
				name: 'insuranceAmount',
				type: 'number',
				default: 0,
				description: 'Insurance amount in PLN',
			},
			{
				displayName: 'Reference',
				name: 'reference',
				type: 'string',
				default: '',
				description: 'Custom reference (e.g., order number)',
			},
			{
				displayName: 'Sending Method',
				name: 'sendingMethod',
				type: 'options',
				default: 'dispatch_order',
				description: 'How the parcel will be sent',
				options: [
					{
						name: 'Dispatch Order',
						value: 'dispatch_order',
					},
					{
						name: 'Parcel Locker',
						value: 'parcel_locker',
					},
				],
			},
			{
				displayName: 'Sender',
				name: 'senderDetails',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: false,
				},
				default: {},
				placeholder: 'Add Sender Details',
				description: 'Override sender contact information',
				options: [
					{
						name: 'senderValues',
						displayName: 'Sender Details',
						values: [
							{
								displayName: 'Name',
								name: 'name',
								type: 'string',
								default: '',
								description: 'Full name of the sender',
							},
							{
								displayName: 'Email',
								name: 'email',
								type: 'string',
								default: '',
								description: 'Email address of the sender',
							},
							{
								displayName: 'Phone',
								name: 'phone',
								type: 'string',
								default: '',
								description: 'Phone number of the sender',
							},
							{
								displayName: 'Company Name',
								name: 'company_name',
								type: 'string',
								default: '',
								description: 'Company name of the sender',
							},
						],
					},
				],
			},
		],
	},
];
