"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ceneo = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const GenericFunctions_1 = require("./GenericFunctions");
const product_1 = require("./resources/product");
const category_1 = require("./resources/category");
const account_1 = require("./resources/account");
class Ceneo {
    constructor() {
        this.description = {
            displayName: 'Ceneo',
            name: 'ceneo',
            icon: 'file:../../icons/ceneo.svg',
            group: ['output'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Monitor market prices on Ceneo - Poland\'s largest price comparison platform',
            defaults: {
                name: 'Ceneo',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            credentials: [
                {
                    name: 'ceneoApi',
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
                        { name: 'Account', value: 'account' },
                        { name: 'Category', value: 'category' },
                        { name: 'Product', value: 'product' },
                    ],
                    default: 'product',
                },
                product_1.productOperations,
                ...product_1.productFields,
                category_1.categoryOperations,
                ...category_1.categoryFields,
                account_1.accountOperations,
                ...account_1.accountFields,
            ],
        };
    }
    async execute() {
        (0, GenericFunctions_1.resetTokenCache)();
        const items = this.getInputData();
        const returnData = [];
        for (let i = 0; i < items.length; i++) {
            try {
                const resource = this.getNodeParameter('resource', i);
                const operation = this.getNodeParameter('operation', i);
                let responseData;
                if (resource === 'product') {
                    if (operation === 'getTopCategoryProducts') {
                        const categoryName = this.getNodeParameter('categoryName', i);
                        const top = this.getNodeParameter('top', i);
                        responseData = await GenericFunctions_1.ceneoApiRequestV3.call(this, '/api/v3/GetTopCategoryProducts', { categoryName, top });
                    }
                    else if (operation === 'getAllOffers') {
                        const shopProductIds = this.getNodeParameter('shopProductIds', i);
                        responseData = await GenericFunctions_1.ceneoApiRequestV2.call(this, 'webapi_data_critical.shop_getProductOffersBy_IDs', { shop_product_ids: shopProductIds });
                    }
                    else if (operation === 'getTop10CheapestOffers') {
                        const shopProductIds = this.getNodeParameter('shopProductIds', i);
                        responseData = await GenericFunctions_1.ceneoApiRequestV2.call(this, 'webapi_data_critical.shop_getProductTop10OffersByIDs', { shop_product_ids: shopProductIds });
                    }
                    else {
                        responseData = {};
                    }
                }
                else if (resource === 'category') {
                    if (operation === 'list') {
                        responseData = await GenericFunctions_1.ceneoApiRequestV3.call(this, '/api/v3/GetCategories');
                    }
                    else {
                        responseData = {};
                    }
                }
                else if (resource === 'account') {
                    if (operation === 'getLimits') {
                        responseData = await GenericFunctions_1.ceneoApiRequestV2.call(this, 'webapi_data_critical.GetExecutionLimits');
                    }
                    else {
                        responseData = {};
                    }
                }
                else {
                    responseData = {};
                }
                if (Array.isArray(responseData)) {
                    for (const item of responseData) {
                        returnData.push({ json: item });
                    }
                }
                else {
                    returnData.push({ json: responseData });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.Ceneo = Ceneo;
Ceneo.ceneoApiRequestV3 = GenericFunctions_1.ceneoApiRequestV3;
Ceneo.ceneoApiRequestV2 = GenericFunctions_1.ceneoApiRequestV2;
//# sourceMappingURL=Ceneo.node.js.map