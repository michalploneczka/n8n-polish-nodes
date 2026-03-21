import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';

import { linkerCloudApiRequest, linkerCloudApiRequestAllItems } from './GenericFunctions';
import { productOperations, productFields } from './resources/product';
import { shipmentOperations, shipmentFields } from './resources/shipment';
import { stockOperations, stockFields } from './resources/stock';

export class LinkerCloud implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Linker Cloud',
		name: 'linkerCloud',
		icon: 'file:../../icons/linkercloud.svg',
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage orders, products, stock, and shipments via Linker Cloud WMS/OMS',
		defaults: {
			name: 'Linker Cloud',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'linkerCloudApi',
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
					{ name: 'Inbound Order', value: 'inboundOrder' },
					{ name: 'Order', value: 'order' },
					{ name: 'Order Return', value: 'orderReturn' },
					{ name: 'Product', value: 'product' },
					{ name: 'Shipment', value: 'shipment' },
					{ name: 'Stock', value: 'stock' },
				],
				default: 'order',
			},
			// Resource operations and fields
			productOperations,
			...productFields,
			shipmentOperations,
			...shipmentFields,
			stockOperations,
			...stockFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'product') {
					if (operation === 'list') {
						const products = await linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/products');
						for (const product of products) {
							returnData.push({ json: product });
						}
					} else if (operation === 'create') {
						const name = this.getNodeParameter('name', i) as string;
						const sku = this.getNodeParameter('sku', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						const body: IDataObject = {
							name,
							sku,
							// Required boolean fields -- default to false
							ignore_in_wms: additionalFields.ignore_in_wms ?? false,
							ignore_when_packing: additionalFields.ignore_when_packing ?? false,
							always_ask_for_serial_number: additionalFields.always_ask_for_serial_number ?? false,
							has_batch_number: additionalFields.has_batch_number ?? false,
							is_expirable: additionalFields.is_expirable ?? false,
							is_bio: additionalFields.is_bio ?? false,
							is_food: additionalFields.is_food ?? false,
							is_insert: additionalFields.is_insert ?? false,
							is_fragile: additionalFields.is_fragile ?? false,
							// Required array fields -- default to empty
							storageUnits: [],
							nameAliases: [],
							images: [],
							additionalCodes: [],
						};

						// Merge remaining additional fields (barcode, depotId, weight, dimensions)
						const boolFields = [
							'ignore_in_wms', 'ignore_when_packing', 'always_ask_for_serial_number',
							'has_batch_number', 'is_expirable', 'is_bio', 'is_food', 'is_insert', 'is_fragile',
						];
						for (const [key, value] of Object.entries(additionalFields)) {
							if (!boolFields.includes(key)) {
								body[key] = value;
							}
						}

						const response = await linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/products', body);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'update') {
						const productId = this.getNodeParameter('productId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
						const response = await linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/products/${productId}`, updateFields);
						returnData.push({ json: response as IDataObject });
					}
				} else if (resource === 'stock') {
					if (operation === 'list') {
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (filters.sku) qs.sku = filters.sku;
						if (filters.depotId) qs.depotId = filters.depotId;

						const stocks = await linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/stocks', {}, qs);
						for (const stock of stocks) {
							returnData.push({ json: stock });
						}
					} else if (operation === 'update') {
						const itemsRaw = this.getNodeParameter('items', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

						let parsedItems: IDataObject[];
						try {
							parsedItems = JSON.parse(itemsRaw) as IDataObject[];
						} catch {
							throw new NodeApiError(this.getNode(), {}, {
								message: 'Invalid JSON in Items field. Expected array of objects with sku and totalQuantity.',
							});
						}

						const body: IDataObject = { items: parsedItems, ...additionalOptions };
						const response = await linkerCloudApiRequest.call(this, 'PUT', '/public-api/v1/products-stocks', body);
						returnData.push({ json: response as IDataObject });
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
