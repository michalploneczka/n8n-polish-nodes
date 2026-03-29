"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GusRegonApi = void 0;
class GusRegonApi {
    constructor() {
        this.name = 'gusRegonApi';
        this.displayName = 'GUS REGON API';
        this.icon = 'file:gus-regon.svg';
        this.documentationUrl = 'https://api.stat.gov.pl/Home/RegonApi';
        this.properties = [
            {
                displayName: 'API Key',
                name: 'apiKey',
                type: 'string',
                typeOptions: { password: true },
                default: '',
                required: true,
                description: 'User key obtained by emailing regon_bir@stat.gov.pl (free). Test key: abcde12345abcde12345',
            },
            {
                displayName: 'Environment',
                name: 'environment',
                type: 'options',
                default: 'test',
                options: [
                    {
                        name: 'Test',
                        value: 'test',
                        description: 'Test environment (wyszukiwarkaregontest.stat.gov.pl)',
                    },
                    {
                        name: 'Production',
                        value: 'production',
                        description: 'Production environment (wyszukiwarkaregon.stat.gov.pl)',
                    },
                ],
                description: 'Select API environment. Test environment uses public test key.',
            },
        ];
    }
}
exports.GusRegonApi = GusRegonApi;
//# sourceMappingURL=GusRegonApi.credentials.js.map