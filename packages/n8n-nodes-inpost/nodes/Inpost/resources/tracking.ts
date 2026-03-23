import type { INodeProperties } from 'n8n-workflow';

export const trackingOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['tracking'],
		},
	},
	options: [
		{
			name: 'Get',
			value: 'get',
			action: 'Get tracking status',
			description: 'Get tracking status for a shipment',
		},
	],
	default: 'get',
};

export const trackingFields: INodeProperties[] = [
	// ------ Tracking Number (get) ------
	{
		displayName: 'Tracking Number',
		name: 'trackingNumber',
		type: 'string',
		required: true,
		default: '',
		description: 'Shipment tracking number',
		displayOptions: {
			show: {
				resource: ['tracking'],
				operation: ['get'],
			},
		},
	},
];
