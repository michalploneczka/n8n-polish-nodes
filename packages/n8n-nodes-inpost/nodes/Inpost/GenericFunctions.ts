import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

const BASE_URLS: Record<string, string> = {
	sandbox: 'https://sandbox-api-shipx-pl.easypack24.net',
	production: 'https://api-shipx-pl.easypack24.net',
};

export async function inpostApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	options: IDataObject = {},
): Promise<IDataObject | IDataObject[] | Buffer | undefined> {
	const credentials = await this.getCredentials('inpostApi');
	const environment = credentials.environment as string;
	const apiToken = credentials.apiToken as string;
	const baseUrl = BASE_URLS[environment] || BASE_URLS.sandbox;

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${apiToken}`,
		},
		qs,
		json: true,
		...options,
	};

	if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
		requestOptions.body = body;
	}

	try {
		// InPost ShipX uses environment-based dynamic URLs (sandbox vs production)
		// requiring manual URL construction. Auth is via Bearer token in headers.
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		return await this.helpers.httpRequest(requestOptions);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `InPost API error: ${(error as Error).message}`,
		});
	}
}

export async function inpostApiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0) as number);
	const perPage = 25;
	let page = 1;
	const allItems: IDataObject[] = [];

	while (true) {
		const response = (await inpostApiRequest.call(this, method, endpoint, body, {
			...qs,
			page,
			per_page: perPage,
		})) as IDataObject;

		const items = (response.items || []) as IDataObject[];
		allItems.push(...items);

		if (!returnAll && allItems.length >= limit) {
			return allItems.slice(0, limit);
		}

		const totalPages = (response.total_pages as number) || 1;
		if (page >= totalPages || items.length < perPage) {
			break;
		}

		page++;
	}

	return allItems;
}
