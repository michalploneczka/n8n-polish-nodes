// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { createMockExecuteFunctions } from '@n8n-polish-nodes/test-utils';
import { Inpost } from '../nodes/Inpost/Inpost.node';
import { InpostApi } from '../credentials/InpostApi.credentials';

const BASE_URL = 'https://sandbox-api-shipx-pl.easypack24.net';
const MOCK_CREDENTIALS = {
	apiToken: 'test-token',
	organizationId: '12345',
	environment: 'sandbox',
};

function createInpostMock(
	params: Record<string, unknown>,
	continueBool = false,
) {
	const mock = createMockExecuteFunctions(params, undefined, continueBool);
	mock.getCredentials = jest.fn().mockResolvedValue(MOCK_CREDENTIALS);
	mock.helpers.httpRequest = jest.fn();
	mock.helpers.prepareBinaryData = jest.fn();
	return mock;
}

describe('Node Description', () => {
	const node = new Inpost();
	const { description } = node;

	it('should have correct name and displayName', () => {
		expect(description.name).toBe('inpost');
		expect(description.displayName).toBe('InPost ShipX');
	});

	it('should have all resources: shipment, point, tracking', () => {
		const resourceProp = description.properties.find(
			(p) => p.name === 'resource' && p.type === 'options',
		);
		expect(resourceProp).toBeDefined();
		const values = (resourceProp!.options as Array<{ value: string }>).map(
			(o) => o.value,
		);
		expect(values).toContain('shipment');
		expect(values).toContain('point');
		expect(values).toContain('tracking');
	});

	it('should have credential inpostApi', () => {
		expect(description.credentials).toBeDefined();
		expect(description.credentials![0].name).toBe('inpostApi');
	});

	it('should use execute method', () => {
		expect(typeof node.execute).toBe('function');
	});
});

describe('Credentials', () => {
	const creds = new InpostApi();

	it('has name inpostApi', () => {
		expect(creds.name).toBe('inpostApi');
	});

	it('has apiToken, organizationId, environment properties', () => {
		const propNames = creds.properties.map((p) => p.name);
		expect(propNames).toContain('apiToken');
		expect(propNames).toContain('organizationId');
		expect(propNames).toContain('environment');
	});
});

describe('Shipment Operations', () => {
	const node = new Inpost();

	it('should create a shipment', async () => {
		const mock = createInpostMock({
			resource: 'shipment',
			operation: 'create',
			service: 'inpost_locker_standard',
			targetPoint: 'KRA010',
			receiver: {
				receiverDetails: {
					name: 'Jan Kowalski',
					email: 'jan@example.com',
					phone: '500600700',
				},
			},
			parcels: {
				parcelValues: [
					{
						template: 'small',
						weight: 5,
						isNonStandard: false,
					},
				],
			},
			additionalFields: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			id: 101,
			status: 'created',
			service: 'inpost_locker_standard',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({
			id: 101,
			status: 'created',
			service: 'inpost_locker_standard',
		});
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `${BASE_URL}/v1/organizations/12345/shipments`,
				method: 'POST',
				body: expect.objectContaining({
					service: 'inpost_locker_standard',
					receiver: expect.objectContaining({
						name: 'Jan Kowalski',
						phone: '500600700',
					}),
					parcels: expect.arrayContaining([
						expect.objectContaining({
							template: 'small',
							weight: { amount: 5, unit: 'kg' },
						}),
					]),
					custom_attributes: expect.objectContaining({
						target_point: 'KRA010',
					}),
				}),
			}),
		);
	});

	it('should get a shipment', async () => {
		const mock = createInpostMock({
			resource: 'shipment',
			operation: 'get',
			shipmentId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			id: 123,
			status: 'delivered',
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ id: 123, status: 'delivered' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `${BASE_URL}/v1/shipments/123`,
				method: 'GET',
			}),
		);
	});

	it('should list shipments', async () => {
		const mock = createInpostMock({
			resource: 'shipment',
			operation: 'getAll',
			returnAll: false,
			limit: 50,
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			items: [{ id: 1 }, { id: 2 }],
			total_pages: 1,
			count: 2,
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(2);
		expect(result[0][0].json).toEqual({ id: 1 });
		expect(result[0][1].json).toEqual({ id: 2 });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining(`${BASE_URL}/v1/organizations/12345/shipments`),
				method: 'GET',
				qs: expect.objectContaining({
					page: 1,
					per_page: 25,
				}),
			}),
		);
	});

	it('should cancel a shipment', async () => {
		const mock = createInpostMock({
			resource: 'shipment',
			operation: 'cancel',
			shipmentId: '123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({ success: true, shipmentId: '123' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `${BASE_URL}/v1/organizations/12345/shipments/123`,
				method: 'DELETE',
			}),
		);
	});

	it('should get label as binary PDF', async () => {
		const pdfBuffer = Buffer.from('fake-pdf-content');
		const mock = createInpostMock({
			resource: 'shipment',
			operation: 'getLabel',
			shipmentId: '123',
			labelFormat: 'normal',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce(pdfBuffer);
		(mock.helpers.prepareBinaryData as jest.Mock).mockResolvedValueOnce({
			data: 'binary-base64',
			mimeType: 'application/pdf',
			fileName: 'label-123.pdf',
		});

		const result = await node.execute.call(mock);

		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `${BASE_URL}/v1/organizations/12345/shipments/123/label`,
				method: 'GET',
				qs: expect.objectContaining({
					format: 'pdf',
					type: 'normal',
				}),
				encoding: 'arraybuffer',
				json: false,
			}),
		);
		expect(mock.helpers.prepareBinaryData).toHaveBeenCalledWith(
			expect.any(Buffer),
			'label-123.pdf',
			'application/pdf',
		);
		expect(result[0]).toHaveLength(1);
		expect(result[0][0].binary).toBeDefined();
		expect(result[0][0].binary!.data).toBeDefined();
	});
});

describe('Point Operations', () => {
	const node = new Inpost();

	it('should get a point', async () => {
		const mock = createInpostMock({
			resource: 'point',
			operation: 'get',
			pointName: 'KRA010',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			name: 'KRA010',
			type: 'parcel_locker',
			address: { city: 'Krakow' },
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual({
			name: 'KRA010',
			type: 'parcel_locker',
			address: { city: 'Krakow' },
		});
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `${BASE_URL}/v1/points/KRA010`,
				method: 'GET',
			}),
		);
	});

	it('should list points', async () => {
		const mock = createInpostMock({
			resource: 'point',
			operation: 'getAll',
			returnAll: false,
			limit: 50,
			filters: {},
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			items: [{ name: 'KRA010' }, { name: 'WAW001' }],
			total_pages: 1,
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(2);
		expect(result[0][0].json).toEqual({ name: 'KRA010' });
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: expect.stringContaining(`${BASE_URL}/v1/points`),
				method: 'GET',
			}),
		);
	});
});

describe('Tracking', () => {
	const node = new Inpost();

	it('should get tracking status', async () => {
		const mock = createInpostMock({
			resource: 'tracking',
			operation: 'get',
			trackingNumber: 'TRACK123',
		});
		(mock.helpers.httpRequest as jest.Mock).mockResolvedValueOnce({
			tracking_number: 'TRACK123',
			status: 'delivered',
			tracking_details: [{ status: 'delivered', datetime: '2026-03-23T10:00:00Z' }],
		});

		const result = await node.execute.call(mock);

		expect(result[0]).toHaveLength(1);
		expect(result[0][0].json).toEqual(
			expect.objectContaining({
				tracking_number: 'TRACK123',
				status: 'delivered',
			}),
		);
		expect(mock.helpers.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				url: `${BASE_URL}/v1/tracking/TRACK123`,
				method: 'GET',
			}),
		);
	});
});

describe('Error Handling', () => {
	const node = new Inpost();

	it('should throw NodeApiError on API error', async () => {
		const mock = createInpostMock({
			resource: 'shipment',
			operation: 'get',
			shipmentId: '999',
		});
		(mock.helpers.httpRequest as jest.Mock).mockRejectedValueOnce({
			message: 'Shipment not found',
			statusCode: 404,
		});

		await expect(node.execute.call(mock)).rejects.toThrow();
	});

	it('should handle continueOnFail', async () => {
		const mock = createInpostMock(
			{
				resource: 'shipment',
				operation: 'get',
				shipmentId: '999',
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
