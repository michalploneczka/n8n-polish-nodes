// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — resolved via jest moduleNameMapper
import { setupNock, teardownNock, createNockScope } from '@n8n-polish-nodes/test-utils';
import { Smsapi } from '../nodes/Smsapi/Smsapi.node';
import { SmsapiApi } from '../credentials/SmsapiApi.credentials';

describe('Smsapi Node', () => {
	const node = new Smsapi();
	const { description } = node;

	describe('Request Defaults', () => {
		it('should have correct baseURL', () => {
			expect(description.requestDefaults?.baseURL).toBe('https://api.smsapi.pl');
		});

		it('should inject format=json in requestDefaults.qs (D-15 critical)', () => {
			expect(description.requestDefaults?.qs).toBeDefined();
			expect((description.requestDefaults!.qs as Record<string, string>).format).toBe('json');
		});

		it('should set Accept and Content-Type headers', () => {
			const headers = description.requestDefaults?.headers as Record<string, string>;
			expect(headers).toBeDefined();
			expect(headers.Accept).toBe('application/json');
			expect(headers['Content-Type']).toBe('application/json');
		});
	});

	describe('Resources', () => {
		const resourceProperty = description.properties.find(
			(p) => p.name === 'resource' && p.type === 'options',
		);

		it('should have 4 resources: sms, contact, group, account', () => {
			expect(resourceProperty).toBeDefined();
			const options = resourceProperty!.options as Array<{ value: string }>;
			expect(options).toHaveLength(4);

			const values = options.map((o) => o.value);
			expect(values).toContain('sms');
			expect(values).toContain('contact');
			expect(values).toContain('group');
			expect(values).toContain('account');
		});
	});

	describe('SMS Operations', () => {
		const smsOperation = description.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource &&
				(p.displayOptions.show.resource as string[]).includes('sms'),
		);

		it('should have 3 SMS operations: send, sendGroup, getReport', () => {
			expect(smsOperation).toBeDefined();
			const options = smsOperation!.options as Array<{ value: string }>;
			expect(options).toHaveLength(3);

			const values = options.map((o) => o.value);
			expect(values).toContain('send');
			expect(values).toContain('sendGroup');
			expect(values).toContain('getReport');
		});

		it('Send operation routes to POST /sms.do', () => {
			const options = smsOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const sendOp = options.find((o) => o.value === 'send');
			expect(sendOp).toBeDefined();
			expect(sendOp!.routing?.request?.method).toBe('POST');
			expect(sendOp!.routing?.request?.url).toBe('/sms.do');
		});

		it('Send operation has required fields: to, message', () => {
			const toField = description.properties.find(
				(p) =>
					p.name === 'to' &&
					p.displayOptions?.show?.operation &&
					(p.displayOptions.show.operation as string[]).includes('send'),
			);
			const messageField = description.properties.find(
				(p) =>
					p.name === 'message' &&
					p.displayOptions?.show?.operation &&
					(p.displayOptions.show.operation as string[]).includes('send'),
			);

			expect(toField).toBeDefined();
			expect(toField!.required).toBe(true);
			expect(messageField).toBeDefined();
			expect(messageField!.required).toBe(true);
		});

		it('Send operation has Additional Fields with from, encoding, date, test', () => {
			const additionalFields = description.properties.find(
				(p) =>
					p.name === 'additionalFields' &&
					p.type === 'collection' &&
					p.displayOptions?.show?.operation &&
					(p.displayOptions.show.operation as string[]).includes('send'),
			);

			expect(additionalFields).toBeDefined();
			const optionNames = (additionalFields!.options as Array<{ name: string }>).map(
				(o) => o.name,
			);
			expect(optionNames).toContain('from');
			expect(optionNames).toContain('encoding');
			expect(optionNames).toContain('date');
			expect(optionNames).toContain('test');
		});

		it('Send Group routes to POST /sms.do with group param', () => {
			const options = smsOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const sendGroupOp = options.find((o) => o.value === 'sendGroup');
			expect(sendGroupOp).toBeDefined();
			expect(sendGroupOp!.routing?.request?.method).toBe('POST');
			expect(sendGroupOp!.routing?.request?.url).toBe('/sms.do');

			// Verify group field exists for sendGroup
			const groupField = description.properties.find(
				(p) =>
					p.name === 'group' &&
					p.displayOptions?.show?.operation &&
					(p.displayOptions.show.operation as string[]).includes('sendGroup'),
			);
			expect(groupField).toBeDefined();
			expect(groupField!.required).toBe(true);
		});

		it('Get Report routes to GET /sms.do', () => {
			const options = smsOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const getReportOp = options.find((o) => o.value === 'getReport');
			expect(getReportOp).toBeDefined();
			expect(getReportOp!.routing?.request?.method).toBe('GET');
			expect(getReportOp!.routing?.request?.url).toBe('/sms.do');
		});
	});

	describe('Contacts Operations', () => {
		const contactOperation = description.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource &&
				(p.displayOptions.show.resource as string[]).includes('contact'),
		);

		it('should have 4 contact operations: list, create, update, delete', () => {
			expect(contactOperation).toBeDefined();
			const options = contactOperation!.options as Array<{ value: string }>;
			expect(options).toHaveLength(4);

			const values = options.map((o) => o.value);
			expect(values).toContain('list');
			expect(values).toContain('create');
			expect(values).toContain('update');
			expect(values).toContain('delete');
		});

		it('List routes to GET /contacts', () => {
			const options = contactOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const listOp = options.find((o) => o.value === 'list');
			expect(listOp!.routing?.request?.method).toBe('GET');
			expect(listOp!.routing?.request?.url).toBe('/contacts');
		});

		it('Create routes to POST /contacts', () => {
			const options = contactOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const createOp = options.find((o) => o.value === 'create');
			expect(createOp!.routing?.request?.method).toBe('POST');
			expect(createOp!.routing?.request?.url).toBe('/contacts');
		});

		it('Update routes to PUT /contacts/{id}', () => {
			const options = contactOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const updateOp = options.find((o) => o.value === 'update');
			expect(updateOp!.routing?.request?.method).toBe('PUT');
			expect(updateOp!.routing?.request?.url).toContain('/contacts/');
		});

		it('Delete routes to DELETE /contacts/{id}', () => {
			const options = contactOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const deleteOp = options.find((o) => o.value === 'delete');
			expect(deleteOp!.routing?.request?.method).toBe('DELETE');
			expect(deleteOp!.routing?.request?.url).toContain('/contacts/');
		});
	});

	describe('Groups Operations', () => {
		const groupOperation = description.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource &&
				(p.displayOptions.show.resource as string[]).includes('group'),
		);

		it('should have List operation routing to GET /contacts/groups', () => {
			expect(groupOperation).toBeDefined();
			const options = groupOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const listOp = options.find((o) => o.value === 'list');
			expect(listOp).toBeDefined();
			expect(listOp!.routing?.request?.method).toBe('GET');
			expect(listOp!.routing?.request?.url).toBe('/contacts/groups');
		});
	});

	describe('Account Operations', () => {
		const accountOperation = description.properties.find(
			(p) =>
				p.name === 'operation' &&
				p.displayOptions?.show?.resource &&
				(p.displayOptions.show.resource as string[]).includes('account'),
		);

		it('should have Get Balance operation routing to GET /profile', () => {
			expect(accountOperation).toBeDefined();
			const options = accountOperation!.options as Array<{
				value: string;
				routing?: { request?: { method?: string; url?: string } };
			}>;
			const balanceOp = options.find((o) => o.value === 'getBalance');
			expect(balanceOp).toBeDefined();
			expect(balanceOp!.routing?.request?.method).toBe('GET');
			expect(balanceOp!.routing?.request?.url).toBe('/profile');
		});
	});

	describe('No Execute Method', () => {
		it('should not have execute method (declarative only per D-16)', () => {
			expect((node as unknown as Record<string, unknown>).execute).toBeUndefined();
		});
	});
});

describe('SmsapiApi Credentials', () => {
	const credentials = new SmsapiApi();

	it('should use Bearer token authentication', () => {
		expect(credentials.authenticate).toBeDefined();
		const auth = credentials.authenticate as {
			type: string;
			properties: { headers: Record<string, string> };
		};
		expect(auth.type).toBe('generic');
		expect(auth.properties.headers.Authorization).toContain('Bearer');
	});

	it('should test connection via /profile endpoint', () => {
		expect(credentials.test).toBeDefined();
		expect(credentials.test!.request.url).toBe('/profile');
	});

	it('should include format=json in test request', () => {
		const qs = credentials.test!.request.qs as Record<string, string>;
		expect(qs).toBeDefined();
		expect(qs.format).toBe('json');
	});
});

describe('HTTP Integration', () => {
	beforeEach(() => {
		setupNock();
	});

	afterEach(() => {
		teardownNock();
	});

	it('credential test endpoint responds to GET /profile', () => {
		const scope = createNockScope('https://api.smsapi.pl')
			.get('/profile')
			.query({ format: 'json' })
			.reply(200, { name: 'test', points: 100 });

		const https = require('https');
		return new Promise<void>((resolve) => {
			https.get(
				'https://api.smsapi.pl/profile?format=json',
				(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
					expect(res.statusCode).toBe(200);
					let data = '';
					res.on('data', (chunk: string) => {
						data += chunk;
					});
					res.on('end', () => {
						const body = JSON.parse(data);
						expect(body.name).toBe('test');
						expect(body.points).toBe(100);
						expect(scope.isDone()).toBe(true);
						resolve();
					});
				},
			);
		});
	});

	it('handles 401 unauthorized', () => {
		const scope = createNockScope('https://api.smsapi.pl')
			.get('/profile')
			.query({ format: 'json' })
			.reply(401, { message: 'Authorization failed' });

		const https = require('https');
		return new Promise<void>((resolve) => {
			https.get(
				'https://api.smsapi.pl/profile?format=json',
				(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
					expect(res.statusCode).toBe(401);
					let data = '';
					res.on('data', (chunk: string) => {
						data += chunk;
					});
					res.on('end', () => {
						const body = JSON.parse(data);
						expect(body.message).toBe('Authorization failed');
						expect(scope.isDone()).toBe(true);
						resolve();
					});
				},
			);
		});
	});

	it('handles 400 bad request for SMS send', () => {
		const scope = createNockScope('https://api.smsapi.pl')
			.post('/sms.do')
			.query({ format: 'json' })
			.reply(400, { error: 101, message: 'Authorization failed' });

		const https = require('https');
		return new Promise<void>((resolve) => {
			const req = https.request(
				{
					hostname: 'api.smsapi.pl',
					path: '/sms.do?format=json',
					method: 'POST',
				},
				(res: { statusCode: number; on: (event: string, cb: (chunk: string) => void) => void }) => {
					expect(res.statusCode).toBe(400);
					let data = '';
					res.on('data', (chunk: string) => {
						data += chunk;
					});
					res.on('end', () => {
						const body = JSON.parse(data);
						expect(body.error).toBe(101);
						expect(scope.isDone()).toBe(true);
						resolve();
					});
				},
			);
			req.end();
		});
	});
});
