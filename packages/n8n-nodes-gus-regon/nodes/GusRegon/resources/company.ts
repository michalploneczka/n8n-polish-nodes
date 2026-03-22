import type { INodeProperties } from 'n8n-workflow';

export const companyOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['company'],
		},
	},
	options: [
		{
			name: 'Get Full Data',
			value: 'getFullData',
			action: 'Get full company data',
			description:
				'Get full company report including PKD codes. Requires REGON number.',
		},
		{
			name: 'Search by KRS',
			value: 'searchByKrs',
			action: 'Search company by KRS',
			description:
				'Search for a company in GUS REGON registry by KRS number',
		},
		{
			name: 'Search by NIP',
			value: 'searchByNip',
			action: 'Search company by NIP',
			description:
				'Search for a company in GUS REGON registry by NIP (tax identification number)',
		},
		{
			name: 'Search by REGON',
			value: 'searchByRegon',
			action: 'Search company by REGON',
			description:
				'Search for a company in GUS REGON registry by REGON number',
		},
	],
	default: 'searchByNip',
};

export const companyFields: INodeProperties[] = [
	// ------ NIP (searchByNip) ------
	{
		displayName: 'NIP',
		name: 'nip',
		type: 'string',
		required: true,
		default: '',
		placeholder: '1234567890',
		description: 'NIP (tax identification number) - 10 digits',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['searchByNip'],
			},
		},
	},

	// ------ REGON (searchByRegon) ------
	{
		displayName: 'REGON',
		name: 'regon',
		type: 'string',
		required: true,
		default: '',
		placeholder: '012345678',
		description: 'REGON number - 9 or 14 digits',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['searchByRegon'],
			},
		},
	},

	// ------ KRS (searchByKrs) ------
	{
		displayName: 'KRS',
		name: 'krs',
		type: 'string',
		required: true,
		default: '',
		placeholder: '0000123456',
		description: 'KRS number - 10 digits',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['searchByKrs'],
			},
		},
	},

	// ------ REGON for Report (getFullData) ------
	{
		displayName: 'REGON',
		name: 'regonForReport',
		type: 'string',
		required: true,
		default: '',
		placeholder: '012345678',
		description:
			'REGON number of the company to get full data for. Use 9 or 14 digit REGON.',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['getFullData'],
			},
		},
	},

	// ------ Include PKD (getFullData) ------
	{
		displayName: 'Include PKD Codes',
		name: 'includePkd',
		type: 'boolean',
		default: true,
		description:
			'Whether to include PKD activity codes in the response. Makes an additional API call.',
		displayOptions: {
			show: {
				resource: ['company'],
				operation: ['getFullData'],
			},
		},
	},
];
