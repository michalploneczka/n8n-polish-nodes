import type { INodeProperties } from 'n8n-workflow';

export const productOperations: INodeProperties = {
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	noDataExpression: true,
	displayOptions: {
		show: {
			resource: ['product'],
		},
	},
	options: [
		{
			name: 'Get All Offers',
			value: 'getAllOffers',
			action: 'Get all offers for products',
			description: 'Get all offers for given product IDs (max 300)',
		},
		{
			name: 'Get Top 10 Cheapest Offers',
			value: 'getTop10CheapestOffers',
			action: 'Get top 10 cheapest offers',
			description: 'Get top 10 cheapest offers for given product IDs (max 300)',
		},
		{
			name: 'Get Top Category Products',
			value: 'getTopCategoryProducts',
			action: 'Get top category products',
			description: 'Get top products in a Ceneo category by name',
		},
	],
	default: 'getTopCategoryProducts',
};

export const productFields: INodeProperties[] = [
	// ------ Category Name (getTopCategoryProducts) ------
	{
		displayName: 'Category Name',
		name: 'categoryName',
		type: 'string',
		required: true,
		default: '',
		description: 'Ceneo category name to search in',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['getTopCategoryProducts'],
			},
		},
	},

	// ------ Top (getTopCategoryProducts) ------
	{
		displayName: 'Top',
		name: 'top',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 100,
		description: 'Maximum number of products to return (1-100)',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['getTopCategoryProducts'],
			},
		},
	},

	// ------ Shop Product IDs (getAllOffers, getTop10CheapestOffers) ------
	{
		displayName: 'Shop Product IDs',
		name: 'shopProductIds',
		type: 'string',
		required: true,
		default: '',
		description: 'Comma-separated shop product IDs (max 300). Example: 123,456,789.',
		displayOptions: {
			show: {
				resource: ['product'],
				operation: ['getAllOffers', 'getTop10CheapestOffers'],
			},
		},
	},
];