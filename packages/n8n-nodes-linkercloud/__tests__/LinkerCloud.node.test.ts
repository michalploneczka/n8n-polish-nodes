import { LinkerCloud } from '../nodes/LinkerCloud/LinkerCloud.node';
import { LinkerCloudApi } from '../credentials/LinkerCloudApi.credentials';

describe('LinkerCloud Node', () => {
	let linkerCloud: LinkerCloud;

	beforeEach(() => {
		linkerCloud = new LinkerCloud();
	});

	describe('Node Description', () => {
		it('should have correct node metadata', () => {
			expect(linkerCloud.description.displayName).toBe('Linker Cloud');
			expect(linkerCloud.description.name).toBe('linkerCloud');
			expect(linkerCloud.description.credentials).toEqual([
				{ name: 'linkerCloudApi', required: true },
			]);
		});

		it('should define all 6 resources', () => {
			const resourceProp = linkerCloud.description.properties.find(
				(p) => p.name === 'resource',
			);
			expect(resourceProp).toBeDefined();
			expect(resourceProp!.type).toBe('options');
			const options = (resourceProp as any).options.map((o: any) => o.value);
			expect(options).toContain('order');
			expect(options).toContain('product');
			expect(options).toContain('stock');
			expect(options).toContain('shipment');
			expect(options).toContain('inboundOrder');
			expect(options).toContain('orderReturn');
		});
	});

	describe('Order Operations', () => {
		it.todo('should list orders with pagination');
		it.todo('should get a single order by ID');
		it.todo('should create an order with required fields');
		it.todo('should update an order');
		it.todo('should cancel an order');
		it.todo('should update tracking number for an order');
		it.todo('should update payment status for an order');
		it.todo('should get allowed transitions for an order');
		it.todo('should apply a state transition to an order');
	});

	describe('Product Operations', () => {
		it.todo('should list products with pagination');
		it.todo('should create a product with boolean and array defaults');
		it.todo('should update a product');
	});

	describe('Stock Operations', () => {
		it.todo('should list stock levels');
		it.todo('should batch update stock by SKU');
	});

	describe('Shipment Operations', () => {
		it.todo('should create a shipment with packages array');
		it.todo('should create a shipment by order number');
		it.todo('should download a label as binary PDF');
		it.todo('should get delivery status');
		it.todo('should cancel selected packages via PATCH');
	});

	describe('Inbound Order Operations', () => {
		it.todo('should list inbound orders');
		it.todo('should get a single inbound order');
		it.todo('should create an inbound order with supplier data and items');
		it.todo('should update an inbound order');
		it.todo('should confirm inbound orders');
	});

	describe('Order Return Operations', () => {
		it.todo('should list order returns');
		it.todo('should get a single order return');
		it.todo('should create an order return');
		it.todo('should accept an order return');
	});

	describe('Error Handling', () => {
		it.todo('should throw NodeApiError on API failure');
		it.todo('should continue on fail when configured');
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
