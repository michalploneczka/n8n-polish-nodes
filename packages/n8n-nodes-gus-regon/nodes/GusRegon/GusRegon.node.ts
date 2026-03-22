import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { gusRegonApiRequest } from './GenericFunctions';
import {
	daneSzukajPodmiotyEnvelope,
	danePobierzPelnyRaportEnvelope,
	URLS,
	REPORT_TYPES,
} from './SoapTemplates';
import { parseSearchResponse, parseReportResponse } from './XmlParser';
import { companyOperations, companyFields } from './resources/company';

export class GusRegon implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GUS REGON',
		name: 'gusRegon',
		icon: 'file:../../icons/gus-regon.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Search Polish government business registry (GUS REGON/BIR) by NIP, REGON, or KRS',
		defaults: {
			name: 'GUS REGON',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'gusRegonApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [{ name: 'Company', value: 'company' }],
				default: 'company',
			},
			companyOperations,
			...companyFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('gusRegonApi');
		const environment = credentials.environment as string;
		const url = environment === 'production' ? URLS.production : URLS.test;

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'company') {
					if (operation === 'searchByNip') {
						const nip = this.getNodeParameter('nip', i) as string;
						const envelope = daneSzukajPodmiotyEnvelope(url, { nip });
						const response = await gusRegonApiRequest.call(this, envelope);
						const results = parseSearchResponse(response);

						for (const result of results) {
							returnData.push({ json: result as unknown as IDataObject });
						}
					} else if (operation === 'searchByRegon') {
						const regon = this.getNodeParameter('regon', i) as string;
						const envelope = daneSzukajPodmiotyEnvelope(url, { regon });
						const response = await gusRegonApiRequest.call(this, envelope);
						const results = parseSearchResponse(response);

						for (const result of results) {
							returnData.push({ json: result as unknown as IDataObject });
						}
					} else if (operation === 'searchByKrs') {
						const krs = this.getNodeParameter('krs', i) as string;
						const envelope = daneSzukajPodmiotyEnvelope(url, { krs });
						const response = await gusRegonApiRequest.call(this, envelope);
						const results = parseSearchResponse(response);

						for (const result of results) {
							returnData.push({ json: result as unknown as IDataObject });
						}
					} else if (operation === 'getFullData') {
						const regonForReport = this.getNodeParameter(
							'regonForReport',
							i,
						) as string;
						const includePkd = this.getNodeParameter('includePkd', i) as boolean;

						// Step 1: Search by REGON to determine entity type
						const searchEnvelope = daneSzukajPodmiotyEnvelope(url, {
							regon: regonForReport,
						});
						const searchResponse = await gusRegonApiRequest.call(
							this,
							searchEnvelope,
						);
						const searchResults = parseSearchResponse(searchResponse);

						if (searchResults.length === 0) {
							returnData.push({
								json: { error: `No entity found for REGON: ${regonForReport}` } as IDataObject,
							});
							continue;
						}

						const entityType = searchResults[0].Typ;

						// Step 2: Select report type based on entity type (P = legal, F = natural person)
						const mainReportType =
							entityType === 'P'
								? REPORT_TYPES.legalEntity
								: entityType === 'F'
									? REPORT_TYPES.naturalPerson
									: REPORT_TYPES.legalEntity;

						const reportEnvelope = danePobierzPelnyRaportEnvelope(
							url,
							regonForReport,
							mainReportType,
						);
						const reportResponse = await gusRegonApiRequest.call(
							this,
							reportEnvelope,
						);
						const mainReport = parseReportResponse(reportResponse);

						// Step 3: Optionally fetch PKD codes
						let mergedResult: IDataObject = mainReport as unknown as IDataObject;

						if (includePkd) {
							const pkdReportType =
								entityType === 'P'
									? REPORT_TYPES.legalEntityPkd
									: entityType === 'F'
										? REPORT_TYPES.naturalPersonPkd
										: REPORT_TYPES.legalEntityPkd;

							const pkdEnvelope = danePobierzPelnyRaportEnvelope(
								url,
								regonForReport,
								pkdReportType,
							);
							const pkdResponse = await gusRegonApiRequest.call(
								this,
								pkdEnvelope,
							);
							const pkdResults = parseSearchResponse(pkdResponse);

							mergedResult = {
								...mainReport,
								pkdCodes: pkdResults,
							} as unknown as IDataObject;
						}

						returnData.push({ json: mergedResult });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
