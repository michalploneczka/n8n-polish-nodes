// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { BialaListaVat } from '../nodes/BialaListaVat/BialaListaVat.node';

const BASE_URL = 'https://wl-api.mf.gov.pl';

describe('BialaListaVat Node', () => {
	let node: BialaListaVat;

	beforeAll(() => {
		node = new BialaListaVat();
	});

	describe('Node Description', () => {
		it('should have displayName "Biala Lista VAT"', () => {
			expect(node.description.displayName).toBe('Biala Lista VAT');
		});

		it('should have name "bialaListaVat"', () => {
			expect(node.description.name).toBe('bialaListaVat');
		});

		it('should have correct requestDefaults baseURL', () => {
			expect(node.description.requestDefaults?.baseURL).toBe(
				'https://wl-api.mf.gov.pl',
			);
		});

		it('should NOT have credentials', () => {
			const creds = node.description.credentials;
			expect(creds === undefined || (Array.isArray(creds) && creds.length === 0)).toBe(true);
		});

		it('should have 2 resources (subject, verification)', () => {
			const resourceProp = node.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp!.type).toBe('options');

			const options = (resourceProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(2);

			const values = options.map((o) => o.value);
			expect(values).toContain('subject');
			expect(values).toContain('verification');
		});

		it('should have 6 subject operations', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('subject'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(6);

			const values = options.map((o) => o.value);
			expect(values).toContain('searchByNip');
			expect(values).toContain('searchByNips');
			expect(values).toContain('searchByRegon');
			expect(values).toContain('searchByRegons');
			expect(values).toContain('searchByBankAccount');
			expect(values).toContain('searchByBankAccounts');
		});

		it('should have 2 verification operations', () => {
			const operationProp = node.description.properties.find(
				(p) =>
					p.name === 'operation' &&
					p.displayOptions?.show?.resource?.includes('verification'),
			);
			expect(operationProp).toBeDefined();

			const options = (operationProp as { options?: Array<{ value: string }> }).options!;
			expect(options).toHaveLength(2);

			const values = options.map((o) => o.value);
			expect(values).toContain('checkNipAccount');
			expect(values).toContain('checkRegonAccount');
		});

		it('should not have execute method', () => {
			expect((node as unknown as Record<string, unknown>).execute).toBeUndefined();
		});
	});

	describe('Routing', () => {
		it('searchByNip NIP field routing URL contains "/api/search/nip/"', () => {
			const nipProp = node.description.properties.find(
				(p) =>
					p.name === 'nip' &&
					p.displayOptions?.show?.operation?.includes('searchByNip'),
			);
			expect(nipProp).toBeDefined();
			expect(nipProp!.routing).toBeDefined();
			expect(nipProp!.routing!.request!.url).toContain('/api/search/nip/');
		});

		it('searchByNips NIPs field routing URL contains "/api/search/nips/"', () => {
			const nipsProp = node.description.properties.find(
				(p) =>
					p.name === 'nips' &&
					p.displayOptions?.show?.operation?.includes('searchByNips'),
			);
			expect(nipsProp).toBeDefined();
			expect(nipsProp!.routing).toBeDefined();
			expect(nipsProp!.routing!.request!.url).toContain('/api/search/nips/');
		});

		it('searchByRegon REGON field routing URL contains "/api/search/regon/"', () => {
			const regonProp = node.description.properties.find(
				(p) =>
					p.name === 'regon' &&
					p.displayOptions?.show?.operation?.includes('searchByRegon'),
			);
			expect(regonProp).toBeDefined();
			expect(regonProp!.routing).toBeDefined();
			expect(regonProp!.routing!.request!.url).toContain('/api/search/regon/');
		});

		it('searchByBankAccount bankAccount field routing URL contains "/api/search/bank-account/"', () => {
			const bankAccountProp = node.description.properties.find(
				(p) =>
					p.name === 'bankAccount' &&
					p.displayOptions?.show?.operation?.includes('searchByBankAccount'),
			);
			expect(bankAccountProp).toBeDefined();
			expect(bankAccountProp!.routing).toBeDefined();
			expect(bankAccountProp!.routing!.request!.url).toContain('/api/search/bank-account/');
		});

		it('checkNipAccount bankAccount field routing URL contains "/api/check/nip/"', () => {
			const checkBankProp = node.description.properties.find(
				(p) =>
					p.name === 'checkBankAccount' &&
					p.displayOptions?.show?.operation?.includes('checkNipAccount'),
			);
			expect(checkBankProp).toBeDefined();
			expect(checkBankProp!.routing).toBeDefined();
			expect(checkBankProp!.routing!.request!.url).toContain('/api/check/nip/');
		});

		it('checkRegonAccount bankAccount field routing URL contains "/api/check/regon/"', () => {
			const checkRegonBankProp = node.description.properties.find(
				(p) =>
					p.name === 'checkRegonBankAccount' &&
					p.displayOptions?.show?.operation?.includes('checkRegonAccount'),
			);
			expect(checkRegonBankProp).toBeDefined();
			expect(checkRegonBankProp!.routing).toBeDefined();
			expect(checkRegonBankProp!.routing!.request!.url).toContain('/api/check/regon/');
		});

		it('all operations have a date field with routing.send type "query"', () => {
			const allOperations = [
				'searchByNip', 'searchByNips', 'searchByRegon', 'searchByRegons',
				'searchByBankAccount', 'searchByBankAccounts',
				'checkNipAccount', 'checkRegonAccount',
			];

			for (const op of allOperations) {
				const dateProp = node.description.properties.find(
					(p) =>
						p.name === 'date' &&
						p.displayOptions?.show?.operation?.includes(op),
				);
				expect(dateProp).toBeDefined();
				expect(dateProp!.routing).toBeDefined();
				expect(dateProp!.routing!.send).toBeDefined();
				expect(dateProp!.routing!.send!.type).toBe('query');
				expect(dateProp!.routing!.send!.property).toBe('date');
			}
		});
	});

	describe('HTTP Integration', () => {
		beforeEach(() => {
			setupNock();
		});

		afterEach(() => {
			teardownNock();
		});

		it('search by NIP returns subject data', () => {
			const responseBody = {
				result: {
					subject: {
						name: 'ZAKLAD UBEZPIECZEN SPOLECZNYCH',
						nip: '5213017228',
						statusVat: 'Czynny',
						regon: '017849680',
						accountNumbers: ['12345678901234567890123456'],
					},
					requestId: 'abc-123',
					requestDateTime: '23-03-2026 10:00:00',
				},
			};

			const scope = createNockScope(BASE_URL)
				.get('/api/search/nip/5213017228')
				.query({ date: '2026-03-23' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}/api/search/nip/5213017228?date=2026-03-23`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.result.subject.name).toBe('ZAKLAD UBEZPIECZEN SPOLECZNYCH');
							expect(body.result.subject.nip).toBe('5213017228');
							expect(body.result.subject.statusVat).toBe('Czynny');
							expect(body.result.subject.accountNumbers).toHaveLength(1);
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('search by NIPs batch returns subjects array', () => {
			const responseBody = {
				result: {
					subjects: [
						{ name: 'FIRMA A', nip: '5213017228', statusVat: 'Czynny' },
						{ name: 'FIRMA B', nip: '1234567890', statusVat: 'Zwolniony' },
					],
					requestId: 'batch-123',
				},
			};

			const scope = createNockScope(BASE_URL)
				.get('/api/search/nips/5213017228,1234567890')
				.query({ date: '2026-03-23' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}/api/search/nips/5213017228,1234567890?date=2026-03-23`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.result.subjects).toHaveLength(2);
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('search by bank account returns subject data', () => {
			const responseBody = {
				result: {
					subjects: [
						{ name: 'FIRMA Z KONTEM', nip: '5213017228', statusVat: 'Czynny' },
					],
					requestId: 'bank-123',
				},
			};

			const scope = createNockScope(BASE_URL)
				.get('/api/search/bank-account/12345678901234567890123456')
				.query({ date: '2026-03-23' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}/api/search/bank-account/12345678901234567890123456?date=2026-03-23`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.result.subjects).toHaveLength(1);
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('check NIP + account returns accountAssigned TAK', () => {
			const responseBody = {
				result: {
					accountAssigned: 'TAK',
					requestId: 'def-456',
				},
			};

			const scope = createNockScope(BASE_URL)
				.get('/api/check/nip/5213017228/bank-account/12345678901234567890123456')
				.query({ date: '2026-03-23' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}/api/check/nip/5213017228/bank-account/12345678901234567890123456?date=2026-03-23`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.result.accountAssigned).toBe('TAK');
							expect(body.result.requestId).toBe('def-456');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('check NIP + wrong account returns accountAssigned NIE', () => {
			const responseBody = {
				result: {
					accountAssigned: 'NIE',
					requestId: 'ghi-789',
				},
			};

			const scope = createNockScope(BASE_URL)
				.get('/api/check/nip/5213017228/bank-account/99999999999999999999999999')
				.query({ date: '2026-03-23' })
				.reply(200, responseBody);

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}/api/check/nip/5213017228/bank-account/99999999999999999999999999?date=2026-03-23`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(200);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.result.accountAssigned).toBe('NIE');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});

		it('API returns error for invalid NIP', () => {
			const scope = createNockScope(BASE_URL)
				.get('/api/search/nip/000')
				.query({ date: '2026-03-23' })
				.reply(400, { code: 'WL-115', message: 'Nieprawidlowy NIP' });

			const https = require('https');
			return new Promise<void>((resolve) => {
				https.get(
					`${BASE_URL}/api/search/nip/000?date=2026-03-23`,
					(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
						expect(res.statusCode).toBe(400);
						let data = '';
						res.on('data', (chunk: string) => {
							data += chunk;
						});
						res.on('end', () => {
							const body = JSON.parse(data);
							expect(body.code).toBe('WL-115');
							expect(scope.isDone()).toBe(true);
							resolve();
						});
					},
				);
			});
		});
	});
});
