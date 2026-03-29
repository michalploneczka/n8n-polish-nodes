"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gusRegonApiRequest = gusRegonApiRequest;
const n8n_workflow_1 = require("n8n-workflow");
const SoapTemplates_1 = require("./SoapTemplates");
const XmlParser_1 = require("./XmlParser");
async function gusRegonApiRequest(soapBody) {
    const credentials = await this.getCredentials('gusRegonApi');
    const environment = credentials.environment;
    const baseUrl = environment === 'production' ? SoapTemplates_1.URLS.production : SoapTemplates_1.URLS.test;
    const apiKey = credentials.apiKey;
    const loginEnvelope = (0, SoapTemplates_1.zalogujEnvelope)(baseUrl, apiKey);
    let loginResponse;
    try {
        loginResponse = (await this.helpers.httpRequest({
            method: 'POST',
            url: baseUrl,
            headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
            body: loginEnvelope,
            json: false,
        }));
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: 'GUS REGON login failed. Check your API key.',
        });
    }
    const sid = (0, XmlParser_1.unsoapResult)(loginResponse);
    if (!sid) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), {}, {
            message: 'GUS REGON login returned empty session ID. Check API key and environment.',
        });
    }
    try {
        const response = (await this.helpers.httpRequest({
            method: 'POST',
            url: baseUrl,
            headers: {
                'Content-Type': 'application/soap+xml; charset=utf-8',
                sid,
            },
            body: soapBody,
            json: false,
        }));
        return response;
    }
    catch (error) {
        throw new n8n_workflow_1.NodeApiError(this.getNode(), error, {
            message: `GUS REGON API error: ${error.message}`,
        });
    }
    finally {
        try {
            const logoutEnvelope = (0, SoapTemplates_1.wylogujEnvelope)(baseUrl, sid);
            await this.helpers.httpRequest({
                method: 'POST',
                url: baseUrl,
                headers: {
                    'Content-Type': 'application/soap+xml; charset=utf-8',
                },
                body: logoutEnvelope,
                json: false,
            });
        }
        catch {
        }
    }
}
//# sourceMappingURL=GenericFunctions.js.map