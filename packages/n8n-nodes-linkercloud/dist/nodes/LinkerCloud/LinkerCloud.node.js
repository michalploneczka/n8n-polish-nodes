"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkerCloud = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
const inboundOrder_1 = require("./resources/inboundOrder");
const order_1 = require("./resources/order");
const orderReturn_1 = require("./resources/orderReturn");
const product_1 = require("./resources/product");
const shipment_1 = require("./resources/shipment");
const stock_1 = require("./resources/stock");
class LinkerCloud {
    constructor() {
        this.description = {
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
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                inboundOrder_1.inboundOrderOperations,
                ...inboundOrder_1.inboundOrderFields,
                order_1.orderOperations,
                ...order_1.orderFields,
                orderReturn_1.orderReturnOperations,
                ...orderReturn_1.orderReturnFields,
                product_1.productOperations,
                ...product_1.productFields,
                shipment_1.shipmentOperations,
                ...shipment_1.shipmentFields,
                stock_1.stockOperations,
                ...stock_1.stockFields,
            ],
        };
    }
    async execute() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                if (resource === 'order') {
                    if (operation === 'list') {
                        const filters = this.getNodeParameter('filters', i, {});
                        const qs = {};
                        if (filters.updatedAt)
                            qs["filters['updatedAt']"] = filters.updatedAt;
                        if (filters.updatedAtTo)
                            qs["filters['updatedAtTo']"] = filters.updatedAtTo;
                        if (filters.created_at_with_time)
                            qs["filters['created_at_with_time']"] = filters.created_at_with_time;
                        if (filters.created_at_with_time_to)
                            qs["filters['created_at_with_time_to']"] = filters.created_at_with_time_to;
                        if (filters.sortDir)
                            qs.sortDir = filters.sortDir;
                        if (filters.sortCol)
                            qs.sortCol = filters.sortCol;
                        const orders = await GenericFunctions_1.linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/orders', {}, qs);
                        for (const order of orders) {
                            returnData.push({ json: order });
                        }
                    }
                    else if (operation === 'get') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/orders/${orderId}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'create') {
                        const orderDate = this.getNodeParameter('orderDate', i);
                        const executionDate = this.getNodeParameter('executionDate', i);
                        const executionDueDate = this.getNodeParameter('executionDueDate', i);
                        const deliveryEmail = this.getNodeParameter('deliveryEmail', i);
                        const codAmount = this.getNodeParameter('codAmount', i);
                        const shipmentPrice = this.getNodeParameter('shipmentPrice', i);
                        const shipmentPriceNet = this.getNodeParameter('shipmentPriceNet', i);
                        const discount = this.getNodeParameter('discount', i);
                        const paymentTransactionId = this.getNodeParameter('paymentTransactionId', i);
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        const itemsMode = this.getNodeParameter('itemsMode', i, 'ui');
                        let parsedItems;
                        if (itemsMode === 'ui') {
                            const itemsUi = this.getNodeParameter('itemsUi', i, {});
                            const itemValues = itemsUi.itemValues || [];
                            parsedItems = itemValues.map(item => ({
                                ...item,
                                serial_numbers: [],
                                custom_properties: [],
                                source_data: [],
                                batch_numbers: [],
                            }));
                        }
                        else {
                            const itemsRaw = this.getNodeParameter('items', i);
                            try {
                                parsedItems = JSON.parse(itemsRaw);
                                parsedItems = parsedItems.map(item => ({
                                    ...item,
                                    serial_numbers: item.serial_numbers || [],
                                    custom_properties: item.custom_properties || [],
                                    source_data: item.source_data || [],
                                    batch_numbers: item.batch_numbers || [],
                                }));
                            }
                            catch {
                                throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, {
                                    message: 'Invalid JSON in Items field. Expected array of objects.',
                                });
                            }
                        }
                        const tags = additionalFields.tags ? JSON.parse(additionalFields.tags) : [];
                        const customProperties = additionalFields.customProperties ? JSON.parse(additionalFields.customProperties) : [];
                        const validationErrors = additionalFields.validationErrors ? JSON.parse(additionalFields.validationErrors) : [];
                        if (additionalFields.deliveryConfiguration) {
                            additionalFields.deliveryConfiguration = JSON.parse(additionalFields.deliveryConfiguration);
                        }
                        delete additionalFields.tags;
                        delete additionalFields.customProperties;
                        delete additionalFields.validationErrors;
                        const body = {
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
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/orders', body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'update') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const updateFields = this.getNodeParameter('updateFields', i, {});
                        if (updateFields.items) {
                            let parsedItems = JSON.parse(updateFields.items);
                            parsedItems = parsedItems.map(item => ({
                                ...item,
                                serial_numbers: item.serial_numbers || [],
                                custom_properties: item.custom_properties || [],
                                source_data: item.source_data || [],
                                batch_numbers: item.batch_numbers || [],
                            }));
                            updateFields.items = parsedItems;
                        }
                        if (updateFields.tags)
                            updateFields.tags = JSON.parse(updateFields.tags);
                        if (updateFields.customProperties)
                            updateFields.customProperties = JSON.parse(updateFields.customProperties);
                        if (updateFields.validationErrors)
                            updateFields.validationErrors = JSON.parse(updateFields.validationErrors);
                        if (updateFields.deliveryConfiguration)
                            updateFields.deliveryConfiguration = JSON.parse(updateFields.deliveryConfiguration);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/orders/${orderId}`, updateFields);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'cancel') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/orders/${orderId}/cancel`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'getTransitions') {
                        const id = this.getNodeParameter('orderId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/orders/${id}/transition`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'applyTransition') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const transition = this.getNodeParameter('transitionName', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', `/public-api/v1/orders/${orderId}/transitions/${transition}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'updateTrackingNumber') {
                        const id = this.getNodeParameter('orderId', i);
                        const trackingNumber = this.getNodeParameter('trackingNumber', i);
                        const operator = this.getNodeParameter('operator', i);
                        const trackingUrl = this.getNodeParameter('trackingUrl', i, '');
                        const body = { tracking_number: trackingNumber, operator };
                        if (trackingUrl)
                            body.url = trackingUrl;
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/orders/${id}/trackingnumber`, body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'updatePaymentStatus') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const paymentStatus = this.getNodeParameter('paymentStatus', i);
                        const paymentDate = this.getNodeParameter('paymentDate', i, '');
                        const paymentTransactionId = this.getNodeParameter('paymentTransactionIdForPayment', i, '');
                        const identifierType = this.getNodeParameter('orderIdentifier', i, 'id');
                        const item = { paymentStatus };
                        item[identifierType] = orderId;
                        if (paymentDate)
                            item.paymentDate = paymentDate;
                        if (paymentTransactionId)
                            item.paymentTransactionId = paymentTransactionId;
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', '/public-api/v1/payment-status', { items: [item] });
                        returnData.push({ json: response });
                    }
                }
                else if (resource === 'product') {
                    if (operation === 'list') {
                        const products = await GenericFunctions_1.linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/products');
                        for (const product of products) {
                            returnData.push({ json: product });
                        }
                    }
                    else if (operation === 'create') {
                        const name = this.getNodeParameter('name', i);
                        const sku = this.getNodeParameter('sku', i);
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        const body = {
                            name,
                            sku,
                            ignore_in_wms: (_a = additionalFields.ignore_in_wms) !== null && _a !== void 0 ? _a : false,
                            ignore_when_packing: (_b = additionalFields.ignore_when_packing) !== null && _b !== void 0 ? _b : false,
                            always_ask_for_serial_number: (_c = additionalFields.always_ask_for_serial_number) !== null && _c !== void 0 ? _c : false,
                            has_batch_number: (_d = additionalFields.has_batch_number) !== null && _d !== void 0 ? _d : false,
                            is_expirable: (_e = additionalFields.is_expirable) !== null && _e !== void 0 ? _e : false,
                            is_bio: (_f = additionalFields.is_bio) !== null && _f !== void 0 ? _f : false,
                            is_food: (_g = additionalFields.is_food) !== null && _g !== void 0 ? _g : false,
                            is_insert: (_h = additionalFields.is_insert) !== null && _h !== void 0 ? _h : false,
                            is_fragile: (_j = additionalFields.is_fragile) !== null && _j !== void 0 ? _j : false,
                            storageUnits: [],
                            nameAliases: [],
                            images: [],
                            additionalCodes: [],
                        };
                        const boolFields = [
                            'ignore_in_wms', 'ignore_when_packing', 'always_ask_for_serial_number',
                            'has_batch_number', 'is_expirable', 'is_bio', 'is_food', 'is_insert', 'is_fragile',
                        ];
                        for (const [key, value] of Object.entries(additionalFields)) {
                            if (!boolFields.includes(key)) {
                                body[key] = value;
                            }
                        }
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/products', body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'update') {
                        const productId = this.getNodeParameter('productId', i);
                        const updateFields = this.getNodeParameter('updateFields', i, {});
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/products/${productId}`, updateFields);
                        returnData.push({ json: response });
                    }
                }
                else if (resource === 'stock') {
                    if (operation === 'list') {
                        const stockFilters = this.getNodeParameter('filters', i, {});
                        const qs = {};
                        if (stockFilters.sku)
                            qs.sku = stockFilters.sku;
                        if (stockFilters.depotId)
                            qs.depotId = stockFilters.depotId;
                        const stocks = await GenericFunctions_1.linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/stocks', {}, qs);
                        for (const stock of stocks) {
                            returnData.push({ json: stock });
                        }
                    }
                    else if (operation === 'update') {
                        const stockItemsRaw = this.getNodeParameter('items', i);
                        const additionalOptions = this.getNodeParameter('additionalOptions', i, {});
                        let parsedStockItems;
                        try {
                            parsedStockItems = JSON.parse(stockItemsRaw);
                        }
                        catch {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, {
                                message: 'Invalid JSON in Items field. Expected array of objects with sku and totalQuantity.',
                            });
                        }
                        const body = { items: parsedStockItems, ...additionalOptions };
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', '/public-api/v1/products-stocks', body);
                        returnData.push({ json: response });
                    }
                }
                else if (resource === 'shipment') {
                    if (operation === 'create') {
                        const orderNumber = this.getNodeParameter('orderNumber', i);
                        const packagesRaw = this.getNodeParameter('packages', i);
                        const markAsPacked = this.getNodeParameter('markAsPacked', i);
                        const createAdditional = this.getNodeParameter('createAdditional', i);
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        let packages;
                        try {
                            packages = JSON.parse(packagesRaw);
                        }
                        catch {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, {
                                message: 'Invalid JSON in Packages field. Expected array of package objects.',
                            });
                        }
                        const batchNumbers = additionalFields.batchNumbers
                            ? JSON.parse(additionalFields.batchNumbers)
                            : [];
                        delete additionalFields.batchNumbers;
                        const body = {
                            orderNumber,
                            packages,
                            markAsPacked,
                            createAdditional,
                            batchNumbers,
                            ...additionalFields,
                        };
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/deliveries', body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'createByOrderNumber') {
                        const orderNumber = this.getNodeParameter('orderNumber', i);
                        const packagesRaw = this.getNodeParameter('packages', i);
                        let packages;
                        try {
                            packages = JSON.parse(packagesRaw);
                        }
                        catch {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, {
                                message: 'Invalid JSON in Packages field.',
                            });
                        }
                        const body = { orderNumber, packages };
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/deliveries/packages', body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'getLabel') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const packageId = this.getNodeParameter('packageId', i);
                        const parcelId = this.getNodeParameter('parcelId', i);
                        const format = this.getNodeParameter('labelFormat', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/${orderId}/${packageId}/${format}/${parcelId}`);
                        let binaryBuffer;
                        const mimeType = format === 'pdf' ? 'application/pdf' : 'image/png';
                        const fileName = `label-${orderId}-${parcelId}.${format}`;
                        if (typeof response === 'object' && response.label) {
                            binaryBuffer = Buffer.from(response.label, 'base64');
                        }
                        else if (typeof response === 'string') {
                            binaryBuffer = Buffer.from(response, 'base64');
                        }
                        else {
                            binaryBuffer = Buffer.from(response);
                        }
                        const binaryData = await this.helpers.prepareBinaryData(binaryBuffer, fileName, mimeType);
                        returnData.push({
                            json: { orderId, packageId, parcelId, format },
                            binary: { data: binaryData },
                        });
                    }
                    else if (operation === 'getStatus') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/deliveries/${orderId}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'cancel') {
                        const orderId = this.getNodeParameter('orderId', i);
                        const packageIdsRaw = this.getNodeParameter('packageIdsToCancel', i);
                        const ids = packageIdsRaw.split(',').map(id => id.trim());
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PATCH', `/public-api/v1/deliveries/${orderId}`, { ids });
                        returnData.push({ json: response });
                    }
                }
                else if (resource === 'inboundOrder') {
                    if (operation === 'list') {
                        const orders = await GenericFunctions_1.linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/supplierorders');
                        for (const order of orders) {
                            returnData.push({ json: order });
                        }
                    }
                    else if (operation === 'get') {
                        const id = this.getNodeParameter('inboundOrderId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/supplierorders/${id}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'create') {
                        const orderDate = this.getNodeParameter('orderDate', i);
                        const executionDate = this.getNodeParameter('executionDate', i);
                        const priceGross = this.getNodeParameter('priceGross', i);
                        const priceNet = this.getNodeParameter('priceNet', i);
                        const supplier = this.getNodeParameter('supplier', i);
                        const supplierObjectRaw = this.getNodeParameter('supplierObject', i);
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        let supplierObject;
                        try {
                            supplierObject = JSON.parse(supplierObjectRaw);
                        }
                        catch {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, { message: 'Invalid JSON in Supplier Object field.' });
                        }
                        const itemsMode = this.getNodeParameter('itemsMode', i, 'ui');
                        let items;
                        if (itemsMode === 'ui') {
                            const itemsUi = this.getNodeParameter('itemsUi', i, {});
                            items = itemsUi.itemValues || [];
                        }
                        else {
                            const itemsRaw = this.getNodeParameter('items', i);
                            try {
                                items = JSON.parse(itemsRaw);
                            }
                            catch {
                                throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, { message: 'Invalid JSON in Items field.' });
                            }
                        }
                        const customProperties = additionalFields.customProperties
                            ? JSON.parse(additionalFields.customProperties)
                            : [];
                        delete additionalFields.customProperties;
                        const body = {
                            orderDate, executionDate, priceGross, priceNet, supplier, supplierObject, items,
                            customProperties, ...additionalFields,
                        };
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/supplierorders', body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'update') {
                        const id = this.getNodeParameter('inboundOrderId', i);
                        const updateFields = this.getNodeParameter('updateFields', i, {});
                        if (updateFields.supplierObject)
                            updateFields.supplierObject = JSON.parse(updateFields.supplierObject);
                        if (updateFields.items)
                            updateFields.items = JSON.parse(updateFields.items);
                        if (updateFields.customProperties)
                            updateFields.customProperties = JSON.parse(updateFields.customProperties);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'PUT', `/public-api/v1/supplierorders/${id}`, updateFields);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'confirm') {
                        const orderDate = this.getNodeParameter('orderDate', i);
                        const executionDate = this.getNodeParameter('executionDate', i);
                        const priceGross = this.getNodeParameter('priceGross', i);
                        const priceNet = this.getNodeParameter('priceNet', i);
                        const supplier = this.getNodeParameter('supplier', i);
                        const supplierObjectRaw = this.getNodeParameter('supplierObject', i);
                        const additionalFields = this.getNodeParameter('confirmAdditionalFields', i, {});
                        let supplierObject;
                        try {
                            supplierObject = JSON.parse(supplierObjectRaw);
                        }
                        catch {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, { message: 'Invalid JSON in Supplier Object field.' });
                        }
                        const confirmItemsMode = this.getNodeParameter('confirmItemsMode', i, 'ui');
                        let items;
                        if (confirmItemsMode === 'ui') {
                            const itemsUi = this.getNodeParameter('confirmItemsUi', i, {});
                            items = itemsUi.itemValues || [];
                        }
                        else {
                            const itemsRaw = this.getNodeParameter('items', i);
                            try {
                                items = JSON.parse(itemsRaw);
                            }
                            catch {
                                throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, { message: 'Invalid JSON in Items field.' });
                            }
                        }
                        const customProperties = additionalFields.customProperties
                            ? JSON.parse(additionalFields.customProperties)
                            : [];
                        delete additionalFields.customProperties;
                        const body = {
                            orderDate, executionDate, priceGross, priceNet, supplier, supplierObject, items,
                            customProperties, ...additionalFields,
                        };
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/supplierorders/confirms', body);
                        returnData.push({ json: response });
                    }
                }
                else if (resource === 'orderReturn') {
                    if (operation === 'list') {
                        const returns = await GenericFunctions_1.linkerCloudApiRequestAllItems.call(this, 'GET', '/public-api/v1/orderreturns');
                        for (const ret of returns) {
                            returnData.push({ json: ret });
                        }
                    }
                    else if (operation === 'get') {
                        const id = this.getNodeParameter('orderReturnId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'GET', `/public-api/v1/orderreturns/${id}`);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'create') {
                        const orderNumber = this.getNodeParameter('orderNumber', i);
                        const itemsRaw = this.getNodeParameter('items', i);
                        const reason = this.getNodeParameter('reason', i, '');
                        const additionalFields = this.getNodeParameter('additionalFields', i, {});
                        let items;
                        try {
                            items = JSON.parse(itemsRaw);
                        }
                        catch {
                            throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, { message: 'Invalid JSON in Items field.' });
                        }
                        const body = { orderNumber, items, ...additionalFields };
                        if (reason)
                            body.reason = reason;
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', '/public-api/v1/orderreturns', body);
                        returnData.push({ json: response });
                    }
                    else if (operation === 'accept') {
                        const id = this.getNodeParameter('orderReturnId', i);
                        const response = await GenericFunctions_1.linkerCloudApiRequest.call(this, 'POST', `/public-api/v1/orderreturns/${id}/accept`);
                        returnData.push({ json: response });
                    }
                }
                else {
                    throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, {
                        message: `Unsupported resource/operation: ${resource}/${operation}`,
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message } });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.LinkerCloud = LinkerCloud;
//# sourceMappingURL=LinkerCloud.node.js.map