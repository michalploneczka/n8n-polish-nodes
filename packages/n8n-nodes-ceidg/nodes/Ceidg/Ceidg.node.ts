import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Ceidg implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'CEIDG',
		name: 'ceidg',
		icon: 'file:../../icons/ceidg.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Look up Polish companies in the CEIDG registry (dane.biznes.gov.pl)',
		defaults: {
			name: 'CEIDG',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'ceidgApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v3',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
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
						name: 'Get',
						value: 'get',
						description: 'Get a company by CEIDG entry ID',
						action: 'Get a company',
					},
					{
						name: 'Search by Name',
						value: 'searchByName',
						description: 'Search for companies by name',
						action: 'Search companies by name',
					},
					{
						name: 'Search by NIP',
						value: 'searchByNip',
						description: 'Search for a company by NIP number',
						action: 'Search company by NIP',
					},
				],
				default: 'searchByNip',
			},
			{
				displayName: 'NIP',
				name: 'nip',
				type: 'string',
				required: true,
				default: '',
				placeholder: '1234567890',
				description: 'NIP number to search for',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['searchByNip'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '/firma',
					},
					send: {
						type: 'query',
						property: 'nip',
					},
				},
			},
			{
				displayName: 'Company Name',
				name: 'nazwa',
				type: 'string',
				required: true,
				default: '',
				description: 'Company name or part of name to search for',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['searchByName'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '/firmy',
					},
					send: {
						type: 'query',
						property: 'nazwa',
					},
				},
			},
			{
				displayName: 'Company ID',
				name: 'companyId',
				type: 'string',
				required: true,
				default: '',
				placeholder: '31F87519-9395-4FCF-8E19-6D5C0522FA7A',
				description: 'CEIDG entry UUID (from search results — field: id)',
				displayOptions: {
					show: {
						resource: ['company'],
						operation: ['get'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/firma/{{$value}}',
					},
				},
			},
		],
	};
}
