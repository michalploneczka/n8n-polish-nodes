"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GusRegon = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
const SoapTemplates_1 = require("./SoapTemplates");
const XmlParser_1 = require("./XmlParser");
const company_1 = require("./resources/company");
class GusRegon {
    constructor() {
        this.description = {
            displayName: 'GUS REGON',
            name: 'gusRegon',
            icon: 'file:../../icons/gus-regon.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Search Polish government business registry (GUS REGON/BIR) by NIP, REGON, or KRS',
            defaults: {
                name: 'GUS REGON',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                company_1.companyOperations,
                ...company_1.companyFields,
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        const credentials = await this.getCredentials('gusRegonApi');
        const environment = credentials.environment;
        const url = environment === 'production' ? SoapTemplates_1.URLS.production : SoapTemplates_1.URLS.test;
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                if (resource === 'company') {
                    if (operation === 'searchByNip') {
                        const nip = this.getNodeParameter('nip', i);
                        const envelope = (0, SoapTemplates_1.daneSzukajPodmiotyEnvelope)(url, { nip });
                        const response = await GenericFunctions_1.gusRegonApiRequest.call(this, envelope);
                        const results = (0, XmlParser_1.parseSearchResponse)(response);
                        for (const result of results) {
                            returnData.push({ json: result });
                        }
                    }
                    else if (operation === 'searchByRegon') {
                        const regon = this.getNodeParameter('regon', i);
                        const envelope = (0, SoapTemplates_1.daneSzukajPodmiotyEnvelope)(url, { regon });
                        const response = await GenericFunctions_1.gusRegonApiRequest.call(this, envelope);
                        const results = (0, XmlParser_1.parseSearchResponse)(response);
                        for (const result of results) {
                            returnData.push({ json: result });
                        }
                    }
                    else if (operation === 'searchByKrs') {
                        const krs = this.getNodeParameter('krs', i);
                        const envelope = (0, SoapTemplates_1.daneSzukajPodmiotyEnvelope)(url, { krs });
                        const response = await GenericFunctions_1.gusRegonApiRequest.call(this, envelope);
                        const results = (0, XmlParser_1.parseSearchResponse)(response);
                        for (const result of results) {
                            returnData.push({ json: result });
                        }
                    }
                    else if (operation === 'getFullData') {
                        const regonForReport = this.getNodeParameter('regonForReport', i);
                        const includePkd = this.getNodeParameter('includePkd', i);
                        const searchEnvelope = (0, SoapTemplates_1.daneSzukajPodmiotyEnvelope)(url, {
                            regon: regonForReport,
                        });
                        const searchResponse = await GenericFunctions_1.gusRegonApiRequest.call(this, searchEnvelope);
                        const searchResults = (0, XmlParser_1.parseSearchResponse)(searchResponse);
                        if (searchResults.length === 0) {
                            returnData.push({
                                json: { error: `No entity found for REGON: ${regonForReport}` },
                            });
                            continue;
                        }
                        const entityType = searchResults[0].Typ;
                        const mainReportType = entityType === 'P'
                            ? SoapTemplates_1.REPORT_TYPES.legalEntity
                            : entityType === 'F'
                                ? SoapTemplates_1.REPORT_TYPES.naturalPerson
                                : SoapTemplates_1.REPORT_TYPES.legalEntity;
                        const reportEnvelope = (0, SoapTemplates_1.danePobierzPelnyRaportEnvelope)(url, regonForReport, mainReportType);
                        const reportResponse = await GenericFunctions_1.gusRegonApiRequest.call(this, reportEnvelope);
                        const mainReport = (0, XmlParser_1.parseReportResponse)(reportResponse);
                        let mergedResult = mainReport;
                        if (includePkd) {
                            const pkdReportType = entityType === 'P'
                                ? SoapTemplates_1.REPORT_TYPES.legalEntityPkd
                                : entityType === 'F'
                                    ? SoapTemplates_1.REPORT_TYPES.naturalPersonPkd
                                    : SoapTemplates_1.REPORT_TYPES.legalEntityPkd;
                            const pkdEnvelope = (0, SoapTemplates_1.danePobierzPelnyRaportEnvelope)(url, regonForReport, pkdReportType);
                            const pkdResponse = await GenericFunctions_1.gusRegonApiRequest.call(this, pkdEnvelope);
                            const pkdResults = (0, XmlParser_1.parseSearchResponse)(pkdResponse);
                            mergedResult = {
                                ...mainReport,
                                pkdCodes: pkdResults,
                            };
                        }
                        returnData.push({ json: mergedResult });
                    }
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
exports.GusRegon = GusRegon;
//# sourceMappingURL=GusRegon.node.js.map