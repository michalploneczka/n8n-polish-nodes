import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Krs implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'KRS',
		name: 'krs',
		icon: 'file:../../icons/krs.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Look up companies in the Polish National Court Register (KRS)',
		defaults: {
			name: 'KRS',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		requestDefaults: {
			baseURL: 'https://api-krs.ms.gov.pl/api/krs',
			headers: {
				Accept: 'application/json',
			},
			qs: {
				format: 'json',
			},
		},
		properties: [
			// ── Resource selector ──────────────────────────────────────────
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Company',
						value: 'company',
					},
				],
				default: 'company',
			},

			// ── Company operations ─────────────────────────────────────────
			{
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
						name: 'Get Current Extract',
						value: 'getCurrentExtract',
						description: 'Get the current company data extract from KRS',
						action: 'Get current extract of a company',
					},
					{
						name: 'Get Full Extract',
						value: 'getFullExtract',
						description: 'Get the full historical company data extract from KRS',
						action: 'Get full extract of a company',
					},
				],
				default: 'getCurrentExtract',
			},

			// ── KRS Number for getCurrentExtract ───────────────────────────
			{
				displayName: 'KRS Number',
				name: 'krsNumber',
				type: 'string',
				required: true,
				default: '',
				placeholder: '0000019193',
				description: 'KRS number (10 digits, zero-padded). Example: 0000019193.',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['getCurrentExtract'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/OdpisAktualny/{{$value}}',
					},
				},
			},

			// ── KRS Number for getFullExtract ──────────────────────────────
			{
				displayName: 'KRS Number',
				name: 'krsNumber',
				type: 'string',
				required: true,
				default: '',
				placeholder: '0000019193',
				description: 'KRS number (10 digits, zero-padded). Example: 0000019193.',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['getFullExtract'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/OdpisPelny/{{$value}}',
					},
				},
			},

			// ── Optional: Register type for getCurrentExtract ──────────────
			{
				displayName: 'Register Type',
				name: 'rejestr',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['getCurrentExtract'],
					},
				},
				options: [
					{ name: 'Auto-Detect', value: '' },
					{ name: 'Entrepreneurs (P)', value: 'P' },
					{ name: 'Associations (S)', value: 'S' },
				],
				default: '',
				description: 'Type of register to search. Auto-detect works in most cases.',
				routing: {
					send: {
						type: 'query',
						property: 'rejestr',
						value: '={{$value || undefined}}',
					},
				},
			},

			// ── Optional: Register type for getFullExtract ─────────────────
			{
				displayName: 'Register Type',
				name: 'rejestr',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['getFullExtract'],
					},
				},
				options: [
					{ name: 'Auto-Detect', value: '' },
					{ name: 'Entrepreneurs (P)', value: 'P' },
					{ name: 'Associations (S)', value: 'S' },
				],
				default: '',
				description: 'Type of register to search. Auto-detect works in most cases.',
				routing: {
					send: {
						type: 'query',
						property: 'rejestr',
						value: '={{$value || undefined}}',
					},
				},
			},
		],
	};
}
