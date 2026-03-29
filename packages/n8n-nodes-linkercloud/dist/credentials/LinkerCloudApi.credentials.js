"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkerCloudApi = void 0;
class LinkerCloudApi {
    constructor() {
        this.name = 'linkerCloudApi';
        this.displayName = 'Linker Cloud API';
        this.icon = 'file:linkercloud.svg';
        this.documentationUrl = 'https://linkercloud.com';
        this.properties = [
            {
                displayName: 'Domain',
                name: 'domain',
                type: 'string',
                default: '',
                required: true,
                placeholder: 'your-company.linker.shop',
                description: 'Your Linker Cloud domain (e.g., your-company.linker.shop or api-demo.linker.shop for testing)',
            },
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'API key received from your Linker Cloud operator or customer service',
            },
        ];
        this.test = {
            request: {
                method: 'GET',
                url: '={{`https://${$credentials.domain}/public-api/v1/orders`}}',
                qs: {
                    apikey: '={{$credentials.apiKey}}',
                    limit: '1',
                },
            },
        };
    }
}
exports.LinkerCloudApi = LinkerCloudApi;
//# sourceMappingURL=LinkerCloudApi.credentials.js.map