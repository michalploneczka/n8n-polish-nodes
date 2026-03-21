import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError } from 'n8n-workflow';

import { linkerCloudApiRequest, linkerCloudApiRequestAllItems } from './GenericFunctions';

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
			// Resource operations and fields will be added by subsequent plans
		],
	};

	// Expose helpers for use in resource handlers (added by subsequent plans)
	static apiRequest = linkerCloudApiRequest;
	static apiRequestAllItems = linkerCloudApiRequestAllItems;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				// Resource handlers will be added by subsequent plans

				throw new NodeApiError(this.getNode(), {}, {
					message: `Unsupported resource/operation: ${resource}/${operation}`,
				});
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
