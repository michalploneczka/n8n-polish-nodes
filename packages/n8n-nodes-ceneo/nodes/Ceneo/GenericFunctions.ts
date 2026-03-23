import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URL = 'https://developers.ceneo.pl';

let cachedToken: string | undefined;

export function resetTokenCache(): void {
	cachedToken = undefined;
}

async function getToken(this: IExecuteFunctions): Promise<string> {
	if (cachedToken) return cachedToken;
	const credentials = await this.getCredentials('ceneoApi');
	const apiKey = credentials.apiKey as string;

	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url: `${BASE_URL}/AuthorizationService.svc/GetToken`,
		headers: { Authorization: `Basic ${apiKey}` },
		json: true,
	};

	try {
		// Ceneo v3 auth requires programmatic token acquisition from AuthorizationService
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		const response = await this.helpers.httpRequest(requestOptions);
		// GetToken may return plain string or JSON -- handle both
		cachedToken =
			typeof response === 'string'
				? response
				: ((response as IDataObject).token as string) ?? String(response);
		return cachedToken;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Ceneo API token error: ${(error as Error).message}`,
		});
	}
}

export async function ceneoApiRequestV3(
	this: IExecuteFunctions,
	endpoint: string,
	qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const token = await getToken.call(this);
	const requestOptions: IHttpRequestOptions = {
		method: 'GET',
		url: `${BASE_URL}${endpoint}`,
		headers: { Authorization: `Bearer ${token}` },
		qs,
		json: true,
	};

	try {
		// Ceneo v3 uses Bearer token obtained from AuthorizationService
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		return (await this.helpers.httpRequest(requestOptions)) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Ceneo API error: ${(error as Error).message}`,
		});
	}
}

export async function ceneoApiRequestV2(
	this: IExecuteFunctions,
	functionName: string,
	params: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('ceneoApi');
	const endpoint = `/api/v2/function/${functionName}/Call`;

	const requestOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${BASE_URL}${endpoint}`,
		qs: {
			apiKey: credentials.apiKey as string,
			resultFormatter: 'json',
			...params,
		},
		json: true,
	};

	try {
		// Ceneo v2 uses apiKey as query parameter -- no credential-based auth possible
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		return (await this.helpers.httpRequest(requestOptions)) as IDataObject | IDataObject[];
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Ceneo API error: ${(error as Error).message}`,
		});
	}
}