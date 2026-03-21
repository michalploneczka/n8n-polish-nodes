import { FakturowniaApi } from '../credentials/FakturowniaApi.credentials';

describe('Fakturownia Node', () => {
	describe('Credentials', () => {
		it('should have name fakturowniaApi', () => {
			const creds = new FakturowniaApi();
			expect(creds.name).toBe('fakturowniaApi');
		});

		it('should have apiToken and subdomain properties', () => {
			const creds = new FakturowniaApi();
			const propNames = creds.properties.map((p) => p.name);
			expect(propNames).toContain('apiToken');
			expect(propNames).toContain('subdomain');
		});

		it('should have test request pointing to account.json', () => {
			const creds = new FakturowniaApi();
			expect((creds.test as any).request.url).toContain('account.json');
		});
	});

	// Placeholder describes for Plans 02-04 to fill in
	describe('Invoice Operations', () => {
		it.todo('list invoices');
		it.todo('get invoice');
		it.todo('create invoice');
		it.todo('update invoice');
		it.todo('delete invoice');
		it.todo('send invoice by email');
		it.todo('download invoice PDF');
	});

	describe('Client Operations', () => {
		it.todo('list clients');
		it.todo('get client');
		it.todo('create client');
	});

	describe('Product Operations', () => {
		it.todo('list products');
		it.todo('create product');
	});

	describe('Error Handling', () => {
		it.todo('wraps API errors in NodeApiError');
		it.todo('continues on fail when configured');
	});
});
