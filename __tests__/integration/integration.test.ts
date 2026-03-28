import * as fs from 'fs';
import * as path from 'path';
import {
	waitForN8n,
	getExpectedNodes,
	N8N_BASE_URL,
	N8N_INTERNAL_TYPES_URL,
} from './helpers';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

/**
 * Extract session cookie from Set-Cookie response header.
 * n8n 2.x uses cookie-based auth via /rest/ endpoints.
 */
function extractSessionCookie(response: Response): string | undefined {
	const setCookie = response.headers.get('set-cookie');
	if (!setCookie) return undefined;
	// Extract cookie name=value before first semicolon
	const match = setCookie.match(/^([^;]+)/);
	return match ? match[1] : undefined;
}

describe('n8n Integration Tests', () => {
	let sessionCookie: string | undefined;

	beforeAll(async () => {
		// Wait for n8n to be healthy (container started by docker-compose)
		await waitForN8n(N8N_BASE_URL, 60000);

		// Set up owner account via /rest/ prefix (n8n 2.x internal API)
		try {
			const setupResponse = await fetch(`${N8N_BASE_URL}/rest/owner/setup`, {
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
				sessionCookie = extractSessionCookie(setupResponse);
			}
		} catch {
			// Owner may already be set up
		}

		// If no session from setup, log in to get one
		if (!sessionCookie) {
			try {
				const loginResponse = await fetch(`${N8N_BASE_URL}/rest/login`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						emailOrLdapLoginId: 'test@example.com',
						password: 'TestPassword123!',
					}),
				});

				if (loginResponse.ok) {
					sessionCookie = extractSessionCookie(loginResponse);
				}
			} catch {
				// Login failed
			}
		}

		// Fail fast if auth not obtained
		if (!sessionCookie) {
			throw new Error(
				'Failed to obtain n8n session cookie -- owner setup and login both failed. ' +
				'Integration tests require authentication in the Docker test environment.',
			);
		}
	}, 90000);

	/** Helper to build headers with session cookie */
	function authHeaders(extra?: Record<string, string>): Record<string, string> {
		const headers: Record<string, string> = { ...extra };
		if (sessionCookie) {
			headers['Cookie'] = sessionCookie;
		}
		return headers;
	}

	describe('Node Registration (INT-01)', () => {
		let registeredNodeNames: string[];

		beforeAll(async () => {
			const response = await fetch(N8N_INTERNAL_TYPES_URL, {
				headers: authHeaders(),
			});
			expect(response.ok).toBe(true);
			const nodeTypes = await response.json();
			registeredNodeNames = nodeTypes.map((n: { name: string }) => n.name);
		});

		const expectedNodes = getExpectedNodes();

		for (const pkg of expectedNodes) {
			for (const nodeType of pkg.nodeTypes) {
				it(`should have registered ${nodeType}`, () => {
					// When loaded via N8N_CUSTOM_EXTENSIONS, nodes get "CUSTOM." prefix
					// instead of package name prefix (e.g. "CUSTOM.smsapi" vs "n8n-nodes-smsapi.smsapi")
					const shortName = nodeType.split('.').pop()!;
					const customName = `CUSTOM.${shortName}`;
					const found = registeredNodeNames.includes(nodeType) ||
						registeredNodeNames.includes(customName);
					expect(found).toBe(true);
				});
			}
		}
	});

	describe('Credential Registration (INT-02)', () => {
		let registeredCredentialNames: string[];

		beforeAll(async () => {
			const response = await fetch(`${N8N_BASE_URL}/types/credentials.json`, {
				headers: authHeaders(),
			});

			if (response.ok) {
				const credentialTypes = await response.json();
				registeredCredentialNames = credentialTypes.map(
					(c: { name: string }) => c.name,
				);
			} else {
				// Fallback: extract credential types from node type definitions
				const nodeResponse = await fetch(N8N_INTERNAL_TYPES_URL, {
					headers: authHeaders(),
				});
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

				const response = await fetch(`${N8N_BASE_URL}/rest/workflows`, {
					method: 'POST',
					headers: authHeaders({ 'Content-Type': 'application/json' }),
					body: JSON.stringify(workflowJson),
				});

				expect(response.status).toBe(200);
				const result = await response.json();
				expect(result).toHaveProperty('data');
				expect(result.data).toHaveProperty('id');
			});
		}
	});
});
