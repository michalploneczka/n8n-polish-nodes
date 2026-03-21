import type { INodeProperties } from 'n8n-workflow';

export const invoiceOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['invoice'],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			action: 'Create an invoice',
			description: 'Create a new invoice',
		},
		{
			name: 'Delete',
			value: 'delete',
			action: 'Delete an invoice',
			description: 'Delete an invoice',
		},
		{
			name: 'Download PDF',
			value: 'downloadPdf',
			action: 'Download an invoice PDF',
			description: 'Download invoice as PDF',
		},
		{
			name: 'Get',
			value: 'get',
			action: 'Get an invoice',
			description: 'Get an invoice by ID',
		},
		{
			name: 'List',
			value: 'list',
			action: 'List invoices',
			description: 'Get a list of invoices',
		},
		{
			name: 'Send by Email',
			value: 'sendByEmail',
			action: 'Send an invoice by email',
			description: 'Send an invoice by email',
		},
		{
			name: 'Update',
			value: 'update',
			action: 'Update an invoice',
			description: 'Update an invoice',
		},
	],
	default: 'list',
};

const kindOptions: INodeProperties['options'] = [
	{ name: 'Advance', value: 'advance' },
	{ name: 'Bill', value: 'bill' },
	{ name: 'Correction', value: 'correction' },
	{ name: 'Estimate', value: 'estimate' },
	{ name: 'Final', value: 'final' },
	{ name: 'Proforma', value: 'proforma' },
	{ name: 'Receipt', value: 'receipt' },
	{ name: 'VAT Invoice', value: 'vat' },
];

const paymentTypeOptions: INodeProperties['options'] = [
	{ name: 'Bank Transfer', value: 'transfer' },
	{ name: 'Barter', value: 'barter' },
	{ name: 'Card', value: 'card' },
	{ name: 'Cash', value: 'cash' },
	{ name: 'Cheque', value: 'cheque' },
	{ name: 'PayPal', value: 'paypal' },
	{ name: 'PayU', value: 'payu' },
];

export const invoiceFields: INodeProperties[] = [
	// ------ Invoice ID (shared by get, update, delete, sendByEmail, downloadPdf) ------
	{
		displayName: 'Invoice ID',
		name: 'invoiceId',
		type: 'string',
		required: true,
		default: '',
		description: 'The ID of the invoice',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['get', 'update', 'delete', 'sendByEmail', 'downloadPdf'],
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
				resource: ['invoice'],
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
				resource: ['invoice'],
				operation: ['list'],
				returnAll: [false],
			},
		},
	},

	// ------ Kind (create) ------
	{
		displayName: 'Kind',
		name: 'kind',
		type: 'options',
		required: true,
		options: kindOptions,
		default: 'vat',
		description: 'Type of the invoice document',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
	},

	// ------ Buyer Name (create) ------
	{
		displayName: 'Buyer Name',
		name: 'buyerName',
		type: 'string',
		required: true,
		default: '',
		description: 'Full name of the buyer',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
	},

	// ------ Buyer Tax No (create) ------
	{
		displayName: 'Buyer Tax No',
		name: 'buyerTaxNo',
		type: 'string',
		required: true,
		default: '',
		description: 'Tax identification number (NIP) of the buyer',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
	},

	// ------ Positions (create) ------
	{
		displayName: 'Positions',
		name: 'positions',
		type: 'json',
		required: true,
		default: '[]',
		description:
			'Invoice line items as JSON array. Each item: {"name": "Item", "quantity": 1, "total_price_gross": 123.00, "tax": 23}',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['create'],
			},
		},
	},

	// ------ Email To (sendByEmail) ------
	{
		displayName: 'Email To',
		name: 'emailTo',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'name@email.com',
		description: 'Email address to send the invoice to',
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['sendByEmail'],
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
				resource: ['invoice'],
				operation: ['create'],
			},
		},
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'PLN',
				description: 'Invoice currency code',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Additional description on the invoice',
			},
			{
				displayName: 'Issue Date',
				name: 'issue_date',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Issue date of the invoice',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				default: 'pl',
				description: 'Invoice language code',
			},
			{
				displayName: 'Number',
				name: 'number',
				type: 'string',
				default: '',
				description: 'Invoice number (auto-generated if empty)',
			},
			{
				displayName: 'Payment Due Date',
				name: 'payment_to',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Payment due date',
			},
			{
				displayName: 'Payment Type',
				name: 'payment_type',
				type: 'options',
				options: paymentTypeOptions,
				default: 'transfer',
				description: 'Payment method for the invoice',
			},
			{
				displayName: 'Sell Date',
				name: 'sell_date',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Sell date of the invoice',
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
				resource: ['invoice'],
				operation: ['update'],
			},
		},
		options: [
			{
				displayName: 'Buyer Name',
				name: 'buyer_name',
				type: 'string',
				default: '',
				description: 'Full name of the buyer',
			},
			{
				displayName: 'Buyer Tax No',
				name: 'buyer_tax_no',
				type: 'string',
				default: '',
				description: 'Tax identification number (NIP) of the buyer',
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'string',
				default: 'PLN',
				description: 'Invoice currency code',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'Additional description on the invoice',
			},
			{
				displayName: 'Issue Date',
				name: 'issue_date',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Issue date of the invoice',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				options: kindOptions,
				default: 'vat',
				description: 'Type of the invoice document',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				default: 'pl',
				description: 'Invoice language code',
			},
			{
				displayName: 'Number',
				name: 'number',
				type: 'string',
				default: '',
				description: 'Invoice number',
			},
			{
				displayName: 'Payment Due Date',
				name: 'payment_to',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Payment due date',
			},
			{
				displayName: 'Payment Type',
				name: 'payment_type',
				type: 'options',
				options: paymentTypeOptions,
				default: 'transfer',
				description: 'Payment method for the invoice',
			},
			{
				displayName: 'Positions',
				name: 'positions',
				type: 'json',
				default: '[]',
				description:
					'Invoice line items as JSON array. Each item: {"name": "Item", "quantity": 1, "total_price_gross": 123.00, "tax": 23}',
			},
			{
				displayName: 'Sell Date',
				name: 'sell_date',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Sell date of the invoice',
			},
		],
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
				resource: ['invoice'],
				operation: ['list'],
			},
		},
		options: [
			{
				displayName: 'Date From',
				name: 'date_from',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'Start date filter (works with period=more)',
			},
			{
				displayName: 'Date To',
				name: 'date_to',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
				description: 'End date filter',
			},
			{
				displayName: 'Kind',
				name: 'kind',
				type: 'options',
				options: kindOptions,
				default: 'vat',
				description: 'Filter by invoice type',
			},
			{
				displayName: 'Period',
				name: 'period',
				type: 'options',
				options: [
					{ name: 'Last Month', value: 'last_month' },
					{ name: 'Last Year', value: 'last_year' },
					{ name: 'More (Custom Range)', value: 'more' },
					{ name: 'This Month', value: 'this_month' },
					{ name: 'This Year', value: 'this_year' },
				],
				default: 'this_month',
				description: 'Filter by time period',
			},
		],
	},

	// ------ Email Options (sendByEmail) ------
	{
		displayName: 'Email Options',
		name: 'emailOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['invoice'],
				operation: ['sendByEmail'],
			},
		},
		options: [
			{
				displayName: 'Attach PDF',
				name: 'email_pdf',
				type: 'boolean',
				default: true,
				description: 'Whether to attach the invoice PDF to the email',
			},
			{
				displayName: 'CC Email',
				name: 'email_cc',
				type: 'string',
				default: '',
				placeholder: 'cc@email.com',
				description: 'CC email addresses',
			},
		],
	},
];
