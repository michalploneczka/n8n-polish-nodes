"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkerCloudApiRequest = linkerCloudApiRequest;
exports.linkerCloudApiRequestAllItems = linkerCloudApiRequestAllItems;
const n8n_workflow_1 = require("n8n-workflow");
async function linkerCloudApiRequest(method, endpoint, body = {}, qs = {}) {
    const credentials = await this.getCredentials('linkerCloudApi');
    const domain = credentials.domain
        .replace(/^https?:\/\//, '')
        .replace(/\/$/, '');
    const url = `https://${domain}${endpoint}`;
    qs.apikey = credentials.apiKey;
    const requestOptions = {
        method,
        url,
        qs,
        json: true,
    };
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        requestOptions.body = body;
    }
    try {
        return await this.helpers.httpRequest(requestOptions);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: `Linker Cloud API error: ${error.message}`,
        });
    }
}
async function linkerCloudApiRequestAllItems(method, endpoint, body = {}, qs = {}) {
    const returnAll = this.getNodeParameter('returnAll', 0);
    const limit = returnAll ? 0 : this.getNodeParameter('limit', 0);
    const pageSize = 100;
    let offset = 0;
    const allItems = [];
    while (true) {
        const response = await linkerCloudApiRequest.call(this, method, endpoint, body, {
            ...qs,
            offset: offset.toString(),
            limit: pageSize.toString(),
        });
        const items = Array.isArray(response)
            ? response
            : response.items
                ? response.items
                : [response];
        allItems.push(...items);
        if (!returnAll && allItems.length >= limit) {
            return allItems.slice(0, limit);
        }
        if (items.length < pageSize) {
            break;
        }
        offset += pageSize;
    }
    return allItems;
}
//# sourceMappingURL=GenericFunctions.js.map