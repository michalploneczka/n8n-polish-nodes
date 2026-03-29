"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CeidgApi = void 0;
class CeidgApi {
    constructor() {
        this.name = 'ceidgApi';
        this.displayName = 'CEIDG API';
        this.icon = 'file:../icons/ceidg.svg';
        this.documentationUrl = 'https://dane.biznes.gov.pl/api';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'API key from dane.biznes.gov.pl (free registration)',
            },
        ];
        this.test = {
            request: {
                baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v3',
                url: '/firma?nip=6351723862',
                method: 'GET',
            },
        };
        this.authenticate = {
            type: 'generic',
            properties: {
                headers: {
                    Authorization: '=Bearer {{$credentials.apiKey}}',
                },
            },
        };
    }
}
exports.CeidgApi = CeidgApi;
//# sourceMappingURL=CeidgApi.credentials.js.map