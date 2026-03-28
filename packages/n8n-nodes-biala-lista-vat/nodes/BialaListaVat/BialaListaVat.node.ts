import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class BialaListaVat implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Biala Lista VAT',
		name: 'bialaListaVat',
		icon: 'file:../../icons/biala-lista-vat.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Verify Polish VAT taxpayers and bank accounts via the White List (Biala Lista)',
		defaults: { name: 'Biala Lista VAT' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		requestDefaults: {
			baseURL: 'https://wl-api.mf.gov.pl',
			headers: { Accept: 'application/json' },
		},
		properties: [
			// ── Resource selector ──
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Subject', value: 'subject' },
					{ name: 'Verification', value: 'verification' },
				],
				default: 'subject',
			},

			// ── Subject operations (6 total) ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['subject'] } },
				options: [
					{ name: 'Search by Bank Account', value: 'searchByBankAccount', description: 'Find VAT taxpayer by bank account number', action: 'Search subject by bank account' },
					{ name: 'Search by Bank Accounts (Batch)', value: 'searchByBankAccounts', description: 'Batch search up to 30 bank account numbers', action: 'Batch search subjects by bank accounts' },
					{ name: 'Search by NIP', value: 'searchByNip', description: 'Search VAT taxpayer by NIP number', action: 'Search subject by NIP' },
					{ name: 'Search by NIPs (Batch)', value: 'searchByNips', description: 'Batch search up to 30 NIP numbers', action: 'Batch search subjects by NIP numbers' },
					{ name: 'Search by REGON', value: 'searchByRegon', description: 'Search VAT taxpayer by REGON number', action: 'Search subject by REGON' },
					{ name: 'Search by REGONs (Batch)', value: 'searchByRegons', description: 'Batch search up to 30 REGON numbers', action: 'Batch search subjects by REGON numbers' },
				],
				default: 'searchByNip',
			},

			// ── Verification operations (2 total) ──
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['verification'] } },
				options: [
					{ name: 'Check NIP + Bank Account', value: 'checkNipAccount', description: 'Verify if bank account belongs to NIP holder', action: 'Check NIP and bank account match' },
					{ name: 'Check REGON + Bank Account', value: 'checkRegonAccount', description: 'Verify if bank account belongs to REGON holder', action: 'Check REGON and bank account match' },
				],
				default: 'checkNipAccount',
			},

			// ── Subject: searchByNip fields ──
			{
				displayName: 'NIP',
				name: 'nip',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5213017228',
				description: 'NIP number (10 digits, no dashes)',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByNip'] } },
				routing: { request: { method: 'GET', url: '=/api/search/nip/{{$value}}' } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByNip'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Subject: searchByNips (batch) fields ──
			{
				displayName: 'NIPs',
				name: 'nips',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5213017228,1234567890',
				description: 'Comma-separated NIP numbers (max 30). No spaces.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByNips'] } },
				routing: { request: { method: 'GET', url: '=/api/search/nips/{{$value}}' } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByNips'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Subject: searchByRegon fields ──
			{
				displayName: 'REGON',
				name: 'regon',
				type: 'string',
				required: true,
				default: '',
				placeholder: '610188201',
				description: 'REGON number (9 or 14 digits)',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByRegon'] } },
				routing: { request: { method: 'GET', url: '=/api/search/regon/{{$value}}' } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByRegon'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Subject: searchByRegons (batch) fields ──
			{
				displayName: 'REGONs',
				name: 'regons',
				type: 'string',
				required: true,
				default: '',
				placeholder: '610188201,123456789',
				description: 'Comma-separated REGON numbers (max 30). No spaces.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByRegons'] } },
				routing: { request: { method: 'GET', url: '=/api/search/regons/{{$value}}' } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByRegons'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Subject: searchByBankAccount fields ──
			{
				displayName: 'Bank Account',
				name: 'bankAccount',
				type: 'string',
				required: true,
				default: '',
				placeholder: '12345678901234567890123456',
				description: 'Bank account number in NRB format (26 digits, no spaces or dashes)',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByBankAccount'] } },
				routing: { request: { method: 'GET', url: '=/api/search/bank-account/{{$value}}' } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByBankAccount'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Subject: searchByBankAccounts (batch) fields ──
			{
				displayName: 'Bank Accounts',
				name: 'bankAccounts',
				type: 'string',
				required: true,
				default: '',
				placeholder: '12345678901234567890123456,98765432109876543210987654',
				description: 'Comma-separated bank account numbers in NRB format (max 30). No spaces.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByBankAccounts'] } },
				routing: { request: { method: 'GET', url: '=/api/search/bank-accounts/{{$value}}' } },
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['subject'], operation: ['searchByBankAccounts'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Verification: checkNipAccount fields ──
			{
				displayName: 'NIP',
				name: 'checkNip',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5213017228',
				description: 'NIP number to verify (10 digits)',
				displayOptions: { show: { resource: ['verification'], operation: ['checkNipAccount'] } },
			},
			{
				displayName: 'Bank Account',
				name: 'checkBankAccount',
				type: 'string',
				required: true,
				default: '',
				placeholder: '12345678901234567890123456',
				description: 'Bank account number in NRB format (26 digits)',
				displayOptions: { show: { resource: ['verification'], operation: ['checkNipAccount'] } },
				routing: {
					request: {
						method: 'GET',
						url: '=/api/check/nip/{{$parameter["checkNip"]}}/bank-account/{{$value}}',
					},
				},
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['verification'], operation: ['checkNipAccount'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},

			// ── Verification: checkRegonAccount fields ──
			{
				displayName: 'REGON',
				name: 'checkRegon',
				type: 'string',
				required: true,
				default: '',
				placeholder: '610188201',
				description: 'REGON number to verify (9 or 14 digits)',
				displayOptions: { show: { resource: ['verification'], operation: ['checkRegonAccount'] } },
			},
			{
				displayName: 'Bank Account',
				name: 'checkRegonBankAccount',
				type: 'string',
				required: true,
				default: '',
				placeholder: '12345678901234567890123456',
				description: 'Bank account number in NRB format (26 digits)',
				displayOptions: { show: { resource: ['verification'], operation: ['checkRegonAccount'] } },
				routing: {
					request: {
						method: 'GET',
						url: '=/api/check/regon/{{$parameter["checkRegon"]}}/bank-account/{{$value}}',
					},
				},
			},
			{
				displayName: 'Date',
				name: 'date',
				type: 'string',
				required: true,
				default: '={{ $now.format(\'yyyy-MM-dd\') }}',
				placeholder: '2026-03-23',
				description: 'Date for verification (YYYY-MM-DD format). Defaults to today.',
				displayOptions: { show: { resource: ['verification'], operation: ['checkRegonAccount'] } },
				routing: { send: { type: 'query', property: 'date' } },
			},
		],
	};
}
