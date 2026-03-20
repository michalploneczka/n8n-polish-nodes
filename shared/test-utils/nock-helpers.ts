import nock from 'nock';

export function setupNock(): void {
	nock.disableNetConnect();
}

export function teardownNock(): void {
	nock.cleanAll();
	nock.enableNetConnect();
}

export function createNockScope(baseUrl: string): nock.Scope {
	return nock(baseUrl);
}
