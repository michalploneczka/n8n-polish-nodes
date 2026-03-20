import type { INodeProperties } from 'n8n-workflow';

const showOnlyForGroup = {
	resource: ['group'],
};

export const groupsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForGroup,
		},
		options: [
			{
				name: 'List',
				value: 'list',
				action: 'List groups',
				description: 'Get a list of contact groups',
				routing: {
					request: {
						method: 'GET',
						url: '/contacts/groups',
					},
				},
			},
		],
		default: 'list',
	},
];
