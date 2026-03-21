import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';

import { fakturowniaApiRequest, fakturowniaApiRequestAllItems } from './GenericFunctions';
import { invoiceOperations, invoiceFields } from './resources/invoices';

export class Fakturownia implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Fakturownia',
		name: 'fakturownia',
		icon: 'file:../../icons/fakturownia.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage invoices, clients, and products via Fakturownia.pl',
		defaults: {
			name: 'Fakturownia',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'fakturowniaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Invoice', value: 'invoice' },
				],
				default: 'invoice',
			},
			invoiceOperations,
			...invoiceFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'invoice') {
					if (operation === 'list') {
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};

						if (filters.period) {
							qs.period = filters.period;
						}
						if (filters.date_from) {
							qs.date_from = filters.date_from;
						}
						if (filters.date_to) {
							qs.date_to = filters.date_to;
						}
						if (filters.kind) {
							qs.kind = filters.kind;
						}

						const invoices = await fakturowniaApiRequestAllItems.call(
							this,
							'GET',
							'/invoices.json',
							{},
							qs,
						);

						for (const invoice of invoices) {
							returnData.push({ json: invoice });
						}
					} else if (operation === 'get') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const response = await fakturowniaApiRequest.call(
							this,
							'GET',
							`/invoices/${invoiceId}.json`,
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'create') {
						const kind = this.getNodeParameter('kind', i) as string;
						const buyerName = this.getNodeParameter('buyerName', i) as string;
						const buyerTaxNo = this.getNodeParameter('buyerTaxNo', i) as string;
						const positionsRaw = this.getNodeParameter('positions', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						let positions: IDataObject[];
						try {
							positions = JSON.parse(positionsRaw) as IDataObject[];
						} catch {
							throw new NodeApiError(this.getNode(), {}, {
								message: 'Invalid JSON in Positions field. Expected array of objects.',
							});
						}

						const invoiceBody: IDataObject = {
							kind,
							buyer_name: buyerName,
							buyer_tax_no: buyerTaxNo,
							positions,
							...additionalFields,
						};

						const response = await fakturowniaApiRequest.call(
							this,
							'POST',
							'/invoices.json',
							{ invoice: invoiceBody },
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'update') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						if (updateFields.positions) {
							try {
								updateFields.positions = JSON.parse(updateFields.positions as string) as IDataObject[];
							} catch {
								throw new NodeApiError(this.getNode(), {}, {
									message: 'Invalid JSON in Positions field. Expected array of objects.',
								});
							}
						}

						const response = await fakturowniaApiRequest.call(
							this,
							'PUT',
							`/invoices/${invoiceId}.json`,
							{ invoice: updateFields },
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'delete') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						await fakturowniaApiRequest.call(
							this,
							'DELETE',
							`/invoices/${invoiceId}.json`,
						);
						returnData.push({ json: { success: true, id: invoiceId } });
					} else if (operation === 'sendByEmail') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const emailTo = this.getNodeParameter('emailTo', i) as string;
						const emailOptions = this.getNodeParameter('emailOptions', i, {}) as IDataObject;

						const body: IDataObject = {
							email_to: emailTo,
							...emailOptions,
						};

						const response = await fakturowniaApiRequest.call(
							this,
							'POST',
							`/invoices/${invoiceId}/send_by_email.json`,
							body,
						);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'downloadPdf') {
						const invoiceId = this.getNodeParameter('invoiceId', i) as string;
						const response = await fakturowniaApiRequest.call(
							this,
							'GET',
							`/invoices/${invoiceId}.pdf`,
							{},
							{},
							{ encoding: 'arraybuffer', json: false },
						);
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(response as ArrayBuffer),
							`invoice-${invoiceId}.pdf`,
							'application/pdf',
						);
						returnData.push({
							json: { invoiceId },
							binary: { data: binaryData },
						});
					} else {
						throw new NodeApiError(this.getNode(), {}, {
							message: `Unsupported resource/operation: ${resource}/${operation}`,
						});
					}
				} else {
					throw new NodeApiError(this.getNode(), {}, {
						message: `Unsupported resource/operation: ${resource}/${operation}`,
					});
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
