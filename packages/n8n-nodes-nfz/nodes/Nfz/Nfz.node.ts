import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Nfz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'NFZ Treatment Waiting Times',
		name: 'nfz',
		icon: 'file:../../icons/nfz.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Search healthcare waiting times and providers from NFZ (National Health Fund of Poland)',
		defaults: {
			name: 'NFZ',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		requestDefaults: {
			baseURL: 'https://api.nfz.gov.pl/app-itl-api',
			headers: {
				Accept: 'application/json',
			},
			qs: {
				'api-version': '1.3',
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
						name: 'Benefit',
						value: 'benefit',
					},
					{
						name: 'Locality',
						value: 'locality',
					},
					{
						name: 'Province',
						value: 'province',
					},
					{
						name: 'Queue',
						value: 'queue',
					},
				],
				default: 'queue',
			},

			// ── Queue operations ───────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['queue'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get details of a specific queue entry',
						action: 'Get queue entry details',
					},
					{
						name: 'Get Many Places',
						value: 'getManyPlaces',
						description: 'Get alternative appointment locations for a queue entry',
						action: 'Get alternative locations for a queue entry',
					},
					{
						name: 'Search',
						value: 'search',
						description: 'Search treatment waiting times',
						action: 'Search treatment waiting times',
						routing: {
							request: {
								method: 'GET',
								url: '/queues',
							},
						},
					},
				],
				default: 'search',
			},

			// ── Benefit operations ─────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['benefit'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search healthcare benefit names',
						action: 'Search healthcare benefit names',
						routing: {
							request: {
								method: 'GET',
								url: '/benefits',
							},
						},
					},
				],
				default: 'search',
			},

			// ── Locality operations ────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['locality'],
					},
				},
				options: [
					{
						name: 'Search',
						value: 'search',
						description: 'Search locality names',
						action: 'Search locality names',
						routing: {
							request: {
								method: 'GET',
								url: '/localities',
							},
						},
					},
				],
				default: 'search',
			},

			// ── Province operations ────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['province'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						description: 'Get many provinces',
						action: 'Get many provinces',
						routing: {
							request: {
								method: 'GET',
								url: '/provinces',
							},
						},
					},
				],
				default: 'getAll',
			},

			// ── Queue Search fields ────────────────────────────────────────
			{
				displayName: 'Case Type',
				name: 'case',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				options: [
					{ name: 'Stable (Stabilny)', value: 1 },
					{ name: 'Urgent (Pilny)', value: 2 },
				],
				default: 1,
				description: 'Medical case type -- stable or urgent',
				routing: {
					send: {
						type: 'query',
						property: 'case',
					},
				},
			},
			{
				displayName: 'Province',
				name: 'province',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				options: [
					{ name: 'All Provinces', value: '' },
					{ name: 'Dolnoslaskie (01)', value: '01' },
					{ name: 'Kujawsko-Pomorskie (02)', value: '02' },
					{ name: 'Lodzkie (05)', value: '05' },
					{ name: 'Lubelskie (03)', value: '03' },
					{ name: 'Lubuskie (04)', value: '04' },
					{ name: 'Malopolskie (06)', value: '06' },
					{ name: 'Mazowieckie (07)', value: '07' },
					{ name: 'Opolskie (08)', value: '08' },
					{ name: 'Podkarpackie (09)', value: '09' },
					{ name: 'Podlaskie (10)', value: '10' },
					{ name: 'Pomorskie (11)', value: '11' },
					{ name: 'Slaskie (12)', value: '12' },
					{ name: 'Swietokrzyskie (13)', value: '13' },
					{ name: 'Warminsko-Mazurskie (14)', value: '14' },
					{ name: 'Wielkopolskie (15)', value: '15' },
					{ name: 'Zachodniopomorskie (16)', value: '16' },
				],
				default: '',
				description: 'Filter by Polish voivodeship (province)',
				routing: {
					send: {
						type: 'query',
						property: 'province',
						value: '={{ $value || undefined }}',
					},
				},
			},
			{
				displayName: 'Benefit',
				name: 'benefit',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Healthcare benefit name (partial match, e.g. "poradnia", "ortop")',
				routing: {
					send: {
						type: 'query',
						property: 'benefit',
						value: '={{ $value || undefined }}',
					},
				},
			},
			{
				displayName: 'Locality',
				name: 'locality',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'City or locality name (e.g. "Warszawa", "Krakow")',
				routing: {
					send: {
						type: 'query',
						property: 'locality',
						value: '={{ $value || undefined }}',
					},
				},
			},
			{
				displayName: 'For Children',
				name: 'benefitForChildren',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Yes', value: 'Y' },
					{ name: 'No', value: 'N' },
				],
				default: '',
				description: 'Filter for services for children',
				routing: {
					send: {
						type: 'query',
						property: 'benefitForChildren',
						value: '={{ $value || undefined }}',
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
				routing: {
					send: {
						type: 'query',
						property: 'page',
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['search'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},

			// ── Queue Get fields ───────────────────────────────────────────
			{
				displayName: 'Queue ID',
				name: 'queueId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['get'],
					},
				},
				default: '',
				description: 'The ID (GUID) of the queue entry',
				routing: {
					request: {
						method: 'GET',
						url: '=/queues/{{$value}}',
					},
				},
			},

			// ── Queue Get Many Places fields ───────────────────────────────
			{
				displayName: 'Queue ID',
				name: 'queueId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['getManyPlaces'],
					},
				},
				default: '',
				description: 'The ID (GUID) of the queue entry',
				routing: {
					request: {
						method: 'GET',
						url: '=/queues/{{$value}}/many-places',
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['getManyPlaces'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
				routing: {
					send: {
						type: 'query',
						property: 'page',
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['queue'],
						operation: ['getManyPlaces'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},

			// ── Benefit Search fields ──────────────────────────────────────
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['benefit'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Benefit name to search (partial match)',
				routing: {
					send: {
						type: 'query',
						property: 'name',
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['benefit'],
						operation: ['search'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
				routing: {
					send: {
						type: 'query',
						property: 'page',
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['benefit'],
						operation: ['search'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},

			// ── Locality Search fields ─────────────────────────────────────
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						resource: ['locality'],
						operation: ['search'],
					},
				},
				default: '',
				description: 'Locality name to search (partial match)',
				routing: {
					send: {
						type: 'query',
						property: 'name',
					},
				},
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				displayOptions: {
					show: {
						resource: ['locality'],
						operation: ['search'],
					},
				},
				default: 1,
				description: 'Page number for pagination',
				routing: {
					send: {
						type: 'query',
						property: 'page',
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: {
					minValue: 1,
				},
				displayOptions: {
					show: {
						resource: ['locality'],
						operation: ['search'],
					},
				},
				default: 50,
				description: 'Max number of results to return',
				routing: {
					send: {
						type: 'query',
						property: 'limit',
					},
				},
			},
		],
	};
}
