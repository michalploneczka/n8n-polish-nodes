// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { Nfz } from '../nodes/Nfz/Nfz.node';

const BASE_URL = 'https://api.nfz.gov.pl';
const API_PATH = '/app-itl-api';

describe('Nfz Node', () => {
	let node: Nfz;

	beforeAll(() => {
		node = new Nfz();
	});

	describe('Node Description', () => {
		it('should have displayName "NFZ Treatment Waiting Times"', () => {
			expect(node.description.displayName).toBe('NFZ Treatment Waiting Times');
		});

		it('should have name "nfz"', () => {
			expect(node.description.name).toBe('nfz');
		});

		it('should have correct requestDefaults baseURL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe(
				'https://api.nfz.gov.pl/app-itl-api',
			);
		});

		it('should have api-version 1.3 in requestDefaults qs', () => {
			expect(
				(node.description.requestDefaults?.qs as Record<string, string>)?.['api-version'],
			).toBe('1.3');
		});

		it('should have format json in requestDefaults qs', () => {
			expect(
				(node.description.requestDefaults?.qs as Record<string, string>)?.format,
			).toBe('json');
		});

		it('should NOT have credentials', () => {
			const creds = node.description.credentials;
			expect(
				creds === undefined || (Array.isArray(creds) && creds.length === 0),
			).toBe(true);
		});

		it('should have 4 resources (queue, benefit, locality, province)', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp!.type).toBe('options');

			const options = (resourceProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(4);

			const values = options.map((o) => o.value);
			expect(values).toContain('queue');
			expect(values).toContain('benefit');
			expect(values).toContain('locality');
			expect(values).toContain('province');
		});

		it('should have 3 queue operations (search, get, getManyPlaces)', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('queue'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(3);

			const values = options.map((o) => o.value);
			expect(values).toContain('search');
			expect(values).toContain('get');
			expect(values).toContain('getManyPlaces');
		});

		it('should have 1 benefit operation (search)', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('benefit'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('search');
		});

		it('should have 1 locality operation (search)', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('locality'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('search');
		});

		it('should have 1 province operation (getAll)', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('province'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('getAll');
		});

		it('should have 16 province options plus All Provinces', () => {
			const provinceProp = node.description.properties.find(
				(p) => p.name === 'province',
			);
			expect(provinceProp).toBeDefined();

			const options = (provinceProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(17);

			const allOption = options.find((o) => o.value === '');
			expect(allOption).toBeDefined();
		});

		it('should have case type field with Stable and Urgent options', () => {
			const caseProp = node.description.properties.find((p) => p.name === 'case');
			expect(caseProp).toBeDefined();

			const options = (caseProp as { options?: Array<{ value: number }> }).options!;
			expect(options).toHaveLength(2);

			const values = options.map((o) => o.value);
			expect(values).toContain(1);
			expect(values).toContain(2);
		});
	});

	describe('HTTP Contract Tests', () => {
		beforeEach(() => {
			setupNock();
		});

		afterEach(() => {
			teardownNock();
		});

		it('GET /queues returns queue search results', () => {
			const responseBody = {
				meta: { count: 1, page: 1, limit: 25 },
				links: { self: '/app-itl-api/queues?case=1' },
				data: [
					{
						type: 'queue',
						id: 'test-guid-123',
						attributes: {
							case: 1,
							benefit: 'PORADNIA TESTOWA',
							provider: 'TEST PROVIDER',
							locality: 'WARSZAWA',
						},
					},
				],
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/queues`)
				.query({ case: '1', 'api-version': '1.3', format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/queues?case=1&api-version=1.3&format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.data).toHaveLength(1);
							expect(body.data[0].type).toBe('queue');
							expect(body.data[0].id).toBe('test-guid-123');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET /queues/{id} returns single queue', () => {
			const responseBody = {
				data: {
					type: 'queue',
					id: 'test-guid-123',
					attributes: {
						case: 1,
						benefit: 'PORADNIA TESTOWA',
						provider: 'TEST PROVIDER',
						locality: 'WARSZAWA',
						'dates': { applicable: true, date: '2026-04-15' },
					},
				},
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/queues/test-guid-123`)
				.query({ 'api-version': '1.3', format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/queues/test-guid-123?api-version=1.3&format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.data.id).toBe('test-guid-123');
							expect(body.data.type).toBe('queue');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET /benefits returns benefit search results', () => {
			const responseBody = {
				meta: { count: 5, page: 1, limit: 25 },
				data: [
					{
						type: 'benefit',
						id: '1',
						attributes: { name: 'PORADNIA ORTOPEDYCZNA' },
					},
				],
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/benefits`)
				.query({ name: 'poradnia', 'api-version': '1.3', format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/benefits?name=poradnia&api-version=1.3&format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.data).toHaveLength(1);
							expect(body.data[0].type).toBe('benefit');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET /localities returns locality search results', () => {
			const responseBody = {
				meta: { count: 3, page: 1, limit: 25 },
				data: [
					{
						type: 'locality',
						id: '1',
						attributes: { name: 'WARSZAWA' },
					},
				],
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/localities`)
				.query({ name: 'Warszawa', 'api-version': '1.3', format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/localities?name=Warszawa&api-version=1.3&format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.data).toHaveLength(1);
							expect(body.data[0].type).toBe('locality');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET /provinces returns province list', () => {
			const responseBody = {
				data: [
					{ type: 'province', id: '01', attributes: { name: 'DOLNOSLASKIE' } },
					{ type: 'province', id: '02', attributes: { name: 'KUJAWSKO-POMORSKIE' } },
				],
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/provinces`)
				.query({ 'api-version': '1.3', format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/provinces?api-version=1.3&format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.data).toHaveLength(2);
							expect(body.data[0].type).toBe('province');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('handles 404 error response', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/queues/nonexistent`)
				.query({ 'api-version': '1.3', format: 'json' })
				.reply(404, { meta: { message: 'Not found' } });

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/queues/nonexistent?api-version=1.3&format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(404);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.meta.message).toBe('Not found');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});
	});
});
