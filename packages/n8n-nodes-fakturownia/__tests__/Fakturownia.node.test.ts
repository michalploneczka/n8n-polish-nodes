// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { createMockExecuteFunctions } from '@n8n-polish-nodes/test-utils';
import { Fakturownia } from '../nodes/Fakturownia/Fakturownia.node';
import { FakturowniaApi } from '../credentials/FakturowniaApi.credentials';

function createFakturowniaMock(
	params: Record<string, unknown>,
	continueBool = false,
) {
	const mock = createMockExecuteFunctions(params, undefined, continueBool);
	mock.getCredentials = jest.fn().mockResolvedValue({
		apiToken: 'test-token',
		subdomain: 'testcompany',
	});
	mock.helpers.httpRequest = jest.fn();
	mock.helpers.prepareBinaryData = jest.fn();
	return mock;
}

describe('Fakturownia Node Description', () => {
	const node = new Fakturownia();
	const { description } = node;

	it('has correct name', () => {
		expect(description.name).toBe('fakturownia');
	});

	it('has 3 resources: invoice, client, product', () => {
		const resourceProp = description.properties.find(
			(p) => p.name === 'resource' && p.type === 'options',
		);
		expect(resourceProp).toBeDefined();
		const values = (resourceProp!.options as Array<{ value: string }>).map(
			(o) => o.value,
		);
		expect(values).toContain('invoice');
		expect(values).toContain('client');
		expect(values).toContain('product');
		expect(values).toHaveLength(3);
	});

	it('has credential fakturowniaApi', () => {
		expect(description.credentials).toBeDefined();
		expect(description.credentials![0].name).toBe('fakturowniaApi');
	});
});

describe('Fakturownia Credentials', () => {
	const creds = new FakturowniaApi();

	it('has name fakturowniaApi', () => {
		expect(creds.name).toBe('fakturowniaApi');
	});

	it('has apiToken and subdomain properties', () => {
		const propNames = creds.properties.map((p) => p.name);
		expect(propNames).toContain('apiToken');
		expect(propNames).toContain('subdomain');
	});

	it('test request URL contains subdomain.fakturownia.pl', () => {
		const testReq = creds.test as { request: { url: string } };
		expect(testReq.request.url).toContain('$credentials.subdomain');
		expect(testReq.request.url).toContain('.fakturownia.pl');
	});
});

describe('Invoice Operations', () => {
	const node = new Fakturownia();

	it('list invoices', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'list',
			returnAll: false,
			limit: 10,
			filters: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce([
			{ id: 1, number: 'FV 1/2026' },
		]);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 1, number: 'FV 1/2026' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('testcompany.fakturownia.pl/invoices.json'),
				method: 'GET',
				qs: expect.objectContaining({ api_token: 'test-token' }),
			}),
		);
	});

	it('get invoice', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'get',
			invoiceId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			id: 123,
			number: 'FV 1/2026',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 123, number: 'FV 1/2026' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/invoices/123.json'),
			}),
		);
	});

	it('create invoice', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'create',
			kind: 'vat',
			buyerName: 'Acme',
			buyerTaxNo: '1234567890',
			positions: '[{"name":"Service","quantity":1,"total_price_gross":123,"tax":23}]',
			additionalFields: { sell_date: '2026-03-21', payment_type: 'transfer' },
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 456 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 456 });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/invoices.json'),
				method: 'POST',
				body: {
					invoice: {
						kind: 'vat',
						buyer_name: 'Acme',
						buyer_tax_no: '1234567890',
						positions: [
							{ name: 'Service', quantity: 1, total_price_gross: 123, tax: 23 },
						],
						sell_date: '2026-03-21',
						payment_type: 'transfer',
					},
				},
			}),
		);
	});

	it('create invoice with Invalid JSON positions throws NodeApiError', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'create',
			kind: 'vat',
			buyerName: 'Acme',
			buyerTaxNo: '1234567890',
			positions: 'not-json',
			additionalFields: {},
		});

		await expect(node.execute.call(mock)).rejects.toThrow('Invalid JSON');
	});

	it('update invoice', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'update',
			invoiceId: '123',
			updateFields: { buyer_name: 'New Name' },
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 123 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/invoices/123.json'),
				method: 'PUT',
				body: { invoice: { buyer_name: 'New Name' } },
			}),
		);
	});

	it('delete invoice', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'delete',
			invoiceId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ success: true, id: '123' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/invoices/123.json'),
				method: 'DELETE',
			}),
		);
	});

	it('sendByEmail', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'sendByEmail',
			invoiceId: '123',
			emailTo: 'test@example.com',
			emailOptions: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			status: 'ok',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/invoices/123/send_by_email.json'),
				method: 'POST',
				body: expect.objectContaining({ email_to: 'test@example.com' }),
			}),
		);
	});

	it('downloadPdf', async () => {
		const pdfBuffer = Buffer.from('PDF-content');
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'downloadPdf',
			invoiceId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce(pdfBuffer);
		(mock.helpers.prepareBinaryData as jest.Mock).mockResolvedValueOnce({
			data: 'binary-base64',
			mimeType: 'application/pdf',
			fileName: 'invoice-123.pdf',
		});

		const result = await node.execute.call(mock);

		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/invoices/123.pdf'),
				encoding: 'arraybuffer',
				json: false,
			}),
		);
		expect(mock.helpers.prepareBinaryData).toHaveBeenCalledWith(
			expect.any(Buffer),
			'invoice-123.pdf',
			'application/pdf',
		);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].binary).toBeDefined();
		expect(result[0][0].binary!.data).toBeDefined();
	});
});

describe('Client Operations', () => {
	const node = new Fakturownia();

	it('list clients', async () => {
		const mock = createFakturowniaMock({
			resource: 'client',
			operation: 'list',
			returnAll: false,
			limit: 10,
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce([
			{ id: 1, name: 'Client A' },
		]);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 1, name: 'Client A' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/clients.json'),
				method: 'GET',
			}),
		);
	});

	it('get client', async () => {
		const mock = createFakturowniaMock({
			resource: 'client',
			operation: 'get',
			clientId: '1',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			id: 1,
			name: 'Client A',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/clients/1.json'),
			}),
		);
	});

	it('create client', async () => {
		const mock = createFakturowniaMock({
			resource: 'client',
			operation: 'create',
			name: 'New Client',
			taxNo: '9876543210',
			additionalFields: { email: 'client@test.com' },
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 2 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/clients.json'),
				method: 'POST',
				body: {
					client: {
						name: 'New Client',
						tax_no: '9876543210',
						email: 'client@test.com',
					},
				},
			}),
		);
	});
});

describe('Product Operations', () => {
	const node = new Fakturownia();

	it('list products', async () => {
		const mock = createFakturowniaMock({
			resource: 'product',
			operation: 'list',
			returnAll: false,
			limit: 10,
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce([
			{ id: 1, name: 'Product A' },
		]);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 1, name: 'Product A' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/products.json'),
				method: 'GET',
			}),
		);
	});

	it('create product', async () => {
		const mock = createFakturowniaMock({
			resource: 'product',
			operation: 'create',
			productName: 'Widget',
			totalPriceGross: 123,
			tax: 23,
			additionalFields: { code: 'WDG-001' },
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 2 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining('/products.json'),
				method: 'POST',
				body: {
					product: {
						name: 'Widget',
						total_price_gross: 123,
						tax: 23,
						code: 'WDG-001',
					},
				},
			}),
		);
	});
});

describe('Error Handling', () => {
	const node = new Fakturownia();

	it('API error wraps in NodeApiError', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'get',
			invoiceId: '999',
		});
		(mock.helpers.httpRequest as jest.Mock).mockRejectedValueOnce({
			message: 'Not Found',
			statusCode: 404,
		});

		await expect(node.execute.call(mock)).rejects.toThrow();
	});

	it('continueOnFail returns error in json instead of throwing', async () => {
		const mock = createFakturowniaMock(
			{
				resource: 'invoice',
				operation: 'get',
				invoiceId: '999',
			},
			true,
		);
		(mock.helpers.httpRequest as jest.Mock).mockRejectedValueOnce(
			new Error('Not Found'),
		);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toHaveProperty('error');
		expect(result[0][0].json.error).toContain('Not Found');
	});
});

describe('Subdomain Sanitization', () => {
	const node = new Fakturownia();

	it('strips .fakturownia.pl suffix from subdomain', async () => {
		const mock = createFakturowniaMock({
			resource: 'invoice',
			operation: 'get',
			invoiceId: '1',
		});
		// Override credentials to include the full domain suffix
		(mock.getCredentials as jest.Mock).mockResolvedValue({
			apiToken: 'test-token',
			subdomain: 'testcompany.fakturownia.pl',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 1 });

		await node.execute.call(mock);

		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringMatching(
					/^https:\/\/testcompany\.fakturownia\.pl\//,
				),
			}),
		);
		// Ensure no double .fakturownia.pl
		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).not.toContain(
			'testcompany.fakturownia.pl.fakturownia.pl',
		);
	});
});
