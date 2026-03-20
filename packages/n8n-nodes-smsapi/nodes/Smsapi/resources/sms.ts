import type { INodeProperties } from 'n8n-workflow';

const showOnlyForSms = {
	resource: ['sms'],
};

const showOnlyForSmsSend = {
	resource: ['sms'],
	operation: ['send'],
};

const showOnlyForSmsSendGroup = {
	resource: ['sms'],
	operation: ['sendGroup'],
};

const showOnlyForSmsGetReport = {
	resource: ['sms'],
	operation: ['getReport'],
};

const additionalFieldsOptions: INodeProperties[] = [
	{
		displayName: 'Sender Name',
		name: 'from',
		type: 'string',
		default: '',
		description: 'Sender name (max 11 characters, must be registered in SMSAPI)',
		routing: {
			send: {
				type: 'body',
				property: 'from',
			},
		},
	},
	{
		displayName: 'Encoding',
		name: 'encoding',
		type: 'options',
		options: [
			{ name: 'Default', value: 'default' },
			{ name: 'UTF-8', value: 'utf-8' },
		],
		default: 'default',
		description: 'Message encoding',
		routing: {
			send: {
				type: 'body',
				property: 'encoding',
			},
		},
	},
	{
		displayName: 'Scheduled Date',
		name: 'date',
		type: 'dateTime',
		default: '',
		description: 'Schedule the message for a future date',
		routing: {
			send: {
				type: 'body',
				property: 'date',
			},
		},
	},
	{
		displayName: 'Test Mode',
		name: 'test',
		type: 'boolean',
		default: false,
		description: 'Whether to use test mode - does not send the message and does not charge the account',
		routing: {
			send: {
				type: 'body',
				property: 'test',
			},
		},
	},
];

export const smsDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForSms,
		},
		options: [
			{
				name: 'Send',
				value: 'send',
				action: 'Send an SMS',
				description: 'Send an SMS to a phone number',
				routing: {
					request: {
						method: 'POST',
						url: '/sms.do',
					},
				},
			},
			{
				name: 'Send Group',
				value: 'sendGroup',
				action: 'Send an SMS to a group',
				description: 'Send an SMS to a contact group',
				routing: {
					request: {
						method: 'POST',
						url: '/sms.do',
					},
				},
			},
			{
				name: 'Get Report',
				value: 'getReport',
				action: 'Get an SMS report',
				description: 'Get the status report of a sent SMS',
				routing: {
					request: {
						method: 'GET',
						url: '/sms.do',
					},
				},
			},
		],
		default: 'send',
	},

	// ------ Send fields ------
	{
		displayName: 'Phone Number',
		name: 'to',
		type: 'string',
		required: true,
		default: '',
		placeholder: '48XXXXXXXXX',
		description: 'Phone number in format 48XXXXXXXXX',
		displayOptions: {
			show: showOnlyForSmsSend,
		},
		routing: {
			send: {
				type: 'body',
				property: 'to',
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		description: 'SMS text content (max 160 chars for single SMS)',
		displayOptions: {
			show: showOnlyForSmsSend,
		},
		routing: {
			send: {
				type: 'body',
				property: 'message',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForSmsSend,
		},
		options: additionalFieldsOptions,
	},

	// ------ Send Group fields ------
	{
		displayName: 'Group Name',
		name: 'group',
		type: 'string',
		required: true,
		default: '',
		description: 'Contact group name',
		displayOptions: {
			show: showOnlyForSmsSendGroup,
		},
		routing: {
			send: {
				type: 'body',
				property: 'group',
			},
		},
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		typeOptions: { rows: 3 },
		required: true,
		default: '',
		description: 'SMS text content (max 160 chars for single SMS)',
		displayOptions: {
			show: showOnlyForSmsSendGroup,
		},
		routing: {
			send: {
				type: 'body',
				property: 'message',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForSmsSendGroup,
		},
		options: additionalFieldsOptions,
	},

	// ------ Get Report fields ------
	{
		displayName: 'Message ID',
		name: 'messageId',
		type: 'string',
		required: true,
		default: '',
		description: 'ID of the sent SMS message',
		displayOptions: {
			show: showOnlyForSmsGetReport,
		},
		routing: {
			send: {
				type: 'query',
				property: 'id',
			},
		},
	},
];
