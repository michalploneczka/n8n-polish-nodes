"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inpostApiRequest = inpostApiRequest;
exports.inpostApiRequestAllItems = inpostApiRequestAllItems;
const n8n_workflow_1 = require("n8n-workflow");
const BASE_URLS = {
    sandbox: 'https://sandbox-api-shipx-pl.easypack24.net',
    production: 'https://api-shipx-pl.easypack24.net',
};
async function inpostApiRequest(method, endpoint, body = {}, qs = {}, options = {}) {
    const credentials = await this.getCredentials('inpostApi');
    const environment = credentials.environment;
    const apiToken = credentials.apiToken;
    const baseUrl = BASE_URLS[environment] || BASE_URLS.sandbox;
    const requestOptions = {
        method,
        url: `${baseUrl}${endpoint}`,
        headers: {
            Authorization: `Bearer ${apiToken}`,
        },
        qs,
        json: true,
        ...options,
    };
    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
        requestOptions.body = body;
    }
    try {
        return await this.helpers.httpRequest(requestOptions);
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: `InPost API error: ${error.message}`,
        });
    }
}
async function inpostApiRequestAllItems(method, endpoint, body = {}, qs = {}) {
    const returnAll = this.getNodeParameter('returnAll', 0);
    const limit = returnAll ? 0 : this.getNodeParameter('limit', 0);
    const perPage = 25;
    let page = 1;
    const allItems = [];
    while (true) {
        const response = (await inpostApiRequest.call(this, method, endpoint, body, {
            ...qs,
            page,
            per_page: perPage,
        }));
        const items = (response.items || []);
        allItems.push(...items);
        if (!returnAll && allItems.length >= limit) {
            return allItems.slice(0, limit);
        }
        const totalPages = response.total_pages || 1;
        if (page >= totalPages || items.length < perPage) {
            break;
        }
        page++;
    }
    return allItems;
}
//# sourceMappingURL=GenericFunctions.js.map