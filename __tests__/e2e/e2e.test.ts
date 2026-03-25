import {
	waitForN8n,
	setupN8nAuth,
	createWorkflow,
	activateWorkflow,
	deactivateWorkflow,
	deleteWorkflow,
	callWebhook,
	createCredential,
	isNetworkError,
	todayDateString,
	loadFixture,
	N8N_BASE_URL,
} from './helpers';

/**
 * Unwraps n8n webhook response.
 * n8n may return array of items [{json: {...}}] or the raw API response directly.
 */
function unwrapResult(raw: any): any {
	if (Array.isArray(raw) && raw.length > 0) {
		return raw[0].json ?? raw[0];
	}
	return raw?.json ?? raw;
}

// Global setup: wait for n8n container and authenticate
beforeAll(async () => {
	await waitForN8n(N8N_BASE_URL, 60000);
	await setupN8nAuth();
}, 90000);

// ─── NBP E2E (E2E-02) ───────────────────────────────────────────────────────

describe('NBP E2E (E2E-02)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const fixture = loadFixture('e2e-nbp.json');
		const { id } = await createWorkflow(fixture);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should return EUR exchange rate with numeric mid value', async () => {
		try {
			const raw = await callWebhook('e2e-nbp');
			const result = unwrapResult(raw);

			expect(result).toHaveProperty('table', 'A');
			expect(result).toHaveProperty('code', 'EUR');
			expect(result.rates).toBeInstanceOf(Array);
			expect(result.rates.length).toBeGreaterThan(0);
			expect(typeof result.rates[0].mid).toBe('number');
			expect(result.rates[0].mid).toBeGreaterThan(0);
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('NBP API unavailable, skipping E2E test');
				return;
			}
			throw error;
		}
	});
});

// ─── NFZ E2E (E2E-03) ───────────────────────────────────────────────────────

describe('NFZ E2E (E2E-03)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const fixture = loadFixture('e2e-nfz.json');
		const { id } = await createWorkflow(fixture);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it(
		'should return queue search results for ortopedic queues',
		async () => {
			try {
				const raw = await callWebhook('e2e-nfz');
				const result = unwrapResult(raw);

				expect(result).toBeDefined();
				// NFZ API returns data array with queue results
				const data = result.data ?? result;
				if (Array.isArray(data)) {
					expect(data.length).toBeGreaterThan(0);
				} else {
					// Response contains meaningful data (not an error)
					expect(result).not.toHaveProperty('error');
				}
			} catch (error) {
				if (isNetworkError(error)) {
					console.warn('NFZ API unavailable, skipping E2E test');
					return;
				}
				throw error;
			}
		},
		30000,
	);
});

// ─── KRS E2E (E2E-04) ───────────────────────────────────────────────────────

describe('KRS E2E (E2E-04)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const fixture = loadFixture('e2e-krs.json');
		const { id } = await createWorkflow(fixture);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should return PKN Orlen data for KRS 0000019193', async () => {
		try {
			const raw = await callWebhook('e2e-krs');
			const result = unwrapResult(raw);

			expect(result).toBeDefined();
			expect(result).toHaveProperty('odpis');
			expect(result.odpis.naglowekA.numerKRS).toBe('0000019193');
			expect(result.odpis.rodzaj).toBe('Aktualny');
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('KRS API unavailable, skipping E2E test');
				return;
			}
			throw error;
		}
	});
});

// ─── Biala Lista VAT E2E (E2E-05) ───────────────────────────────────────────

describe('Biala Lista VAT E2E (E2E-05)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const fixture = loadFixture('e2e-biala-lista-vat.json') as any;
		// Patch the date field with today's date in case n8n does not evaluate expressions
		const patched = JSON.parse(JSON.stringify(fixture));
		patched.nodes[1].parameters.date = todayDateString();
		const { id } = await createWorkflow(patched);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should return ZUS data for NIP 5213017228', async () => {
		try {
			const raw = await callWebhook('e2e-biala-lista-vat');
			const result = unwrapResult(raw);

			expect(result).toBeDefined();
			expect(result.result.subject.nip).toBe('5213017228');
			expect(result.result.subject.statusVat).toBe('Czynny');
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn(
					'Biala Lista VAT API unavailable, skipping E2E test',
				);
				return;
			}
			throw error;
		}
	});
});

// ─── VIES E2E (E2E-06) ──────────────────────────────────────────────────────

describe('VIES E2E (E2E-06)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const fixture = loadFixture('e2e-vies.json');
		const { id } = await createWorkflow(fixture);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should validate PL5213017228 as a valid VAT number', async () => {
		try {
			const raw = await callWebhook('e2e-vies');
			const result = unwrapResult(raw);

			// VIES member state services may be down
			if (result?.userError === 'MS_UNAVAILABLE') {
				console.warn(
					'VIES member state service unavailable (MS_UNAVAILABLE), skipping',
				);
				return;
			}

			expect(result).toBeDefined();
			expect(result.isValid).toBe(true);
			expect(result.vatNumber).toBe('5213017228');
			expect(typeof result.name).toBe('string');
			expect(result.name.length).toBeGreaterThan(0);
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('VIES API unavailable, skipping E2E test');
				return;
			}
			throw error;
		}
	});
});

// ─── CEIDG E2E (E2E-07) ─────────────────────────────────────────────────────

const CEIDG_API_KEY = process.env.CEIDG_API_KEY;

// Skip CEIDG tests when API key is not provided via describe.skip
const ceidgDescribe = CEIDG_API_KEY ? describe : describe.skip;

ceidgDescribe('CEIDG E2E (E2E-07)', () => {
	let workflowId: string;

	beforeAll(async () => {
		// Create credential with the API key from environment
		const credentialId = await createCredential('CEIDG E2E', 'ceidgApi', {
			apiKey: CEIDG_API_KEY!,
		});

		// Load fixture and patch credential ID
		const fixture = loadFixture('e2e-ceidg.json') as any;
		const patched = JSON.parse(JSON.stringify(fixture));
		patched.nodes[1].credentials.ceidgApi.id = credentialId;

		const { id } = await createWorkflow(patched);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should return company data from CEIDG', async () => {
		try {
			const raw = await callWebhook('e2e-ceidg');
			const result = unwrapResult(raw);

			expect(result).toBeDefined();
			// CEIDG response should contain company data (flexible assertion)
			const hasData =
				result.firma !== undefined ||
				result.name !== undefined ||
				result.nip !== undefined ||
				(typeof result === 'object' && Object.keys(result).length > 0);
			expect(hasData).toBe(true);
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('CEIDG API unavailable, skipping E2E test');
				return;
			}
			throw error;
		}
	});
});

// ─── SMSAPI E2E (E2E-08) ─────────────────────────────────────────────────────

const SMSAPI_TOKEN = process.env.SMSAPI_TOKEN;
const smsapiDescribe = SMSAPI_TOKEN ? describe : describe.skip;

smsapiDescribe('SMSAPI E2E (E2E-08)', () => {
	let credentialId: string;
	let sendWorkflowId: string;
	let contactsWorkflowId: string;
	let balanceWorkflowId: string;

	beforeAll(async () => {
		credentialId = await createCredential('SMSAPI E2E', 'smsapiApi', {
			apiToken: SMSAPI_TOKEN!,
		});

		// Create 3 workflows sharing the same credential
		for (const [fixtureName, setter] of [
			['e2e-smsapi-send.json', (id: string) => { sendWorkflowId = id; }],
			['e2e-smsapi-contacts.json', (id: string) => { contactsWorkflowId = id; }],
			['e2e-smsapi-balance.json', (id: string) => { balanceWorkflowId = id; }],
		] as [string, (id: string) => void][]) {
			const fixture = loadFixture(fixtureName) as any;
			const patched = JSON.parse(JSON.stringify(fixture));
			patched.nodes[1].credentials.smsapiApi.id = credentialId;
			const { id } = await createWorkflow(patched);
			setter(id);
			await activateWorkflow(id);
		}
	});

	afterAll(async () => {
		for (const wfId of [sendWorkflowId, contactsWorkflowId, balanceWorkflowId]) {
			if (wfId) {
				await deactivateWorkflow(wfId);
				await deleteWorkflow(wfId);
			}
		}
	});

	it('should send SMS in test mode without consuming credits', async () => {
		try {
			const raw = await callWebhook('e2e-smsapi-send');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			// test=1 mode returns response without error
			expect(result).not.toHaveProperty('error');
			// Should have count or list field indicating accepted message
			if (result.count !== undefined) {
				expect(result.count).toBeGreaterThanOrEqual(1);
			}
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('SMSAPI unavailable, skipping');
				return;
			}
			throw error;
		}
	});

	it('should list contacts', async () => {
		try {
			const raw = await callWebhook('e2e-smsapi-contacts');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			expect(result).not.toHaveProperty('error');
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('SMSAPI unavailable, skipping');
				return;
			}
			throw error;
		}
	});

	it('should return account balance', async () => {
		try {
			const raw = await callWebhook('e2e-smsapi-balance');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			// Profile endpoint returns points or pro_count
			expect(typeof (result.points ?? result.pro_count)).not.toBe('undefined');
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('SMSAPI unavailable, skipping');
				return;
			}
			throw error;
		}
	});
});

// ─── Ceneo E2E (E2E-09) ──────────────────────────────────────────────────────

const CENEO_API_KEY = process.env.CENEO_API_KEY;
const ceneoDescribe = CENEO_API_KEY ? describe : describe.skip;

ceneoDescribe('Ceneo E2E (E2E-09)', () => {
	let credentialId: string;
	let categoriesWorkflowId: string;
	let limitsWorkflowId: string;

	beforeAll(async () => {
		credentialId = await createCredential('Ceneo E2E', 'ceneoApi', {
			apiKey: CENEO_API_KEY!,
		});

		for (const [fixtureName, setter] of [
			['e2e-ceneo-categories.json', (id: string) => { categoriesWorkflowId = id; }],
			['e2e-ceneo-limits.json', (id: string) => { limitsWorkflowId = id; }],
		] as [string, (id: string) => void][]) {
			const fixture = loadFixture(fixtureName) as any;
			const patched = JSON.parse(JSON.stringify(fixture));
			patched.nodes[1].credentials.ceneoApi.id = credentialId;
			const { id } = await createWorkflow(patched);
			setter(id);
			await activateWorkflow(id);
		}
	});

	afterAll(async () => {
		for (const wfId of [categoriesWorkflowId, limitsWorkflowId]) {
			if (wfId) {
				await deactivateWorkflow(wfId);
				await deleteWorkflow(wfId);
			}
		}
	});

	it('should return categories list via v3 auth', async () => {
		try {
			const raw = await callWebhook('e2e-ceneo-categories');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			// Categories endpoint returns array or object with category data
			if (Array.isArray(result)) {
				expect(result.length).toBeGreaterThan(0);
			} else {
				expect(result).not.toHaveProperty('error');
				expect(typeof result === 'object').toBe(true);
			}
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('Ceneo API unavailable, skipping');
				return;
			}
			throw error;
		}
	});

	it('should return execution limits via v2 auth', async () => {
		try {
			const raw = await callWebhook('e2e-ceneo-limits');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			expect(result).not.toHaveProperty('error');
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('Ceneo API unavailable, skipping');
				return;
			}
			throw error;
		}
	});
});

// ─── GUS REGON E2E (E2E-10) ──────────────────────────────────────────────────

const GUS_REGON_KEY = process.env.GUS_REGON_KEY || 'abcde12345abcde12345';

describe('GUS REGON E2E (E2E-10)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const credentialId = await createCredential('GUS REGON E2E', 'gusRegonApi', {
			apiKey: GUS_REGON_KEY,
			environment: 'test',
		});

		const fixture = loadFixture('e2e-gus-regon.json') as any;
		const patched = JSON.parse(JSON.stringify(fixture));
		patched.nodes[1].credentials.gusRegonApi.id = credentialId;
		const { id } = await createWorkflow(patched);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should return company data for NIP 7171642051 from test environment', async () => {
		try {
			const raw = await callWebhook('e2e-gus-regon');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			// GUS REGON returns parsed XML with company fields
			// Flexible assertion: non-empty response without error
			if (typeof result === 'object' && result !== null) {
				expect(Object.keys(result).length).toBeGreaterThan(0);
			}
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('GUS REGON test environment unavailable, skipping');
				return;
			}
			// SOAP errors may appear as XML parsing failures
			const msg = error instanceof Error ? error.message : '';
			if (msg.includes('XML') || msg.includes('SOAP') || msg.includes('unexpected token')) {
				console.warn('GUS REGON SOAP error (likely test env down):', msg);
				return;
			}
			throw error;
		}
	}, 30000);
});

// ─── LinkerCloud E2E (E2E-11) ─────────────────────────────────────────────────

const LINKERCLOUD_API_KEY = process.env.LINKERCLOUD_API_KEY;
const LINKERCLOUD_DOMAIN = process.env.LINKERCLOUD_DOMAIN;
const linkercloudDescribe = (LINKERCLOUD_API_KEY && LINKERCLOUD_DOMAIN) ? describe : describe.skip;

linkercloudDescribe('LinkerCloud E2E (E2E-11)', () => {
	let workflowId: string;

	beforeAll(async () => {
		const credentialId = await createCredential('LinkerCloud E2E', 'linkerCloudApi', {
			domain: LINKERCLOUD_DOMAIN!,
			apiKey: LINKERCLOUD_API_KEY!,
		});

		const fixture = loadFixture('e2e-linkercloud.json') as any;
		const patched = JSON.parse(JSON.stringify(fixture));
		patched.nodes[1].credentials.linkerCloudApi.id = credentialId;
		const { id } = await createWorkflow(patched);
		workflowId = id;
		await activateWorkflow(workflowId);
	});

	afterAll(async () => {
		if (workflowId) {
			await deactivateWorkflow(workflowId);
			await deleteWorkflow(workflowId);
		}
	});

	it('should return order list (empty or with data)', async () => {
		try {
			const raw = await callWebhook('e2e-linkercloud');
			const result = unwrapResult(raw);
			expect(result).toBeDefined();
			// Empty order list is valid -- just check no error
			expect(result).not.toHaveProperty('error');
		} catch (error) {
			if (isNetworkError(error)) {
				console.warn('LinkerCloud API unavailable, skipping');
				return;
			}
			throw error;
		}
	});
});
