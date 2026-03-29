"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeneoApi = void 0;
class CeneoApi {
    constructor() {
        this.name = 'ceneoApi';
        this.displayName = 'Ceneo API';
        this.icon = 'file:../icons/ceneo.svg';
        this.documentationUrl = 'https://developers.ceneo.pl';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'API key from Ceneo Partner Panel. Used for v2 endpoints directly and to obtain Bearer token for v3 endpoints.',
            },
        ];
        this.test = {
            request: {
                baseURL: 'https://developers.ceneo.pl',
                url: '/AuthorizationService.svc/GetToken',
                method: 'GET',
                headers: {
                    Authorization: '=Basic {{$credentials?.apiKey}}',
                },
            },
        };
    }
}
exports.CeneoApi = CeneoApi;
//# sourceMappingURL=CeneoApi.credentials.js.map