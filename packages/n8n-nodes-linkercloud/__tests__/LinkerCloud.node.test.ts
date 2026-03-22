// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { createMockExecuteFunctions } from '@n8n-polish-nodes/test-utils';
import { LinkerCloud } from '../nodes/LinkerCloud/LinkerCloud.node';
import { LinkerCloudApi } from '../credentials/LinkerCloudApi.credentials';

const TEST_DOMAIN = 'test-company.linker.shop';
const TEST_API_KEY = 'test-api-key-123';

function createLinkerCloudMock(
	params: Record<string, unknown>,
	continueBool = false,
) {
	const mock = createMockExecuteFunctions(params, undefined, continueBool);
	mock.getCredentials = jest.fn().mockResolvedValue({
		domain: TEST_DOMAIN,
		apiKey: TEST_API_KEY,
	});
	mock.helpers.httpRequest = jest.fn();
	mock.helpers.prepareBinaryData = jest.fn();
	return mock;
}

describe('LinkerCloud Node Description', () => {
	const node = new LinkerCloud();
	const { description } = node;

	it('has correct node metadata', () => {
		expect(description.displayName).toBe('Linker Cloud');
		expect(description.name).toBe('linkerCloud');
		expect(description.credentials).toEqual([
			{ name: 'linkerCloudApi', required: true },
		]);
	});

	it('defines all 6 resources', () => {
		const resourceProp = description.properties.find(
			(p) => p.name === 'resource' && p.type === 'options',
		);
		expect(resourceProp).toBeDefined();
		const values = (resourceProp!.options as Array<{ value: string }>).map(
			(o) => o.value,
		);
		expect(values).toContain('order');
		expect(values).toContain('product');
		expect(values).toContain('stock');
		expect(values).toContain('shipment');
		expect(values).toContain('inboundOrder');
		expect(values).toContain('orderReturn');
		expect(values).toHaveLength(6);
	});
});

describe('LinkerCloud Credentials', () => {
	const creds = new LinkerCloudApi();

	it('has name linkerCloudApi', () => {
		expect(creds.name).toBe('linkerCloudApi');
	});

	it('has domain and apiKey properties', () => {
		const propNames = creds.properties.map((p) => p.name);
		expect(propNames).toContain('domain');
		expect(propNames).toContain('apiKey');
	});

	it('test request URL uses domain credential', () => {
		const testReq = creds.test as { request: { url: string; qs: Record<string, string> } };
		expect(testReq.request.url).toContain('$credentials.domain');
		expect(testReq.request.qs.apikey).toContain('$credentials.apiKey');
	});
});

describe('Order Operations', () => {
	const node = new LinkerCloud();

	it('list orders with pagination params', async () => {
		const mock = createLinkerCloudMock({
			resource: 'order',
			operation: 'list',
			returnAll: false,
			limit: 10,
			filters: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			items: [{ id: 1, orderNumber: 'ORD-001' }],
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 1, orderNumber: 'ORD-001' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `https://${TEST_DOMAIN}/public-api/v1/orders`,
				method: 'GET',
				qs: expect.objectContaining({
					apikey: TEST_API_KEY,
					offset: '0',
					limit: '100',
				}),
			}),
		);
	});

	it('get order by ID', async () => {
		const mock = createLinkerCloudMock({
			resource: 'order',
			operation: 'get',
			orderId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			id: 123,
			orderNumber: 'ORD-123',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 123, orderNumber: 'ORD-123' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `https://${TEST_DOMAIN}/public-api/v1/orders/123`,
				method: 'GET',
				qs: expect.objectContaining({ apikey: TEST_API_KEY }),
			}),
		);
	});

	it('create order with items default arrays', async () => {
		const items = JSON.stringify([{ sku: 'SKU-1', quantity: 2 }]);
		const mock = createLinkerCloudMock({
			resource: 'order',
			operation: 'create',
			orderDate: '2026-03-21 10:00:00',
			executionDate: '2026-03-22 10:00:00',
			executionDueDate: '2026-03-23 10:00:00',
			deliveryEmail: 'test@example.com',
			codAmount: 0,
			shipmentPrice: 10,
			shipmentPriceNet: 8.13,
			discount: 0,
			paymentTransactionId: 'TX-001',
			itemsMode: 'json',
			items,
			additionalFields: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 456 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 456 });

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toBe(`https://${TEST_DOMAIN}/public-api/v1/orders`);
		expect(callArgs.method).toBe('POST');
		expect(callArgs.qs.apikey).toBe(TEST_API_KEY);

		// Verify items have default empty arrays for required sub-fields
		const sentItems = callArgs.body.items;
		expect(sentItems[0].serial_numbers).toEqual([]);
		expect(sentItems[0].custom_properties).toEqual([]);
		expect(sentItems[0].source_data).toEqual([]);
		expect(sentItems[0].batch_numbers).toEqual([]);
	});

	it('cancel order', async () => {
		const mock = createLinkerCloudMock({
			resource: 'order',
			operation: 'cancel',
			orderId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ status: 'cancelled' });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `https://${TEST_DOMAIN}/public-api/v1/orders/123/cancel`,
				method: 'PUT',
				qs: expect.objectContaining({ apikey: TEST_API_KEY }),
			}),
		);
	});
});

describe('Product Operations', () => {
	const node = new LinkerCloud();

	it('list products', async () => {
		const mock = createLinkerCloudMock({
			resource: 'product',
			operation: 'list',
			returnAll: false,
			limit: 10,
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			items: [{ id: 1, name: 'Widget', sku: 'WDG-001' }],
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 1, name: 'Widget', sku: 'WDG-001' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `https://${TEST_DOMAIN}/public-api/v1/products`,
				method: 'GET',
				qs: expect.objectContaining({ apikey: TEST_API_KEY }),
			}),
		);
	});

	it('create product with 9 boolean defaults and 4 array defaults', async () => {
		const mock = createLinkerCloudMock({
			resource: 'product',
			operation: 'create',
			name: 'Test Product',
			sku: 'TP-001',
			additionalFields: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 789 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 789 });

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toBe(`https://${TEST_DOMAIN}/public-api/v1/products`);
		expect(callArgs.method).toBe('POST');
		expect(callArgs.qs.apikey).toBe(TEST_API_KEY);

		const body = callArgs.body;
		// 9 boolean defaults
		expect(body.ignore_in_wms).toBe(false);
		expect(body.ignore_when_packing).toBe(false);
		expect(body.always_ask_for_serial_number).toBe(false);
		expect(body.has_batch_number).toBe(false);
		expect(body.is_expirable).toBe(false);
		expect(body.is_bio).toBe(false);
		expect(body.is_food).toBe(false);
		expect(body.is_insert).toBe(false);
		expect(body.is_fragile).toBe(false);

		// 4 array defaults
		expect(body.storageUnits).toEqual([]);
		expect(body.nameAliases).toEqual([]);
		expect(body.images).toEqual([]);
		expect(body.additionalCodes).toEqual([]);
	});
});

describe('Stock Operations', () => {
	const node = new LinkerCloud();

	it('update stock with items array', async () => {
		const stockItems = JSON.stringify([
			{ sku: 'SKU-1', totalQuantity: 100 },
			{ sku: 'SKU-2', totalQuantity: 50 },
		]);
		const mock = createLinkerCloudMock({
			resource: 'stock',
			operation: 'update',
			items: stockItems,
			additionalOptions: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ success: true });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toBe(`https://${TEST_DOMAIN}/public-api/v1/products-stocks`);
		expect(callArgs.method).toBe('PUT');
		expect(callArgs.qs.apikey).toBe(TEST_API_KEY);
		expect(callArgs.body.items).toEqual([
			{ sku: 'SKU-1', totalQuantity: 100 },
			{ sku: 'SKU-2', totalQuantity: 50 },
		]);
	});
});

describe('Shipment Operations', () => {
	const node = new LinkerCloud();

	it('create shipment', async () => {
		const packages = JSON.stringify([{ weight: 1.5, length: 30, width: 20, height: 10 }]);
		const mock = createLinkerCloudMock({
			resource: 'shipment',
			operation: 'create',
			orderNumber: 'ORD-001',
			packages,
			markAsPacked: true,
			createAdditional: false,
			additionalFields: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ id: 'SHIP-001' });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toBe(`https://${TEST_DOMAIN}/public-api/v1/deliveries`);
		expect(callArgs.method).toBe('POST');
		expect(callArgs.qs.apikey).toBe(TEST_API_KEY);
		expect(callArgs.body.orderNumber).toBe('ORD-001');
		expect(callArgs.body.packages).toEqual([{ weight: 1.5, length: 30, width: 20, height: 10 }]);
		expect(callArgs.body.markAsPacked).toBe(true);
	});

	it('get delivery status', async () => {
		const mock = createLinkerCloudMock({
			resource: 'shipment',
			operation: 'getStatus',
			orderId: 'ORD-001',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			orderId: 'ORD-001',
			status: 'shipped',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ orderId: 'ORD-001', status: 'shipped' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `https://${TEST_DOMAIN}/public-api/v1/deliveries/ORD-001`,
				method: 'GET',
				qs: expect.objectContaining({ apikey: TEST_API_KEY }),
			}),
		);
	});

	it('cancel selected packages via PATCH', async () => {
		const mock = createLinkerCloudMock({
			resource: 'shipment',
			operation: 'cancel',
			orderId: 'ORD-001',
			packageIdsToCancel: 'PKG-1, PKG-2',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({ success: true });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toBe(`https://${TEST_DOMAIN}/public-api/v1/deliveries/ORD-001`);
		expect(callArgs.method).toBe('PATCH');
		expect(callArgs.qs.apikey).toBe(TEST_API_KEY);
		expect(callArgs.body.ids).toEqual(['PKG-1', 'PKG-2']);
	});
});

describe('Error Handling', () => {
	const node = new LinkerCloud();

	it('wraps API error in NodeApiError with clear message', async () => {
		const mock = createLinkerCloudMock({
			resource: 'order',
			operation: 'get',
			orderId: '999',
		});
		(mock.helpers.httpRequest as jest.Mock).mockRejectedValueOnce({
			message: 'Internal Server Error',
			statusCode: 500,
		});

		await expect(node.execute.call(mock)).rejects.toThrow('Linker Cloud API error');
	});

	it('continueOnFail returns error in json instead of throwing', async () => {
		const mock = createLinkerCloudMock(
			{
				resource: 'order',
				operation: 'get',
				orderId: '999',
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

describe('API Key in Query Params', () => {
	const node = new LinkerCloud();

	it('all requests include apikey query parameter', async () => {
		// Test with multiple different operations to verify apikey is always present
		const operations = [
			{ resource: 'order', operation: 'get', orderId: '1' },
			{ resource: 'product', operation: 'list', returnAll: false, limit: 10 },
		];

		for (const params of operations) {
			const mock = createLinkerCloudMock(params);
			(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce(
				params.operation === 'list' ? { items: [] } : { id: 1 },
			);

			await node.execute.call(mock);

			const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
			expect(callArgs.qs.apikey).toBe(TEST_API_KEY);
		}
	});
});
