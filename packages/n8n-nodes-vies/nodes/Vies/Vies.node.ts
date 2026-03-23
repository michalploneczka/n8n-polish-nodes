import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Vies implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'VIES',
		name: 'vies',
		icon: 'file:../../icons/vies.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Validate EU VAT numbers via VIES (VAT Information Exchange System)',
		defaults: {
			name: 'VIES',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		requestDefaults: {
			baseURL: 'https://ec.europa.eu/taxation_customs/vies/rest-api',
			headers: {
				Accept: 'application/json',
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
						name: 'VAT Number',
						value: 'vatNumber',
					},
				],
				default: 'vatNumber',
			},

			// ── Operation ──────────────────────────────────────────────────
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['vatNumber'],
					},
				},
				options: [
					{
						name: 'Validate',
						value: 'validate',
						description: 'Validate an EU VAT number and get company information',
						action: 'Validate a VAT number',
					},
				],
				default: 'validate',
			},

			// ── Country Code ───────────────────────────────────────────────
			{
				displayName: 'Country Code',
				name: 'countryCode',
				type: 'options',
				required: true,
				displayOptions: {
					show: {
						resource: ['vatNumber'],
						operation: ['validate'],
					},
				},
				options: [
					{ name: 'Austria (AT)', value: 'AT' },
					{ name: 'Belgium (BE)', value: 'BE' },
					{ name: 'Bulgaria (BG)', value: 'BG' },
					{ name: 'Croatia (HR)', value: 'HR' },
					{ name: 'Cyprus (CY)', value: 'CY' },
					{ name: 'Czech Republic (CZ)', value: 'CZ' },
					{ name: 'Denmark (DK)', value: 'DK' },
					{ name: 'Estonia (EE)', value: 'EE' },
					{ name: 'Finland (FI)', value: 'FI' },
					{ name: 'France (FR)', value: 'FR' },
					{ name: 'Germany (DE)', value: 'DE' },
					{ name: 'Greece (EL)', value: 'EL' },
					{ name: 'Hungary (HU)', value: 'HU' },
					{ name: 'Ireland (IE)', value: 'IE' },
					{ name: 'Italy (IT)', value: 'IT' },
					{ name: 'Latvia (LV)', value: 'LV' },
					{ name: 'Lithuania (LT)', value: 'LT' },
					{ name: 'Luxembourg (LU)', value: 'LU' },
					{ name: 'Malta (MT)', value: 'MT' },
					{ name: 'Netherlands (NL)', value: 'NL' },
					{ name: 'Northern Ireland (XI)', value: 'XI' },
					{ name: 'Poland (PL)', value: 'PL' },
					{ name: 'Portugal (PT)', value: 'PT' },
					{ name: 'Romania (RO)', value: 'RO' },
					{ name: 'Slovakia (SK)', value: 'SK' },
					{ name: 'Slovenia (SI)', value: 'SI' },
					{ name: 'Spain (ES)', value: 'ES' },
					{ name: 'Sweden (SE)', value: 'SE' },
				],
				default: 'PL',
				description: 'EU member state country code',
			},

			// ── VAT Number ─────────────────────────────────────────────────
			{
				displayName: 'VAT Number',
				name: 'vatNumber',
				type: 'string',
				required: true,
				default: '',
				placeholder: '5213017228',
				description: 'VAT number without country prefix (2-12 alphanumeric characters)',
				displayOptions: {
					show: {
						resource: ['vatNumber'],
						operation: ['validate'],
					},
				},
				routing: {
					request: {
						method: 'GET',
						url: '=/ms/{{$parameter["countryCode"]}}/vat/{{$value}}',
					},
				},
			},
		],
	};
}
