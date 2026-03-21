import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function fakturowniaApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
	options: IDataObject = {},
): Promise<IDataObject | IDataObject[] | Buffer | undefined> {
	const credentials = await this.getCredentials('fakturowniaApi');
	const subdomain = (credentials.subdomain as string).replace(/\.fakturownia\.pl$/i, '');
	const url = `https://${subdomain}.fakturownia.pl${endpoint}`;

	const requestOptions: IHttpRequestOptions = {
		method,
		url,
		qs: {
			...qs,
			api_token: credentials.apiToken as string,
		},
		json: true,
		...options,
	};

	if (method === 'POST' || method === 'PUT') {
		requestOptions.body = body;
	}

	try {
		// Fakturownia uses dynamic per-subdomain URLs (e.g. mycompany.fakturownia.pl)
		// requiring manual URL construction. Auth is via api_token query param, not headers.
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		return await this.helpers.httpRequest(requestOptions);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Fakturownia API error: ${(error as Error).message}`,
		});
	}
}

export async function fakturowniaApiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0) as number);
	const perPage = 100;
	let page = 1;
	const allItems: IDataObject[] = [];

	while (true) {
		const response = (await fakturowniaApiRequest.call(this, method, endpoint, body, {
			...qs,
			page,
			per_page: perPage,
		})) as IDataObject[];

		allItems.push(...response);

		if (!returnAll && allItems.length >= limit) {
			return allItems.slice(0, limit);
		}

		if (response.length < perPage) {
			break;
		}

		page++;
	}

	return allItems;
}
