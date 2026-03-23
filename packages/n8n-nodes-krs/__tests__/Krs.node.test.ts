// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { Krs } from '../nodes/Krs/Krs.node';

const BASE_URL = 'https://api-krs.ms.gov.pl';
const API_PATH = '/api/krs';

describe('Krs Node', () => {
	let node: Krs;

	beforeAll(() => {
		node = new Krs();
	});

	describe('Node Description', () => {
		it('should have displayName "KRS"', () => {
			expect(node.description.displayName).toBe('KRS');
		});

		it('should have name "krs"', () => {
			expect(node.description.name).toBe('krs');
		});

		it('should have correct requestDefaults baseURL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe(
				'https://api-krs.ms.gov.pl/api/krs',
			);
		});

		it('should have format=json in requestDefaults.qs', () => {
			expect(node.description.requestDefaults?.qs).toBeDefined();
			expect(
				(node.description.requestDefaults?.qs as Record<string, string>).format,
			).toBe('json');
		});

		it('should NOT have credentials', () => {
			const creds = node.description.credentials;
			expect(creds === undefined || (Array.isArray(creds) && creds.length === 0)).toBe(true);
		});

		it('should have 1 resource (company)', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp!.type).toBe('options');

			const options = (resourceProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(1);
			expect(options[0].value).toBe('company');
		});

		it('should have 2 company operations (getCurrentExtract, getFullExtract)', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('company'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(2);

			const values = options.map((o) => o.value);
			expect(values).toContain('getCurrentExtract');
			expect(values).toContain('getFullExtract');
		});

		it('should not have execute method', () => {
			expect((node as unknown as Record<string, unknown>).execute).toBeUndefined();
		});
	});

	describe('Routing', () => {
		it('getCurrentExtract krsNumber routing URL contains "/OdpisAktualny/"', () => {
			const krsNumberProp = node.description.properties.find(
				(p) =>
					p.name === 'krsNumber' &&
					p.displayOptions?.show?.operation?.includes('getCurrentExtract'),
			);
			expect(krsNumberProp).toBeDefined();
			expect(krsNumberProp!.routing).toBeDefined();
			expect(krsNumberProp!.routing!.request!.url).toContain('/OdpisAktualny/');
		});

		it('getFullExtract krsNumber routing URL contains "/OdpisPelny/"', () => {
			const krsNumberProp = node.description.properties.find(
				(p) =>
					p.name === 'krsNumber' &&
					p.displayOptions?.show?.operation?.includes('getFullExtract'),
			);
			expect(krsNumberProp).toBeDefined();
			expect(krsNumberProp!.routing).toBeDefined();
			expect(krsNumberProp!.routing!.request!.url).toContain('/OdpisPelny/');
		});
	});

	describe('HTTP Integration', () => {
		beforeEach(() => {
			setupNock();
		});

		afterEach(() => {
			teardownNock();
		});

		it('GET /OdpisAktualny/{krs}?format=json returns 200 with company JSON', () => {
			const responseBody = {
				odpis: {
					rodzaj: 'Aktualny',
					naglowekA: { rejestr: 'RejP', numerKRS: '0000019193' },
					dane: {
						dzial1: {
							danePodmiotu: {
								nazwa: 'POLSKI KONCERN NAFTOWY ORLEN SPOLKA AKCYJNA',
								identyfikatory: { regon: '610188201', nip: '7740001454' },
							},
						},
					},
				},
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/OdpisAktualny/0000019193`)
				.query({ format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/OdpisAktualny/0000019193?format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.odpis.rodzaj).toBe('Aktualny');
							expect(body.odpis.naglowekA.numerKRS).toBe('0000019193');
							expect(body.odpis.dane.dzial1.danePodmiotu.nazwa).toBe(
								'POLSKI KONCERN NAFTOWY ORLEN SPOLKA AKCYJNA',
							);
							expect(body.odpis.dane.dzial1.danePodmiotu.identyfikatory.nip).toBe('7740001454');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET /OdpisPelny/{krs}?format=json returns 200 with full extract JSON', () => {
			const responseBody = {
				odpis: {
					rodzaj: 'Pelny',
					naglowekA: { rejestr: 'RejP', numerKRS: '0000019193' },
					dane: {
						dzial1: {
							danePodmiotu: {
								nazwa: 'POLSKI KONCERN NAFTOWY ORLEN SPOLKA AKCYJNA',
							},
						},
						dzial2: {},
						dzial3: {},
						dzial4: {},
						dzial5: {},
						dzial6: {},
					},
				},
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/OdpisPelny/0000019193`)
				.query({ format: 'json' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/OdpisPelny/0000019193?format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.odpis.rodzaj).toBe('Pelny');
							expect(body.odpis.dane.dzial1).toBeDefined();
							expect(body.odpis.dane.dzial6).toBeDefined();
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET /OdpisAktualny/{invalidKrs}?format=json returns 404', () => {
			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/OdpisAktualny/9999999999`)
				.query({ format: 'json' })
				.reply(404, { code: 404, message: 'Not Found' });

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/OdpisAktualny/9999999999?format=json`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(404);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.code).toBe(404);
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('GET with rejestr=P query param is correctly sent', () => {
			const responseBody = {
				odpis: {
					rodzaj: 'Aktualny',
					naglowekA: { rejestr: 'RejP', numerKRS: '0000019193' },
					dane: {
						dzial1: {
							danePodmiotu: {
								nazwa: 'POLSKI KONCERN NAFTOWY ORLEN SPOLKA AKCYJNA',
							},
						},
					},
				},
			};

			const scope = createNockScope(BASE_URL)
				.get(`${API_PATH}/OdpisAktualny/0000019193`)
				.query({ format: 'json', rejestr: 'P' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}${API_PATH}/OdpisAktualny/0000019193?format=json&rejestr=P`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.odpis.naglowekA.rejestr).toBe('RejP');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});
	});
});
