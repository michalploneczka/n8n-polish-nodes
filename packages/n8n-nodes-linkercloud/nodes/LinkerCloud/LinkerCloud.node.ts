import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';

import { linkerCloudApiRequest, linkerCloudApiRequestAllItems } from './GenericFunctions';
import { orderOperations, orderFields } from './resources/order';
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
			orderOperations,
			...orderFields,
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

				if (resource === 'order') {
					if (operation === 'list') {
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};

						if (filters.updatedAt) qs["filters['updatedAt']"] = filters.updatedAt;
						if (filters.updatedAtTo) qs["filters['updatedAtTo']"] = filters.updatedAtTo;
						if (filters.created_at_with_time) qs["filters['created_at_with_time']"] = filters.created_at_with_time;
						if (filters.created_at_with_time_to) qs["filters['created_at_with_time_to']"] = filters.created_at_with_time_to;
						if (filters.sortDir) qs.sortDir = filters.sortDir;
						if (filters.sortCol) qs.sortCol = filters.sortCol;

						const orders = await linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/orders', {}, qs);
						for (const order of orders) {
							returnData.push({ json: order });
						}
					} else if (operation === 'get') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const response = await linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/orders/${orderId}`);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'create') {
						const orderDate = this.getNodeParameter('orderDate', i) as string;
						const executionDate = this.getNodeParameter('executionDate', i) as string;
						const executionDueDate = this.getNodeParameter('executionDueDate', i) as string;
						const deliveryEmail = this.getNodeParameter('deliveryEmail', i) as string;
						const codAmount = this.getNodeParameter('codAmount', i) as number;
						const shipmentPrice = this.getNodeParameter('shipmentPrice', i) as number;
						const shipmentPriceNet = this.getNodeParameter('shipmentPriceNet', i) as number;
						const discount = this.getNodeParameter('discount', i) as number;
						const paymentTransactionId = this.getNodeParameter('paymentTransactionId', i) as string;
						const itemsRaw = this.getNodeParameter('items', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						let parsedItems: IDataObject[];
						try {
							parsedItems = JSON.parse(itemsRaw) as IDataObject[];
							// Ensure required array fields default to empty arrays
							parsedItems = parsedItems.map(item => ({
								...item,
								serial_numbers: item.serial_numbers || [],
								custom_properties: item.custom_properties || [],
								source_data: item.source_data || [],
								batch_numbers: item.batch_numbers || [],
							}));
						} catch {
							throw new NodeApiError(this.getNode(), {}, {
								message: 'Invalid JSON in Items field. Expected array of objects.',
							});
						}

						// Parse JSON string fields from additionalFields
						const tags = additionalFields.tags ? JSON.parse(additionalFields.tags as string) : [];
						const customProperties = additionalFields.customProperties ? JSON.parse(additionalFields.customProperties as string) : [];
						const validationErrors = additionalFields.validationErrors ? JSON.parse(additionalFields.validationErrors as string) : [];
						delete additionalFields.tags;
						delete additionalFields.customProperties;
						delete additionalFields.validationErrors;

						const body: IDataObject = {
							orderDate,
							executionDate,
							executionDueDate,
							deliveryEmail,
							codAmount,
							shipmentPrice,
							shipmentPriceNet,
							discount,
							paymentTransactionId,
							items: parsedItems,
							tags,
							customProperties,
							validationErrors,
							...additionalFields,
						};

						const response = await linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/orders', body);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'update') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const updateFields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

						// Parse JSON string fields
						if (updateFields.items) {
							let parsedItems = JSON.parse(updateFields.items as string) as IDataObject[];
							parsedItems = parsedItems.map(item => ({
								...item,
								serial_numbers: item.serial_numbers || [],
								custom_properties: item.custom_properties || [],
								source_data: item.source_data || [],
								batch_numbers: item.batch_numbers || [],
							}));
							updateFields.items = parsedItems;
						}
						if (updateFields.tags) updateFields.tags = JSON.parse(updateFields.tags as string);
						if (updateFields.customProperties) updateFields.customProperties = JSON.parse(updateFields.customProperties as string);
						if (updateFields.validationErrors) updateFields.validationErrors = JSON.parse(updateFields.validationErrors as string);

						const response = await linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/orders/${orderId}`, updateFields);
						returnData.push({ json: response as IDataObject });
					} else if (operation === 'cancel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const response = await linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/orders/${orderId}/cancel`);
						returnData.push({ json: response as IDataObject });
					}
				} else if (resource === 'product') {
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
						const stockFilters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};
						if (stockFilters.sku) qs.sku = stockFilters.sku;
						if (stockFilters.depotId) qs.depotId = stockFilters.depotId;

						const stocks = await linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/stocks', {}, qs);
						for (const stock of stocks) {
							returnData.push({ json: stock });
						}
					} else if (operation === 'update') {
						const stockItemsRaw = this.getNodeParameter('items', i) as string;
						const additionalOptions = this.getNodeParameter('additionalOptions', i, {}) as IDataObject;

						let parsedStockItems: IDataObject[];
						try {
							parsedStockItems = JSON.parse(stockItemsRaw) as IDataObject[];
						} catch {
							throw new NodeApiError(this.getNode(), {}, {
								message: 'Invalid JSON in Items field. Expected array of objects with sku and totalQuantity.',
							});
						}

						const body: IDataObject = { items: parsedStockItems, ...additionalOptions };
						const response = await linkerCloudApiRequest.call(this, 'PUT', '/public-api/v1/products-stocks', body);
						returnData.push({ json: response as IDataObject });
					}

				} else if (resource === 'shipment') {
					if (operation === 'create') {
						const orderNumber = this.getNodeParameter('orderNumber', i) as string;
						const packagesRaw = this.getNodeParameter('packages', i) as string;
						const markAsPacked = this.getNodeParameter('markAsPacked', i) as boolean;
						const createAdditional = this.getNodeParameter('createAdditional', i) as boolean;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						let packages: IDataObject[];
						try {
							packages = JSON.parse(packagesRaw) as IDataObject[];
						} catch {
							throw new NodeApiError(this.getNode(), {}, {
								message: 'Invalid JSON in Packages field. Expected array of package objects.',
							});
						}

						const batchNumbers = additionalFields.batchNumbers
							? JSON.parse(additionalFields.batchNumbers as string)
							: [];
						delete additionalFields.batchNumbers;

						const body: IDataObject = {
							orderNumber,
							packages,
							markAsPacked,
							createAdditional,
							batchNumbers,
							...additionalFields,
						};

						const response = await linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/deliveries', body);
						returnData.push({ json: response as IDataObject });

					} else if (operation === 'createByOrderNumber') {
						const orderNumber = this.getNodeParameter('orderNumber', i) as string;
						const packagesRaw = this.getNodeParameter('packages', i) as string;

						let packages: IDataObject[];
						try {
							packages = JSON.parse(packagesRaw) as IDataObject[];
						} catch {
							throw new NodeApiError(this.getNode(), {}, {
								message: 'Invalid JSON in Packages field.',
							});
						}

						const body: IDataObject = { orderNumber, packages };
						const response = await linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/deliveries/packages', body);
						returnData.push({ json: response as IDataObject });

					} else if (operation === 'getLabel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const packageId = this.getNodeParameter('packageId', i) as string;
						const parcelId = this.getNodeParameter('parcelId', i) as string;
						const format = this.getNodeParameter('labelFormat', i) as string;

						const response = await linkerCloudApiRequest.call(
							this, 'GET',
							`/public-api/v1/${orderId}/${packageId}/${format}/${parcelId}`,
						);

						let binaryBuffer: Buffer;
						const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
						const fileName = `label-${orderId}-${parcelId}.${format}`;

						if (typeof response === 'object' && (response as IDataObject).label) {
							binaryBuffer = Buffer.from((response as IDataObject).label as string, 'base64');
						} else if (typeof response === 'string') {
							binaryBuffer = Buffer.from(response, 'base64');
						} else {
							binaryBuffer = Buffer.from(response as unknown as ArrayBuffer);
						}

						const binaryData = await this.helpers.prepareBinaryData(binaryBuffer, fileName, mimeType);
						returnData.push({
							json: { orderId, packageId, parcelId, format },
							binary: { data: binaryData },
						});

					} else if (operation === 'getStatus') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const response = await linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/deliveries/${orderId}`);
						returnData.push({ json: response as IDataObject });

					} else if (operation === 'cancel') {
						const orderId = this.getNodeParameter('orderId', i) as string;
						const packageIdsRaw = this.getNodeParameter('packageIdsToCancel', i) as string;
						const ids = packageIdsRaw.split(',').map(id => id.trim());
						const response = await linkerCloudApiRequest.call(this, 'PATCH', `/public-api/v1/deliveries/${orderId}`, { ids });
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
