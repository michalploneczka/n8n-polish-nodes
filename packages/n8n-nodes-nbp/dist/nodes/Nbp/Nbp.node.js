"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Nbp = void 0;
const n8n_workflow_1 = require("n8n-workflow");
class Nbp {
    constructor() {
        this.description = {
            displayName: 'NBP Exchange Rates',
            name: 'nbp',
            icon: 'file:../../icons/nbp.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Get official exchange rates and gold prices from NBP (National Bank of Poland)',
            defaults: {
                name: 'NBP',
            },
            usableAsTool: true,
            inputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            outputs: [n8n_workflow_1.NodeConnectionTypes.Main],
            requestDefaults: {
                baseURL: 'https://api.nbp.pl/api',
                headers: {
                    Accept: 'application/json',
                },
            },
            properties: [
                {
                    displayName: 'Resource',
                    name: 'resource',
                    type: 'options',
                    noDataExpression: true,
                    options: [
                        {
                            name: 'Exchange Rate',
                            value: 'exchangeRate',
                        },
                        {
                            name: 'Gold Price',
                            value: 'goldPrice',
                        },
                    ],
                    default: 'exchangeRate',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Current Rate',
                            value: 'getCurrentRate',
                            description: 'Get the latest published exchange rate for a currency',
                            action: 'Get the current exchange rate',
                        },
                        {
                            name: 'Get Current Table',
                            value: 'getCurrentTable',
                            description: 'Get the latest published exchange rate table with all currencies',
                            action: 'Get the current exchange rate table',
                        },
                        {
                            name: 'Get Last N Rates',
                            value: 'getLastNRates',
                            description: 'Get the last N published exchange rates for a currency',
                            action: 'Get last n exchange rates',
                        },
                        {
                            name: 'Get Rate by Date',
                            value: 'getRateByDate',
                            description: 'Get the exchange rate for a currency on a specific date',
                            action: 'Get exchange rate by date',
                        },
                        {
                            name: 'Get Rate Date Range',
                            value: 'getRateDateRange',
                            description: 'Get exchange rates for a currency within a date range',
                            action: 'Get exchange rates for a date range',
                        },
                        {
                            name: 'Get Table by Date',
                            value: 'getTableByDate',
                            description: 'Get the exchange rate table for a specific date',
                            action: 'Get exchange rate table by date',
                        },
                    ],
                    default: 'getCurrentRate',
                },
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    noDataExpression: true,
                    displayOptions: {
                        show: {
                            resource: ['goldPrice'],
                        },
                    },
                    options: [
                        {
                            name: 'Get Current Price',
                            value: 'getCurrentPrice',
                            description: 'Get the latest published gold price (PLN per gram)',
                            action: 'Get the current gold price',
                            routing: {
                                request: {
                                    method: 'GET',
                                    url: '/cenyzlota/',
                                },
                            },
                        },
                        {
                            name: 'Get Last N Prices',
                            value: 'getLastNPrices',
                            description: 'Get the last N published gold prices',
                            action: 'Get last n gold prices',
                        },
                        {
                            name: 'Get Price by Date',
                            value: 'getPriceByDate',
                            description: 'Get the gold price for a specific date',
                            action: 'Get gold price by date',
                        },
                        {
                            name: 'Get Price Date Range',
                            value: 'getPriceDateRange',
                            description: 'Get gold prices within a date range',
                            action: 'Get gold prices for a date range',
                        },
                    ],
                    default: 'getCurrentPrice',
                },
                {
                    displayName: 'Table',
                    name: 'table',
                    type: 'options',
                    required: true,
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                        },
                    },
                    options: [
                        {
                            name: 'A - Average Rates (Common Currencies)',
                            value: 'A',
                        },
                        {
                            name: 'B - Average Rates (All Currencies)',
                            value: 'B',
                        },
                        {
                            name: 'C - Buy/Sell Rates',
                            value: 'C',
                        },
                    ],
                    default: 'A',
                    description: 'NBP exchange rate table type. Table A: ~33 common currencies (mid rate). Table B: ~90+ currencies (mid rate). Table C: ~8 major currencies (bid/ask rates).',
                },
                {
                    displayName: 'Currency Code',
                    name: 'currencyCode',
                    type: 'string',
                    required: true,
                    default: 'EUR',
                    placeholder: 'EUR',
                    description: 'ISO 4217 currency code (e.g., EUR, USD, GBP, CHF)',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getCurrentRate'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/exchangerates/rates/{{$parameter["table"]}}/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Currency Code',
                    name: 'currencyCode',
                    type: 'string',
                    required: true,
                    default: 'EUR',
                    placeholder: 'EUR',
                    description: 'ISO 4217 currency code (e.g., EUR, USD, GBP, CHF)',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getRateByDate'],
                        },
                    },
                },
                {
                    displayName: 'Currency Code',
                    name: 'currencyCode',
                    type: 'string',
                    required: true,
                    default: 'EUR',
                    placeholder: 'EUR',
                    description: 'ISO 4217 currency code (e.g., EUR, USD, GBP, CHF)',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getRateDateRange'],
                        },
                    },
                },
                {
                    displayName: 'Currency Code',
                    name: 'currencyCode',
                    type: 'string',
                    required: true,
                    default: 'EUR',
                    placeholder: 'EUR',
                    description: 'ISO 4217 currency code (e.g., EUR, USD, GBP, CHF)',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getLastNRates'],
                        },
                    },
                },
                {
                    displayName: 'Date',
                    name: 'date',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'Date to get the exchange rate for. Format: YYYY-MM-DD. Returns 404 on weekends and holidays.',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getRateByDate'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/exchangerates/rates/{{$parameter["table"]}}/{{$parameter["currencyCode"]}}/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Start Date',
                    name: 'startDate',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'Start date of the range. Format: YYYY-MM-DD.',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getRateDateRange'],
                        },
                    },
                },
                {
                    displayName: 'End Date',
                    name: 'endDate',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'End date of the range. Format: YYYY-MM-DD. Maximum 93-day range.',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getRateDateRange'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/exchangerates/rates/{{$parameter["table"]}}/{{$parameter["currencyCode"]}}/{{$parameter["startDate"]}}/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Count',
                    name: 'count',
                    type: 'number',
                    required: true,
                    default: 10,
                    description: 'Number of last published rates to retrieve',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getLastNRates'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/exchangerates/rates/{{$parameter["table"]}}/{{$parameter["currencyCode"]}}/last/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Table Routing',
                    name: 'tableRouting',
                    type: 'hidden',
                    default: '',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getCurrentTable'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/exchangerates/tables/{{$parameter["table"]}}/',
                        },
                    },
                },
                {
                    displayName: 'Date',
                    name: 'date',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'Date to get the exchange rate table for. Format: YYYY-MM-DD. Returns 404 on weekends and holidays.',
                    displayOptions: {
                        show: {
                            resource: ['exchangeRate'],
                            operation: ['getTableByDate'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/exchangerates/tables/{{$parameter["table"]}}/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Date',
                    name: 'goldDate',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'Date to get the gold price for. Format: YYYY-MM-DD. Returns 404 on weekends and holidays.',
                    displayOptions: {
                        show: {
                            resource: ['goldPrice'],
                            operation: ['getPriceByDate'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/cenyzlota/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Start Date',
                    name: 'goldStartDate',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'Start date of the range. Format: YYYY-MM-DD.',
                    displayOptions: {
                        show: {
                            resource: ['goldPrice'],
                            operation: ['getPriceDateRange'],
                        },
                    },
                },
                {
                    displayName: 'End Date',
                    name: 'goldEndDate',
                    type: 'string',
                    required: true,
                    default: '',
                    placeholder: 'YYYY-MM-DD',
                    description: 'End date of the range. Format: YYYY-MM-DD. Maximum 93-day range.',
                    displayOptions: {
                        show: {
                            resource: ['goldPrice'],
                            operation: ['getPriceDateRange'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/cenyzlota/{{$parameter["goldStartDate"]}}/{{$value}}/',
                        },
                    },
                },
                {
                    displayName: 'Count',
                    name: 'goldCount',
                    type: 'number',
                    required: true,
                    default: 10,
                    description: 'Number of last published gold prices to retrieve',
                    displayOptions: {
                        show: {
                            resource: ['goldPrice'],
                            operation: ['getLastNPrices'],
                        },
                    },
                    routing: {
                        request: {
                            method: 'GET',
                            url: '=/cenyzlota/last/{{$value}}/',
                        },
                    },
                },
            ],
        };
    }
}
exports.Nbp = Nbp;
//# sourceMappingURL=Nbp.node.js.map