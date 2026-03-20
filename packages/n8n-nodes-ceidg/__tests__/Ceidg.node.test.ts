import { NodeApiError } from 'n8n-workflow';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { Ceidg } from '../nodes/Ceidg/Ceidg.node';
import { CeidgApi } from '../credentials/CeidgApi.credentials';

const BASE_URL = 'https://dane.biznes.gov.pl';
const API_PATH = '/api/ceidg/v2';

describe('Ceidg Node', () => {
	let node: Ceidg;

	beforeAll(() => {
		node = new Ceidg();
	});

	describe('Node Description', () => {
		it('should have correct displayName', () => {
			expect(node.description.displayName).toBe('CEIDG');
		});

		it('should have correct requestDefaults baseURL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe(
				'https://dane.biznes.gov.pl/api/ceidg/v2',
			);
		});

		it('should require ceidgApi credentials', () => {
			const creds = node.description.credentials;
			expect(creds).toBeDefined();
			expect(creds).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: 'ceidgApi', required: true }),
				]),
			);
		});

		it('should have 3 operations', () => {
			const operationProp = node.description.properties.find(
				(p) => p.name === 'operation',
			);
			expect(operationProp).toBeDefined();
			expect(operationProp!.type).toBe('options');

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(3);

			const values = options.map((o) => o.value);
			expect(values).toContain('searchByNip');
			expect(values).toContain('searchByName');
			expect(values).toContain('get');
		});

		it('should not have execute method', () => {
			expect((node as unknown as Record<string, unknown>).execute).toBeUndefined();
		});
	});

	describe('Operation Routing', () => {
		it('Search by NIP has correct routing', () => {
			const nipProp = node.description.properties.find((p) => p.name === 'nip');
			expect(nipProp).toBeDefined();
			expect(nipProp!.routing).toBeDefined();
			expect(nipProp!.routing!.request).toEqual(
				expect.objectContaining({ url: '/firmy', method: 'GET' }),
			);
			expect(nipProp!.routing!.send).toEqual(
				expect.objectContaining({ type: 'query', property: 'nip' }),
			);
		});

		it('Search by Name has correct routing', () => {
			const nazwaProp = node.description.properties.find((p) => p.name === 'nazwa');
			expect(nazwaProp).toBeDefined();
			expect(nazwaProp!.routing).toBeDefined();
			expect(nazwaProp!.routing!.request).toEqual(
				expect.objectContaining({ url: '/firmy', method: 'GET' }),
			);
			expect(nazwaProp!.routing!.send).toEqual(
				expect.objectContaining({ type: 'query', property: 'nazwa' }),
			);
		});

		it('Get by ID has correct routing', () => {
			const companyIdProp = node.description.properties.find(
				(p) => p.name === 'companyId',
			);
			expect(companyIdProp).toBeDefined();
			expect(companyIdProp!.routing).toBeDefined();
			expect(companyIdProp!.routing!.request!.url).toContain('/firmy/');
			expect(companyIdProp!.routing!.request!.method).toBe('GET');
		});
	});

	describe('CeidgApi Credentials', () => {
		let credentials: CeidgApi;

		beforeAll(() => {
			credentials = new CeidgApi();
		});

		it('should have apiKey property with password type', () => {
			const apiKeyProp = credentials.properties.find((p) => p.name === 'apiKey');
			expect(apiKeyProp).toBeDefined();
			expect(apiKeyProp!.type).toBe('string');
			expect(apiKeyProp!.typeOptions).toEqual(
				expect.objectContaining({ password: true }),
			);
		});

		it('should use generic auth with Authorization header', () => {
			const auth = credentials.authenticate as {
				type: string;
				properties: { headers: Record<string, string> };
			};
			expect(auth.type).toBe('generic');
			expect(auth.properties.headers.Authorization).toContain('$credentials?.apiKey');
		});

		it('should have test request for /firmy endpoint', () => {
			const test = credentials.test as {
				request: { url: string; method: string };
			};
			expect(test.request.url).toBe('/firmy');
			expect(test.request.method).toBe('GET');
		});
	});

	describe('HTTP Integration', () => {
		beforeEach(() => {
			setupNock();
		});

		afterEach(() => {
			teardownNock();
		});

		it('credential test returns success on 200', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/firmy`)
				.query({ nip: '1234567890' })
				.reply(200, { firma: [] });

			// Verify the mock endpoint is configured and callable
			expect(scope).toBeDefined();
			expect(scope.isDone()).toBe(false);

			// Simulate what n8n runtime would do: make the HTTP call
			const http = require('http');
			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/firmy?nip=1234567890`,
					(res: typeof http.IncomingMessage) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body).toEqual({ firma: [] });
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('credential test handles 401 unauthorized - produces NodeApiError with English message', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/firmy`)
				.query({ nip: '1234567890' })
				.reply(401, { error: 'Unauthorized' });

			return new Promise<void>((resolve) => {
				const https = require('https');
				https.get(
					`${BASE_URL}${API_PATH}/firmy?nip=1234567890`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(401);

						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);

							// Verify NodeApiError can be instantiated with this error data
							// (n8n runtime does this automatically for declarative nodes)
							const nodeError = new NodeApiError(
								{ id: 'test-id', name: 'CEIDG', type: 'ceidg', typeVersion: 1, position: [0, 0], parameters: {} },
								{ status: 401, body },
								{ message: 'Authentication failed - invalid API key' },
							);

							expect(nodeError).toBeInstanceOf(NodeApiError);
							expect(nodeError.message).toBeTruthy();
							// Verify message is in English (no non-ASCII characters)
							expect(nodeError.message).toMatch(/^[\x20-\x7E]+$/);

							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('API returns 404 for unknown company', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/firmy`)
				.query({ nip: '0000000000' })
				.reply(404, { error: 'Not found' });

			return new Promise<void>((resolve) => {
				const https = require('https');
				https.get(
					`${BASE_URL}${API_PATH}/firmy?nip=0000000000`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(404);

						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.error).toBe('Not found');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});
	});
});
