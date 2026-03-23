// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { createMockExecuteFunctions } from '@n8n-polish-nodes/test-utils';
import { Ceneo } from '../nodes/Ceneo/Ceneo.node';
import { resetTokenCache } from '../nodes/Ceneo/GenericFunctions';

const TEST_API_KEY = 'test-ceneo-api-key';
const TEST_TOKEN = 'test-bearer-token-123';

function createCeneoMock(
	params: Record<string, unknown>,
	continueBool = false,
) {
	const mock = createMockExecuteFunctions(params, undefined, continueBool);
	mock.getCredentials = jest.fn().mockResolvedValue({
		apiKey: TEST_API_KEY,
	});
	mock.helpers.httpRequest = jest.fn();
	return mock;
}

describe('Ceneo Node Description', () => {
	const node = new Ceneo();
	const { description } = node;

	it('should have correct node metadata', () => {
		expect(description.displayName).toBe('Ceneo');
		expect(description.name).toBe('ceneo');
		const resourceProp = description.properties.find(
			(p) => p.name === 'resource' && p.type === 'options',
		);
		expect(resourceProp).toBeDefined();
		const values = (resourceProp!.options as Array<{ value: string }>).map(
			(o) => o.value,
		);
		expect(values).toHaveLength(3);
		expect(description.credentials).toEqual([
			{ name: 'ceneoApi', required: true },
		]);
	});
});

describe('Ceneo Token Acquisition', () => {
	const node = new Ceneo();

	beforeEach(() => {
		resetTokenCache();
	});

	it('should get token from AuthorizationService', async () => {
		const mock = createCeneoMock({
			resource: 'product',
			operation: 'getTopCategoryProducts',
			categoryName: 'Laptopy',
			top: 10,
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce(TEST_TOKEN)
			.mockResolvedValueOnce([{ productId: 1, name: 'Laptop X', price: 2999.99 }]);

		await node.execute.call(mock);

		const firstCall = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(firstCall.url).toContain('AuthorizationService.svc/GetToken');
		expect(firstCall.headers.Authorization).toBe(`Basic ${TEST_API_KEY}`);
	});
});

describe('Product Operations', () => {
	const node = new Ceneo();

	beforeEach(() => {
		resetTokenCache();
	});

	it('should get top category products (v3)', async () => {
		const mock = createCeneoMock({
			resource: 'product',
			operation: 'getTopCategoryProducts',
			categoryName: 'Laptopy',
			top: 10,
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce(TEST_TOKEN)
			.mockResolvedValueOnce([{ productId: 1, name: 'Laptop X', price: 2999.99 }]);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ productId: 1, name: 'Laptop X', price: 2999.99 });

		const secondCall = (mock.helpers.httpRequest as jest.Mock).mock.calls[1][0];
		expect(secondCall.url).toContain('/api/v3/GetTopCategoryProducts');
		expect(secondCall.qs).toEqual({ categoryName: 'Laptopy', top: 10 });
		expect(secondCall.headers.Authorization).toBe(`Bearer ${TEST_TOKEN}`);
	});

	it('should get all offers (v2)', async () => {
		const mock = createCeneoMock({
			resource: 'product',
			operation: 'getAllOffers',
			shopProductIds: '123,456',
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce({ offers: [{ offerId: 100, price: 49.99 }] });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ offers: [{ offerId: 100, price: 49.99 }] });

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toContain('webapi_data_critical.shop_getProductOffersBy_IDs/Call');
		expect(callArgs.method).toBe('POST');
		expect(callArgs.qs).toEqual(expect.objectContaining({
			apiKey: TEST_API_KEY,
			resultFormatter: 'json',
			shop_product_ids: '123,456',
		}));
	});

	it('should get top 10 cheapest offers (v2)', async () => {
		const mock = createCeneoMock({
			resource: 'product',
			operation: 'getTop10CheapestOffers',
			shopProductIds: '789',
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce({ offers: [{ offerId: 200, price: 29.99 }] });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toContain('shop_getProductTop10OffersByIDs');
	});
});

describe('Category Operations', () => {
	const node = new Ceneo();

	beforeEach(() => {
		resetTokenCache();
	});

	it('should list categories (v3)', async () => {
		const mock = createCeneoMock({
			resource: 'category',
			operation: 'list',
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce(TEST_TOKEN)
			.mockResolvedValueOnce([{ categoryId: 1, name: 'Elektronika' }]);

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ categoryId: 1, name: 'Elektronika' });

		const secondCall = (mock.helpers.httpRequest as jest.Mock).mock.calls[1][0];
		expect(secondCall.url).toContain('/api/v3/GetCategories');
	});
});

describe('Account Operations', () => {
	const node = new Ceneo();

	beforeEach(() => {
		resetTokenCache();
	});

	it('should get execution limits (v2)', async () => {
		const mock = createCeneoMock({
			resource: 'account',
			operation: 'getLimits',
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockResolvedValueOnce({ dailyLimit: 1000, remaining: 950 });

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ dailyLimit: 1000, remaining: 950 });

		const callArgs = (mock.helpers.httpRequest as jest.Mock).mock.calls[0][0];
		expect(callArgs.url).toContain('GetExecutionLimits');
	});
});

describe('Error Handling', () => {
	const node = new Ceneo();

	beforeEach(() => {
		resetTokenCache();
	});

	it('should handle API errors as NodeApiError', async () => {
		const mock = createCeneoMock({
			resource: 'account',
			operation: 'getLimits',
		});
		(mock.helpers.httpRequest as jest.Mock)
			.mockRejectedValueOnce(new Error('Unauthorized'));

		await expect(node.execute.call(mock)).rejects.toThrow('Ceneo API');
	});
});
