"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTokenCache = resetTokenCache;
exports.ceneoApiRequestV3 = ceneoApiRequestV3;
exports.ceneoApiRequestV2 = ceneoApiRequestV2;
const n8n_workflow_1 = require("n8n-workflow");
const BASE_URL = 'https://developers.ceneo.pl';
let cachedToken;
function resetTokenCache() {
    cachedToken = undefined;
}
async function getToken() {
    var _a;
    if (cachedToken)
        return cachedToken;
    const credentials = await this.getCredentials('ceneoApi');
    const apiKey = credentials.apiKey;
    const requestOptions = {
        method: 'GET',
        url: `${BASE_URL}/AuthorizationService.svc/GetToken`,
        headers: { Authorization: `Basic ${apiKey}` },
        json: true,
    };
    try {
        const response = await this.helpers.httpRequest(requestOptions);
        cachedToken =
            typeof response === 'string'
                ? response
                : (_a = response.token) !== null && _a !== void 0 ? _a : String(response);
        return cachedToken;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: `Ceneo API token error: ${error.message}`,
        });
    }
}
async function ceneoApiRequestV3(endpoint, qs = {}) {
    const token = await getToken.call(this);
    const requestOptions = {
        method: 'GET',
        url: `${BASE_URL}${endpoint}`,
        headers: { Authorization: `Bearer ${token}` },
        qs,
        json: true,
    };
    try {
        return (await this.helpers.httpRequest(requestOptions));
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: `Ceneo API error: ${error.message}`,
        });
    }
}
async function ceneoApiRequestV2(functionName, params = {}) {
    const credentials = await this.getCredentials('ceneoApi');
    const endpoint = `/api/v2/function/${functionName}/Call`;
    const requestOptions = {
        method: 'POST',
        url: `${BASE_URL}${endpoint}`,
        qs: {
            apiKey: credentials.apiKey,
            resultFormatter: 'json',
            ...params,
        },
        json: true,
    };
    try {
        return (await this.helpers.httpRequest(requestOptions));
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: `Ceneo API error: ${error.message}`,
        });
    }
}
//# sourceMappingURL=GenericFunctions.js.map