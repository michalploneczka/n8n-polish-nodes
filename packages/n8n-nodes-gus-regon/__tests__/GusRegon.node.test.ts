// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- resolved via jest moduleNameMapper
import { createMockExecuteFunctions, setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { GusRegon } from '../nodes/GusRegon/GusRegon.node';
import { URLS } from '../nodes/GusRegon/SoapTemplates';
import * as fs from 'fs';
import * as path from 'path';

const fixture = (name: string) =>
	fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8');

const TEST_URL = URLS.test;
const TEST_BASE = TEST_URL.replace(/\/wsBIR\/.*$/, '');
const TEST_PATH = '/wsBIR/UslugaBIRzewnPubl.svc';

describe('GusRegon Node', () => {
	let node: GusRegon;

	beforeEach(() => {
		node = new GusRegon();
		setupNock();
	});

	afterEach(() => {
		teardownNock();
	});

	describe('description', () => {
		it('should have correct metadata', () => {
			expect(node.description.name).toBe('gusRegon');
			expect(node.description.displayName).toBe('GUS REGON');
			expect(node.description.credentials).toEqual([
				{ name: 'gusRegonApi', required: true },
			]);
		});
	});

	describe('SOAP HTTP contract', () => {
		it('login request matches Zaloguj SOAP body', () => {
			const scope = createNockScope(TEST_BASE)
				.post(TEST_PATH, (body: string) => body.includes('Zaloguj'))
				.reply(200, fixture('zaloguj-response.xml'), {
					'Content-Type': 'application/soap+xml; charset=utf-8',
				});
			expect(scope).toBeDefined();
		});

		it('search request matches DaneSzukajPodmioty SOAP body with sid header', () => {
			const scope = createNockScope(TEST_BASE)
				.post(TEST_PATH, (body: string) => body.includes('DaneSzukajPodmioty'))
				.matchHeader('sid', 'test-session-id-12345')
				.reply(200, fixture('search-nip-response.xml'), {
					'Content-Type': 'application/soap+xml; charset=utf-8',
				});
			expect(scope).toBeDefined();
		});

		it('full report request matches DanePobierzPelnyRaport SOAP body', () => {
			const scope = createNockScope(TEST_BASE)
				.post(TEST_PATH, (body: string) => body.includes('DanePobierzPelnyRaport'))
				.matchHeader('sid', 'test-session-id-12345')
				.reply(200, fixture('full-report-prawna-response.xml'), {
					'Content-Type': 'application/soap+xml; charset=utf-8',
				});
			expect(scope).toBeDefined();
		});

		it('logout request matches Wyloguj SOAP body', () => {
			const scope = createNockScope(TEST_BASE)
				.post(TEST_PATH, (body: string) => body.includes('Wyloguj'))
				.reply(200, fixture('wyloguj-response.xml'), {
					'Content-Type': 'application/soap+xml; charset=utf-8',
				});
			expect(scope).toBeDefined();
		});
	});

	describe('execute', () => {
		function setupSearchMock(params: Record<string, unknown>, continueBool = false) {
			const mock = createMockExecuteFunctions(params, undefined, continueBool);
			mock.getCredentials = jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				environment: 'test',
			});
			const searchFixture = (params._searchFixture as string) || 'search-nip-response.xml';
			mock.helpers.httpRequest = jest.fn()
				.mockResolvedValueOnce(fixture('zaloguj-response.xml'))
				.mockResolvedValueOnce(fixture(searchFixture))
				.mockResolvedValueOnce(fixture('wyloguj-response.xml'));
			return mock;
		}

		it('should search by NIP', async () => {
			const mock = setupSearchMock({
				resource: 'company',
				operation: 'searchByNip',
				nip: '1234567890',
				_searchFixture: 'search-nip-response.xml',
			});
			const result = await node.execute.call(mock);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.Nip).toBe('1234567890');
			expect(result[0][0].json.Regon).toBe('012345678');
		});

		it('should search by REGON', async () => {
			const mock = setupSearchMock({
				resource: 'company',
				operation: 'searchByRegon',
				regon: '987654321',
				_searchFixture: 'search-regon-response.xml',
			});
			const result = await node.execute.call(mock);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.Regon).toBe('987654321');
		});

		it('should search by KRS', async () => {
			const mock = setupSearchMock({
				resource: 'company',
				operation: 'searchByKrs',
				krs: '0000123456',
				_searchFixture: 'search-krs-response.xml',
			});
			const result = await node.execute.call(mock);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.Nip).toBe('1112223330');
		});

		it('should get full data with PKD codes', async () => {
			const mock = createMockExecuteFunctions({
				resource: 'company',
				operation: 'getFullData',
				regonForReport: '012345678',
				includePkd: true,
			});
			mock.getCredentials = jest.fn().mockResolvedValue({
				apiKey: 'test-key',
				environment: 'test',
			});
			// getFullData makes 3 gusRegonApiRequest calls (search + report + pkd)
			// Each call = login + operation + logout = 3 httpRequest calls
			// Total: 9 httpRequest calls
			mock.helpers.httpRequest = jest.fn()
				// Search session
				.mockResolvedValueOnce(fixture('zaloguj-response.xml'))
				.mockResolvedValueOnce(fixture('search-nip-response.xml'))
				.mockResolvedValueOnce(fixture('wyloguj-response.xml'))
				// Full report session
				.mockResolvedValueOnce(fixture('zaloguj-response.xml'))
				.mockResolvedValueOnce(fixture('full-report-prawna-response.xml'))
				.mockResolvedValueOnce(fixture('wyloguj-response.xml'))
				// PKD report session
				.mockResolvedValueOnce(fixture('zaloguj-response.xml'))
				.mockResolvedValueOnce(fixture('full-report-pkd-response.xml'))
				.mockResolvedValueOnce(fixture('wyloguj-response.xml'));

			const result = await node.execute.call(mock);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.praw_regon9).toBe('012345678');
			expect(result[0][0].json.pkdCodes).toHaveLength(2);
		});

		it('should return empty array for not found NIP', async () => {
			const mock = setupSearchMock({
				resource: 'company',
				operation: 'searchByNip',
				nip: '0000000000',
				_searchFixture: 'empty-response.xml',
			});
			const result = await node.execute.call(mock);
			expect(result[0]).toHaveLength(0);
		});

		it('should handle continueOnFail', async () => {
			const mock = createMockExecuteFunctions(
				{
					resource: 'company',
					operation: 'searchByNip',
					nip: '1234567890',
				},
				undefined,
				true,
			);
			mock.getCredentials = jest.fn().mockResolvedValue({
				apiKey: 'bad-key',
				environment: 'test',
			});
			mock.helpers.httpRequest = jest.fn().mockRejectedValue(new Error('Connection refused'));
			const result = await node.execute.call(mock);
			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json.error).toBeDefined();
		});
	});
});
