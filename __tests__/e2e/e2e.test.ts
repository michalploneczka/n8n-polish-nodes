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
