import * as fs from 'fs';
import * as path from 'path';

export const N8N_BASE_URL = 'http://localhost:5679';
export const N8N_INTERNAL_TYPES_URL = `${N8N_BASE_URL}/types/nodes.json`;

export interface ExpectedNode {
	packageName: string;
	nodeTypes: string[];
	credentialTypes: string[];
}

/**
 * Polls n8n healthz endpoint until it responds with 200 OK.
 * @param baseUrl - Base URL of the n8n instance (e.g. http://localhost:5679)
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 60000)
 */
export async function waitForN8n(baseUrl: string, timeoutMs = 60000): Promise<void> {
	const pollInterval = 2000;
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		try {
			const response = await fetch(`${baseUrl}/healthz`);
			if (response.ok) {
				return;
			}
		} catch {
			// Connection refused or other network error — keep polling
		}
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(`n8n did not become healthy within ${timeoutMs}ms`);
}

/**
 * Dynamically reads all n8n-nodes-* packages from the packages/ directory
 * and extracts expected node types and credential types from each package.json.
 */
export function getExpectedNodes(): ExpectedNode[] {
	const packagesDir = path.resolve(__dirname, '../../packages');
	const entries = fs.readdirSync(packagesDir, { withFileTypes: true });

	const nodes: ExpectedNode[] = [];

	for (const entry of entries) {
		if (!entry.isDirectory() || !entry.name.startsWith('n8n-nodes-')) {
			continue;
		}

		const pkgJsonPath = path.join(packagesDir, entry.name, 'package.json');
		if (!fs.existsSync(pkgJsonPath)) {
			continue;
		}

		const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
		const packageName: string = pkgJson.name;
		const n8nSection = pkgJson.n8n;

		if (!n8nSection) {
			continue;
		}

		// Extract node types from paths like "dist/nodes/Smsapi/Smsapi.node.js"
		const nodeTypes: string[] = (n8nSection.nodes || []).map((nodePath: string) => {
			const fileName = path.basename(nodePath, '.node.js');
			const typeName = fileName.charAt(0).toLowerCase() + fileName.slice(1);
			return `${packageName}.${typeName}`;
		});

		// Extract credential types from paths like "dist/credentials/SmsapiApi.credentials.js"
		const credentialTypes: string[] = (n8nSection.credentials || []).map(
			(credPath: string) => {
				const fileName = path.basename(credPath, '.credentials.js');
				return fileName.charAt(0).toLowerCase() + fileName.slice(1);
			},
		);

		nodes.push({
			packageName,
			nodeTypes,
			credentialTypes,
		});
	}

	return nodes.sort((a, b) => a.packageName.localeCompare(b.packageName));
}
