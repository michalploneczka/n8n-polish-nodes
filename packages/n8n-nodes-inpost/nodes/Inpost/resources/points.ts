import type { INodeProperties } from 'n8n-workflow';

export const pointOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['point'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			action: 'Get a parcel locker point',
			description: 'Get a parcel locker point by name',
		},
		{
			name: 'Get Many',
			value: 'getAll',
			action: 'Get many parcel locker points',
			description: 'Get a list of parcel locker points',
		},
	],
	default: 'get',
};

export const pointFields: INodeProperties[] = [
	// ------ Point Name (get) ------
	{
		displayName: 'Point Name',
		name: 'pointName',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'KRA010',
		description: 'Point name/code (e.g., KRA010)',
		displayOptions: {
			show: {
				resource: ['point'],
				operation: ['get'],
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
				resource: ['point'],
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
				resource: ['point'],
				operation: ['getAll'],
				returnAll: [false],
			},
		},
	},

	// ------ Filters (getAll) ------
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: {
			show: {
				resource: ['point'],
				operation: ['getAll'],
			},
		},
		options: [
			{
				displayName: 'City',
				name: 'city',
				type: 'string',
				default: '',
				description: 'Filter by city name',
			},
			{
				displayName: 'Functions',
				name: 'functions',
				type: 'options',
				default: 'parcel_collect',
				description: 'Filter by function',
				options: [
					{
						name: 'Parcel Collect',
						value: 'parcel_collect',
					},
					{
						name: 'Parcel Send',
						value: 'parcel_send',
					},
				],
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by point name (partial match)',
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				default: 'parcel_locker',
				description: 'Filter by point type',
				options: [
					{
						name: 'Parcel Locker',
						value: 'parcel_locker',
					},
					{
						name: 'Parcel Locker Superpop',
						value: 'parcel_locker_superpop',
					},
					{
						name: 'POP',
						value: 'pop',
					},
				],
			},
		],
	},
];
