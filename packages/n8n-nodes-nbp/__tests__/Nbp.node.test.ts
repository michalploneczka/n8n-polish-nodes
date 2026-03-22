// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { Nbp } from '../nodes/Nbp/Nbp.node';

const BASE_URL = 'https://api.nbp.pl';
const API_PATH = '/api';

describe('Nbp Node', () => {
	let node: Nbp;

	beforeAll(() => {
		node = new Nbp();
	});

	describe('Node Description', () => {
		it('should have displayName "NBP Exchange Rates"', () => {
			expect(node.description.displayName).toBe('NBP Exchange Rates');
		});

		it('should have name "nbp"', () => {
			expect(node.description.name).toBe('nbp');
		});

		it('should have correct requestDefaults baseURL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe(
				'https://api.nbp.pl/api',
			);
		});

		it('should NOT have credentials', () => {
			const creds = node.description.credentials;
			expect(creds === undefined || (Array.isArray(creds) && creds.length === 0)).toBe(true);
		});

		it('should have 2 resources (exchangeRate, goldPrice)', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp!.type).toBe('options');

			const options = (resourceProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(2);

			const values = options.map((o) => o.value);
			expect(values).toContain('exchangeRate');
			expect(values).toContain('goldPrice');
		});

		it('should have 6 exchangeRate operations', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('exchangeRate'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(6);

			const values = options.map((o) => o.value);
			expect(values).toContain('getCurrentRate');
			expect(values).toContain('getRateByDate');
			expect(values).toContain('getRateDateRange');
			expect(values).toContain('getLastNRates');
			expect(values).toContain('getCurrentTable');
			expect(values).toContain('getTableByDate');
		});

		it('should have 4 goldPrice operations', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('goldPrice'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(4);

			const values = options.map((o) => o.value);
			expect(values).toContain('getCurrentPrice');
			expect(values).toContain('getPriceByDate');
			expect(values).toContain('getPriceDateRange');
			expect(values).toContain('getLastNPrices');
		});

		it('should not have execute method', () => {
			expect((node as unknown as Record<string, unknown>).execute).toBeUndefined();
		});
	});

	describe('Exchange Rate Routing', () => {
		it('getCurrentRate routing contains /exchangerates/rates/', () => {
			const currencyCodeProp = node.description.properties.find(
				(p) =>
					p.name === 'currencyCode' &&
					p.displayOptions?.show?.operation?.includes('getCurrentRate'),
			);
			expect(currencyCodeProp).toBeDefined();
			expect(currencyCodeProp!.routing).toBeDefined();
			expect(currencyCodeProp!.routing!.request!.url).toContain('/exchangerates/rates/');
		});

		it('getCurrentTable routing contains /exchangerates/tables/', () => {
			const tableRoutingProp = node.description.properties.find(
				(p) =>
					p.name === 'tableRouting' &&
					p.displayOptions?.show?.operation?.includes('getCurrentTable'),
			);
			expect(tableRoutingProp).toBeDefined();
			expect(tableRoutingProp!.routing).toBeDefined();
			expect(tableRoutingProp!.routing!.request!.url).toContain('/exchangerates/tables/');
		});

		it('getRateDateRange routing contains startDate and endDate in URL', () => {
			const endDateProp = node.description.properties.find(
				(p) =>
					p.name === 'endDate' &&
					p.displayOptions?.show?.operation?.includes('getRateDateRange'),
			);
			expect(endDateProp).toBeDefined();
			expect(endDateProp!.routing).toBeDefined();
			const url = endDateProp!.routing!.request!.url as string;
			expect(url).toContain('/exchangerates/rates/');
			expect(url).toContain('startDate');
		});
	});

	describe('Gold Price Routing', () => {
		it('getCurrentPrice routing contains /cenyzlota/', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('goldPrice'),
			);
			expect(operationProp).toBeDefined();

			const getCurrentOption = (operationProp as { options?: Array<{ value: string; routing?: { request?: { url?: string } } }> }).options!.find(
				(o) => o.value === 'getCurrentPrice',
			);
			expect(getCurrentOption).toBeDefined();
			expect(getCurrentOption!.routing).toBeDefined();
			expect(getCurrentOption!.routing!.request!.url).toContain('/cenyzlota/');
		});

		it('getPriceByDate routing contains /cenyzlota/ with date', () => {
			const goldDateProp = node.description.properties.find(
				(p) =>
					p.name === 'goldDate' &&
					p.displayOptions?.show?.operation?.includes('getPriceByDate'),
			);
			expect(goldDateProp).toBeDefined();
			expect(goldDateProp!.routing).toBeDefined();
			expect(goldDateProp!.routing!.request!.url).toContain('/cenyzlota/');
		});
	});

	describe('HTTP Integration', () => {
		beforeEach(() => {
			setupNock();
		});

		afterEach(() => {
			teardownNock();
		});

		it('exchange rate current returns 200 with JSON', () => {
			const responseBody = {
				table: 'A',
				currency: 'euro',
				code: 'EUR',
				rates: [
					{
						no: '055/A/NBP/2026',
						effectiveDate: '2026-03-20',
						mid: 4.2742,
					},
				],
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/exchangerates/rates/A/EUR/`)
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/exchangerates/rates/A/EUR/`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.table).toBe('A');
							expect(body.code).toBe('EUR');
							expect(body.rates).toHaveLength(1);
							expect(body.rates[0].mid).toBe(4.2742);
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('exchange rate table returns 200 with array', () => {
			const responseBody = [
				{
					table: 'A',
					no: '055/A/NBP/2026',
					effectiveDate: '2026-03-20',
					rates: [
						{ currency: 'euro', code: 'EUR', mid: 4.2742 },
					],
				},
			];

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/exchangerates/tables/A/`)
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/exchangerates/tables/A/`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(Array.isArray(body)).toBe(true);
							expect(body[0].table).toBe('A');
							expect(body[0].rates).toBeDefined();
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('gold price current returns 200', () => {
			const responseBody = [{ data: '2026-03-20', cena: 562.93 }];

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/cenyzlota/`)
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/cenyzlota/`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(Array.isArray(body)).toBe(true);
							expect(body[0].cena).toBe(562.93);
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('API returns 404 for weekend date', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/exchangerates/rates/A/EUR/2026-03-21/`)
				.reply(404, '404 NotFound - Not Found - Brak danych');

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/exchangerates/rates/A/EUR/2026-03-21/`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(404);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							expect(data).toContain('NotFound');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('API returns 400 for invalid date range', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/exchangerates/rates/A/EUR/2025-01-01/2025-12-31/`)
				.reply(400, '400 BadRequest - Przekroczony limit 93 dni');

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/exchangerates/rates/A/EUR/2025-01-01/2025-12-31/`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(400);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							expect(data).toContain('BadRequest');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});
	});
});
