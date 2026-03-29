"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Smsapi = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const sms_1 = require("./resources/sms");
const contacts_1 = require("./resources/contacts");
const groups_1 = require("./resources/groups");
const account_1 = require("./resources/account");
class Smsapi {
    constructor() {
        this.description = {
            displayName: 'SMSAPI',
            name: 'smsapi',
            icon: 'file:../../icons/smsapi.svg',
            group: ['output'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Send SMS messages and manage contacts via SMSAPI.pl',
            defaults: {
                name: 'SMSAPI',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
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
                ...sms_1.smsDescription,
                ...contacts_1.contactsDescription,
                ...groups_1.groupsDescription,
                ...account_1.accountDescription,
            ],
        };
    }
}
exports.Smsapi = Smsapi;
//# sourceMappingURL=Smsapi.node.js.map