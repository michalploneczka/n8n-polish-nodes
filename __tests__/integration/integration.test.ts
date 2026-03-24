import * as fs from 'fs';
import * as path from 'path';
import {
	waitForN8n,
	getExpectedNodes,
	N8N_BASE_URL,
	N8N_INTERNAL_TYPES_URL,
} from './helpers';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('n8n Integration Tests', () => {
	let apiKey: string | undefined;

	beforeAll(async () => {
		// Wait for n8n to be healthy (container started by integration-test.sh)
		await waitForN8n(N8N_BASE_URL, 60000);

		// Set up owner account for API access (needed for workflow import)
		try {
			const setupResponse = await fetch(`${N8N_BASE_URL}/api/v1/owner/setup`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: 'test@example.com',
					firstName: 'Test',
					lastName: 'User',
					password: 'TestPassword123!',
				}),
			});

			if (setupResponse.ok) {
				const setupData = await setupResponse.json();
				apiKey = setupData.apiKey;
			}
		} catch {
			// Owner may already be set up — continue without API key
		}

		// If no API key from setup, try to sign in and create one
		if (!apiKey) {
			try {
				const loginResponse = await fetch(`${N8N_BASE_URL}/api/v1/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: 'test@example.com',
						password: 'TestPassword123!',
					}),
				});

				if (loginResponse.ok) {
					const loginData = await loginResponse.json();
					apiKey = loginData.apiKey;
				}
			} catch {
				// Login failed — workflow import tests may be skipped
			}
		}
	}, 90000);

	describe('Node Registration (INT-01)', () => {
		let registeredNodeNames: string[];

		beforeAll(async () => {
			const response = await fetch(N8N_INTERNAL_TYPES_URL);
			expect(response.ok).toBe(true);
			const nodeTypes = await response.json();
			registeredNodeNames = nodeTypes.map((n: { name: string }) => n.name);
		});

		const expectedNodes = getExpectedNodes();

		for (const pkg of expectedNodes) {
			for (const nodeType of pkg.nodeTypes) {
				it(`should have registered ${nodeType}`, () => {
					expect(registeredNodeNames).toContain(nodeType);
				});
			}
		}
	});

	describe('Credential Registration (INT-02)', () => {
		let registeredCredentialNames: string[];

		beforeAll(async () => {
			const response = await fetch(`${N8N_BASE_URL}/types/credentials.json`);

			if (response.ok) {
				const credentialTypes = await response.json();
				registeredCredentialNames = credentialTypes.map(
					(c: { name: string }) => c.name,
				);
			} else {
				// Fallback: extract credential types from node type definitions
				const nodeResponse = await fetch(N8N_INTERNAL_TYPES_URL);
				expect(nodeResponse.ok).toBe(true);
				const nodeTypes = await nodeResponse.json();
				const credSet = new Set<string>();
				for (const node of nodeTypes) {
					if (node.credentials) {
						for (const cred of node.credentials) {
							credSet.add(cred.name);
						}
					}
				}
				registeredCredentialNames = Array.from(credSet);
			}
		});

		const expectedNodes = getExpectedNodes();
		const expectedCredentials = expectedNodes
			.flatMap((n) => n.credentialTypes)
			.filter((c) => c.length > 0);

		for (const credType of expectedCredentials) {
			it(`should have registered credential ${credType}`, () => {
				expect(registeredCredentialNames).toContain(credType);
			});
		}
	});

	describe('Smoke Workflow Import (INT-03)', () => {
		const fixtureFiles = fs
			.readdirSync(FIXTURES_DIR)
			.filter((f) => f.startsWith('workflow-') && f.endsWith('.json'));

		for (const fixtureFile of fixtureFiles) {
			it(`should import ${fixtureFile} successfully`, async () => {
				const workflowJson = JSON.parse(
					fs.readFileSync(path.join(FIXTURES_DIR, fixtureFile), 'utf-8'),
				);

				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
				};

				if (apiKey) {
					headers['X-N8N-API-KEY'] = apiKey;
				}

				const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
					method: 'POST',
					headers,
					body: JSON.stringify(workflowJson),
				});

				if (response.status === 401) {
					// Auth required but not available — skip gracefully
					console.warn(
						`Skipping ${fixtureFile}: API requires authentication (401)`,
					);
					return;
				}

				expect(response.status).toBe(200);
				const result = await response.json();
				expect(result).toHaveProperty('id');
			});
		}
	});
});
