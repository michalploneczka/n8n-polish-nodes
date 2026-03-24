// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { Vies } from '../nodes/Vies/Vies.node';

const BASE_URL = 'https://ec.europa.eu';
const API_PATH = '/taxation_customs/vies/rest-api';

describe('Vies Node', () => {
	let node: Vies;

	beforeAll(() => {
		node = new Vies();
	});

	describe('Node Description', () => {
		it('should have displayName "VIES"', () => {
			expect(node.description.displayName).toBe('VIES');
		});

		it('should have name "vies"', () => {
			expect(node.description.name).toBe('vies');
		});

		it('should have correct requestDefaults baseURL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe(
				'https://ec.europa.eu/taxation_customs/vies/rest-api',
			);
		});

		it('should NOT have credentials', () => {
			const creds = node.description.credentials;
			expect(creds === undefined || (Array.isArray(creds) && creds.length === 0)).toBe(true);
		});

		it('should have 1 resource (vatNumber)', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp!.type).toBe('options');

			const options = (resourceProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('vatNumber');
		});

		it('should have 1 vatNumber operation (validate)', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('vatNumber'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('validate');
		});

		it('should not have execute method', () => {
			expect((node as unknown as Record<string, unknown>).execute).toBeUndefined();
		});

		it('should have 28 country code options', () => {
			const countryCodeProp = node.description.properties.find(
				(p) => p.name === 'countryCode',
			);
			expect(countryCodeProp).toBeDefined();

			const options = (countryCodeProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(28);
		});

		it('should contain PL, DE, FR, and XI in country code options', () => {
			const countryCodeProp = node.description.properties.find(
				(p) => p.name === 'countryCode',
			);
			const options = (countryCodeProp as { options?: Array<{ value: string }> }).options!;
			const values = options.map((o) => o.value);

			expect(values).toContain('PL');
			expect(values).toContain('DE');
			expect(values).toContain('FR');
			expect(values).toContain('XI');
		});
	});

	describe('Routing', () => {
		it('validate vatNumber routing URL contains "/ms/" and "/vat/"', () => {
			const vatNumberProp = node.description.properties.find(
				(p) =>
					p.name === 'vatNumber' &&
					p.displayOptions?.show?.operation?.includes('validate'),
			);
			expect(vatNumberProp).toBeDefined();
			expect(vatNumberProp!.routing).toBeDefined();

			const url = vatNumberProp!.routing!.request!.url as string;
			expect(url).toContain('/ms/');
			expect(url).toContain('/vat/');
		});
	});

	describe('HTTP Integration', () => {
		beforeEach(() => {
			setupNock();
		});

		afterEach(() => {
			teardownNock();
		});

		it('valid VAT number returns isValid true with company data', () => {
			const responseBody = {
				isValid: true,
				name: 'ZAKLAD UBEZPIECZEN SPOLECZNYCH',
				address: 'SZAMOCKA 3/5\n01-748 WARSZAWA',
				vatNumber: '5213017228',
				userError: 'VALID',
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/ms/PL/vat/5213017228`)
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/ms/PL/vat/5213017228`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.isValid).toBe(true);
							expect(body.name).toBe('ZAKLAD UBEZPIECZEN SPOLECZNYCH');
							expect(body.address).toContain('WARSZAWA');
							expect(body.vatNumber).toBe('5213017228');
							expect(body.userError).toBe('VALID');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('invalid VAT number returns isValid false', () => {
			const responseBody = {
				isValid: false,
				name: '---',
				address: '---',
				vatNumber: '0000000000',
				userError: 'INVALID',
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/ms/PL/vat/0000000000`)
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/ms/PL/vat/0000000000`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.isValid).toBe(false);
							expect(body.userError).toBe('INVALID');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('member state unavailable returns MS_UNAVAILABLE', () => {
			const responseBody = {
				isValid: false,
				userError: 'MS_UNAVAILABLE',
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/ms/DE/vat/123456789`)
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/ms/DE/vat/123456789`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.isValid).toBe(false);
							expect(body.userError).toBe('MS_UNAVAILABLE');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('API returns 400 for malformed VAT number', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/ms/PL/vat/INVALID`)
				.reply(400, { errorWrapperDTO: { error: 'INVALID_INPUT', message: 'Invalid VAT number format' } });

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/ms/PL/vat/INVALID`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(400);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.errorWrapperDTO.error).toBe('INVALID_INPUT');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('API returns 500 when service is down', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/ms/PL/vat/5213017228`)
				.reply(500, { errorWrapperDTO: { error: 'MS_UNAVAILABLE', message: 'Member State service unavailable' } });

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/ms/PL/vat/5213017228`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(500);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.errorWrapperDTO.error).toBe('MS_UNAVAILABLE');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});
	});
});
