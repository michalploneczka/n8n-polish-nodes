import * as fs from 'fs';
import * as path from 'path';

export const N8N_BASE_URL = 'http://localhost:5679';

let cachedApiKey: string | null = null;

/**
 * Sets up n8n authentication by creating an owner account and obtaining an API key.
 * Falls back to login if owner is already set up.
 * Caches the API key for subsequent calls.
 */
export async function setupN8nAuth(): Promise<string> {
	if (cachedApiKey) {
		return cachedApiKey;
	}

	const setupPayload = {
		email: 'test@example.com',
		password: 'TestPassword123!',
		firstName: 'Test',
		lastName: 'User',
	};

	// Try owner setup first
	try {
		const setupResponse = await fetch(`${N8N_BASE_URL}/api/v1/owner/setup`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(setupPayload),
		});

		if (setupResponse.ok) {
			const data = await setupResponse.json();
			if (data.apiKey) {
				cachedApiKey = data.apiKey;
				return cachedApiKey!;
			}
		}
	} catch {
		// Setup failed, try login
	}

	// Fallback to login
	const loginResponse = await fetch(`${N8N_BASE_URL}/api/v1/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email: setupPayload.email,
			password: setupPayload.password,
		}),
	});

	if (!loginResponse.ok) {
		throw new Error(
			`Failed to authenticate with n8n: ${loginResponse.status} ${await loginResponse.text()}`,
		);
	}

	const loginData = await loginResponse.json();

	// Extract cookie for API key creation
	const cookies = loginResponse.headers.get('set-cookie') || '';

	// Create API key
	const apiKeyResponse = await fetch(`${N8N_BASE_URL}/api/v1/me/api-keys`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Cookie: cookies,
		},
		body: JSON.stringify({ label: 'e2e-test' }),
	});

	if (apiKeyResponse.ok) {
		const apiKeyData = await apiKeyResponse.json();
		cachedApiKey = apiKeyData.apiKey;
		return cachedApiKey!;
	}

	// If API key creation fails, try to use existing one
	if (loginData.apiKey) {
		cachedApiKey = loginData.apiKey;
		return cachedApiKey!;
	}

	throw new Error('Could not obtain n8n API key');
}

/**
 * Creates a workflow in n8n via the REST API.
 */
export async function createWorkflow(
	workflow: object,
): Promise<{ id: string }> {
	const apiKey = await setupN8nAuth();
	const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-N8N-API-KEY': apiKey,
		},
		body: JSON.stringify(workflow),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to create workflow: ${response.status} ${await response.text()}`,
		);
	}

	const data = await response.json();
	return { id: data.id };
}

/**
 * Activates a workflow by ID.
 * Tries POST /activate first, falls back to PATCH with {active: true} for older n8n versions.
 */
let activateEndpoint: 'post' | 'patch' | null = null;

export async function activateWorkflow(id: string): Promise<void> {
	const apiKey = await setupN8nAuth();
	const headers = {
		'Content-Type': 'application/json',
		'X-N8N-API-KEY': apiKey,
	};

	if (activateEndpoint !== 'patch') {
		const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}/activate`, {
			method: 'POST',
			headers,
		});
		if (response.ok) {
			activateEndpoint = 'post';
			return;
		}
		if (response.status === 404 || response.status === 405) {
			activateEndpoint = 'patch';
		} else {
			throw new Error(
				`Failed to activate workflow ${id}: ${response.status} ${await response.text()}`,
			);
		}
	}

	// PATCH fallback
	const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}`, {
		method: 'PATCH',
		headers,
		body: JSON.stringify({ active: true }),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to activate workflow ${id}: ${response.status} ${await response.text()}`,
		);
	}
	activateEndpoint = 'patch';
}

/**
 * Deactivates a workflow by ID. Best-effort — does not throw on failure.
 * Tries POST /deactivate first, falls back to PATCH with {active: false}.
 */
let deactivateEndpoint: 'post' | 'patch' | null = null;

export async function deactivateWorkflow(id: string): Promise<void> {
	try {
		const apiKey = await setupN8nAuth();
		const headers = {
			'Content-Type': 'application/json',
			'X-N8N-API-KEY': apiKey,
		};

		if (deactivateEndpoint !== 'patch') {
			const response = await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}/deactivate`, {
				method: 'POST',
				headers,
			});
			if (response.ok) {
				deactivateEndpoint = 'post';
				return;
			}
			if (response.status === 404 || response.status === 405) {
				deactivateEndpoint = 'patch';
			} else {
				return; // Best-effort, don't throw
			}
		}

		await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}`, {
			method: 'PATCH',
			headers,
			body: JSON.stringify({ active: false }),
		});
		deactivateEndpoint = 'patch';
	} catch {
		// Best-effort cleanup
	}
}

/**
 * Deletes a workflow by ID. Best-effort — does not throw on failure.
 */
export async function deleteWorkflow(id: string): Promise<void> {
	try {
		const apiKey = await setupN8nAuth();
		await fetch(`${N8N_BASE_URL}/api/v1/workflows/${id}`, {
			method: 'DELETE',
			headers: {
				'X-N8N-API-KEY': apiKey,
			},
		});
	} catch {
		// Best-effort cleanup
	}
}

/**
 * Calls a webhook endpoint on the n8n instance.
 */
export async function callWebhook(
	webhookPath: string,
	method: string = 'GET',
	body?: object,
): Promise<any> {
	const options: RequestInit = {
		method,
		headers: {} as Record<string, string>,
	};

	if (body) {
		(options.headers as Record<string, string>)['Content-Type'] =
			'application/json';
		options.body = JSON.stringify(body);
	}

	const response = await fetch(
		`${N8N_BASE_URL}/webhook/${webhookPath}`,
		options,
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Webhook call failed: ${response.status} ${text}`,
		);
	}

	return response.json();
}

/**
 * Creates a credential in n8n via the REST API.
 * Returns the credential ID.
 */
export async function createCredential(
	name: string,
	typeName: string,
	data: Record<string, string>,
): Promise<string> {
	const apiKey = await setupN8nAuth();
	const response = await fetch(`${N8N_BASE_URL}/api/v1/credentials`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-N8N-API-KEY': apiKey,
		},
		body: JSON.stringify({ name, type: typeName, data }),
	});

	if (!response.ok) {
		throw new Error(
			`Failed to create credential: ${response.status} ${await response.text()}`,
		);
	}

	const result = await response.json();
	return result.id;
}

/**
 * Checks if an error is a network-level error (connection refused, timeout, etc).
 */
export function isNetworkError(error: unknown): boolean {
	if (error instanceof Error) {
		const msg = error.message.toLowerCase();
		return (
			msg.includes('econnrefused') ||
			msg.includes('etimedout') ||
			msg.includes('enotfound') ||
			msg.includes('fetch failed')
		);
	}
	return false;
}

/**
 * Returns today's date as YYYY-MM-DD string.
 */
export function todayDateString(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Polls n8n healthz endpoint until it responds with 200 OK.
 * @param baseUrl - Base URL of the n8n instance (e.g. http://localhost:5679)
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 60000)
 */
export async function waitForN8n(
	baseUrl: string,
	timeoutMs = 60000,
): Promise<void> {
	const pollInterval = 2000;
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		try {
			const response = await fetch(`${baseUrl}/healthz`);
			if (response.ok) {
				return;
			}
		} catch {
			// Connection refused or other network error -- keep polling
		}
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(`n8n did not become healthy within ${timeoutMs}ms`);
}

/**
 * Loads a fixture JSON file from __tests__/e2e/fixtures/.
 */
export function loadFixture(name: string): object {
	const fixturePath = path.resolve(__dirname, 'fixtures', name);
	return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
}
