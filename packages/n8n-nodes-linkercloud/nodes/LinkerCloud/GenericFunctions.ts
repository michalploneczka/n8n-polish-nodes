import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function linkerCloudApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject | IDataObject[]> {
	const credentials = await this.getCredentials('linkerCloudApi');
	const domain = (credentials.domain as string)
		.replace(/^https?:\/\//, '')
		.replace(/\/$/, '');
	const url = `https://${domain}${endpoint}`;

	qs.apikey = credentials.apiKey as string;

	const requestOptions: IHttpRequestOptions = {
		method,
		url,
		qs,
		json: true,
	};

	if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
		requestOptions.body = body;
	}

	try {
		// Linker Cloud uses dynamic per-customer domains (e.g. your-company.linker.shop)
		// requiring manual URL construction. Auth is via apikey query param, not headers.
		// eslint-disable-next-line @n8n/community-nodes/no-http-request-with-manual-auth
		return await this.helpers.httpRequest(requestOptions);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject, {
			message: `Linker Cloud API error: ${(error as Error).message}`,
		});
	}
}

export async function linkerCloudApiRequestAllItems(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	const returnAll = this.getNodeParameter('returnAll', 0) as boolean;
	const limit = returnAll ? 0 : (this.getNodeParameter('limit', 0) as number);
	const pageSize = 100;
	let offset = 0;
	const allItems: IDataObject[] = [];

	while (true) {
		const response = await linkerCloudApiRequest.call(this, method, endpoint, body, {
			...qs,
			offset: offset.toString(),
			limit: pageSize.toString(),
		});

		const items = Array.isArray(response)
			? response
			: (response as IDataObject).items
				? ((response as IDataObject).items as IDataObject[])
				: [response as IDataObject];

		allItems.push(...items);

		if (!returnAll && allItems.length >= limit) {
			return allItems.slice(0, limit);
		}

		if (items.length < pageSize) {
			break;
		}

		offset += pageSize;
	}

	return allItems;
}
