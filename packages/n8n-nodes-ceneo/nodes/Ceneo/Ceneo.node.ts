import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { ceneoApiRequestV3, ceneoApiRequestV2, resetTokenCache } from './GenericFunctions';
import { productOperations, productFields } from './resources/product';
import { categoryOperations, categoryFields } from './resources/category';
import { accountOperations, accountFields } from './resources/account';

export class Ceneo implements INodeType {
	static ceneoApiRequestV3 = ceneoApiRequestV3;
	static ceneoApiRequestV2 = ceneoApiRequestV2;

	description: INodeTypeDescription = {
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
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
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
			productOperations,
			...productFields,
			categoryOperations,
			...categoryFields,
			accountOperations,
			...accountFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		resetTokenCache();

		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				let responseData: IDataObject | IDataObject[];

				if (resource === 'product') {
					if (operation === 'getTopCategoryProducts') {
						const categoryName = this.getNodeParameter('categoryName', i) as string;
						const top = this.getNodeParameter('top', i) as number;
						responseData = await ceneoApiRequestV3.call(this, '/api/v3/GetTopCategoryProducts', { categoryName, top });
					} else if (operation === 'getAllOffers') {
						const shopProductIds = this.getNodeParameter('shopProductIds', i) as string;
						responseData = await ceneoApiRequestV2.call(this, 'webapi_data_critical.shop_getProductOffersBy_IDs', { shop_product_ids_comma_separated: shopProductIds });
					} else if (operation === 'getTop10CheapestOffers') {
						const shopProductIds = this.getNodeParameter('shopProductIds', i) as string;
						responseData = await ceneoApiRequestV2.call(this, 'webapi_data_critical.shop_getProductTop10OffersBy_IDs', { shop_product_ids_comma_separated: shopProductIds });
					} else {
						responseData = {};
					}
				} else if (resource === 'category') {
					if (operation === 'list') {
						responseData = await ceneoApiRequestV3.call(this, '/api/v3/GetCategories');
					} else {
						responseData = {};
					}
				} else if (resource === 'account') {
					if (operation === 'getLimits') {
						responseData = await ceneoApiRequestV2.call(this, 'webapi_meta.GetExecutionLimits');
					} else {
						responseData = {};
					}
				} else {
					responseData = {};
				}

				if (Array.isArray(responseData)) {
					for (const item of responseData) {
						returnData.push({ json: item });
					}
				} else {
					returnData.push({ json: responseData as IDataObject });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
