"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsapiApi = void 0;
class SmsapiApi {
    constructor() {
        this.name = 'smsapiApi';
        this.displayName = 'SMSAPI API';
        this.icon = 'file:../icons/smsapi.svg';
        this.documentationUrl = 'https://www.smsapi.pl/docs';
        this.properties = [
            {
                displayName: 'API Token',
                name: 'apiToken',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'API token from SMSAPI.pl panel - API Settings',
            },
        ];
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials?.apiToken}}',
                },
            },
        };
        this.test = {
            request: {
                baseURL: 'https://api.smsapi.pl',
                url: '/profile',
                method: 'GET',
                qs: { format: 'json' },
            },
        };
    }
}
exports.SmsapiApi = SmsapiApi;
//# sourceMappingURL=SmsapiApi.credentials.js.map