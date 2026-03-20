import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { smsDescription } from './resources/sms';
import { contactsDescription } from './resources/contacts';
import { groupsDescription } from './resources/groups';
import { accountDescription } from './resources/account';

export class Smsapi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SMSAPI',
		name: 'smsapi',
		icon: { light: 'file:../../icons/smsapi.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Send SMS messages and manage contacts via SMSAPI.pl',
		defaults: {
			name: 'SMSAPI',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'smsapiApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.smsapi.pl',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			qs: {
				format: 'json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'SMS', value: 'sms' },
					{ name: 'Contact', value: 'contact' },
					{ name: 'Group', value: 'group' },
					{ name: 'Account', value: 'account' },
				],
				default: 'sms',
			},
			...smsDescription,
			...contactsDescription,
			...groupsDescription,
			...accountDescription,
		],
	};
}
