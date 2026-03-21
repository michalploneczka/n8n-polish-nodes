import type { INodeProperties } from 'n8n-workflow';

export const clientOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['client'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create a client',
			description: 'Create a new client',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get a client',
			description: 'Get a client by ID',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List clients',
			description: 'Get a list of clients',
		},
	],
	default: 'list',
};

export const clientFields: INodeProperties[] = [
	// ------ Client ID (get) ------
	{
		displayName: 'Client ID',
		name: 'clientId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the client',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['get'],
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
				resource: ['client'],
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
				resource: ['client'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},

	// ------ Name (create) ------
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		default: '',
		description: 'Full company or person name',
		displayOptions: {
			show: {
				resource: ['client'],
				operation: ['create'],
			},
		},
	},

	// ------ Tax No (create) ------
	{
		displayName: 'Tax No',
		name: 'taxNo',
		type: 'string',
		required: true,
		default: '',
		description: 'Tax identification number (NIP)',
		displayOptions: {
			show: {
				resource: ['client'],
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
				resource: ['client'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				description: 'City',
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				description: 'Country (ISO code, e.g., PL)',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'Client email',
			},
			{
				displayName: 'Note',
				name: 'note',
				type: 'string',
				default: '',
				description: 'Additional notes',
			},
			{
				displayName: 'Phone',
				name: 'phone',
				type: 'string',
				default: '',
				description: 'Phone number',
			},
			{
				displayName: 'Postal Code',
				name: 'post_code',
				type: 'string',
				default: '',
				description: 'Postal code',
			},
			{
				displayName: 'Shortcut',
				name: 'shortcut',
				type: 'string',
				default: '',
				description: 'Short client identifier',
			},
			{
				displayName: 'Street',
				name: 'street',
				type: 'string',
				default: '',
				description: 'Street address',
			},
		],
	},
];
