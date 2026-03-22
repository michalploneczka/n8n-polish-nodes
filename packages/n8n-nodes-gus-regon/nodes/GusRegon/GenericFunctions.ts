import type { IExecuteFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { zalogujEnvelope, wylogujEnvelope, URLS } from './SoapTemplates';
import { unsoapResult } from './XmlParser';

/**
 * Session-managed SOAP request helper for GUS REGON BIR API.
 *
 * Handles the full lifecycle: login -> execute operation -> logout.
 * Returns the raw SOAP XML response string for the caller to parse.
 *
 * Session ID (sid) is sent as an HTTP header per GUS API requirements.
 */
export async function gusRegonApiRequest(
	this: IExecuteFunctions,
	soapBody: string,
): Promise<string> {
	const credentials = await this.getCredentials('gusRegonApi');
	const environment = credentials.environment as string;
	const baseUrl = environment === 'production' ? URLS.production : URLS.test;
	const apiKey = credentials.apiKey as string;

	// 1. Login -- get session ID
	const loginEnvelope = zalogujEnvelope(baseUrl, apiKey);
	let loginResponse: string;
	try {
		// GUS REGON requires SOAP 1.2 Content-Type and session-based auth via sid header.
		// Cannot use n8n declarative auth -- manual HTTP requests required.
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		loginResponse = (await this.helpers.httpRequest({
			method: 'POST',
			url: baseUrl,
			headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
			body: loginEnvelope,
			json: false,
		})) as unknown as string;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: 'GUS REGON login failed. Check your API key.',
		});
	}

	const sid = unsoapResult(loginResponse);
	if (!sid) {
		throw new NodeApiError(this.getNode(), {} as JsonObject, {
			message:
				'GUS REGON login returned empty session ID. Check API key and environment.',
		});
	}

	try {
		// 2. Execute operation with sid HTTP header
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		const response = (await this.helpers.httpRequest({
			method: 'POST',
			url: baseUrl,
			headers: {
				'Content-Type': 'application/soap+xml; charset=utf-8',
				sid,
			},
			body: soapBody,
			json: false,
		})) as unknown as string;
		return response;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `GUS REGON API error: ${(error as Error).message}`,
		});
	} finally {
		// 3. Always logout (best-effort, session expires after 60 min)
		try {
			const logoutEnvelope = wylogujEnvelope(baseUrl, sid);
			// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
			await this.helpers.httpRequest({
				method: 'POST',
				url: baseUrl,
				headers: {
					'Content-Type': 'application/soap+xml; charset=utf-8',
				},
				body: logoutEnvelope,
				json: false,
			});
		} catch {
			// Logout failure is non-critical; session expires after 60 min
		}
	}
}
