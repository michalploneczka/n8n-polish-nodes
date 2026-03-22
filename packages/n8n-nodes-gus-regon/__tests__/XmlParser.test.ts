import * as fs from 'fs';
import * as path from 'path';
import { unsoapResult, parseSearchResponse, parseReportResponse } from '../nodes/GusRegon/XmlParser';

const fixture = (name: string) =>
	fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8');

describe('XmlParser', () => {
	describe('unsoapResult', () => {
		it('should extract session ID from login response', () => {
			const result = unsoapResult(fixture('zaloguj-response.xml'));
			expect(result).toBe('test-session-id-12345');
		});

		it('should extract logout result', () => {
			const result = unsoapResult(fixture('wyloguj-response.xml'));
			expect(result).toBe('true');
		});

		it('should return empty string for empty result', () => {
			const result = unsoapResult(fixture('empty-response.xml'));
			expect(result).toBe('');
		});
	});

	describe('parseSearchResponse', () => {
		it('should parse NIP search result with company data', () => {
			const results = parseSearchResponse(fixture('search-nip-response.xml'));
			expect(results).toHaveLength(1);
			expect(results[0].Nip).toBe('1234567890');
			expect(results[0].Regon).toBe('012345678');
			expect(results[0].Nazwa).toBe('EXAMPLE SP. Z O.O.');
			expect(results[0].Typ).toBe('P');
		});

		it('should parse REGON search result', () => {
			const results = parseSearchResponse(fixture('search-regon-response.xml'));
			expect(results).toHaveLength(1);
			expect(results[0].Regon).toBe('987654321');
		});

		it('should parse KRS search result', () => {
			const results = parseSearchResponse(fixture('search-krs-response.xml'));
			expect(results).toHaveLength(1);
			expect(results[0].Nip).toBe('1112223330');
		});

		it('should return empty array for empty response', () => {
			const results = parseSearchResponse(fixture('empty-response.xml'));
			expect(results).toEqual([]);
		});

		it('should handle PKD response as array (multiple dane elements)', () => {
			const results = parseSearchResponse(fixture('full-report-pkd-response.xml'));
			expect(results).toHaveLength(2);
			expect(results[0].praw_pkdKod).toBe('6201Z');
			expect(results[1].praw_pkdKod).toBe('6202Z');
		});
	});

	describe('parseReportResponse', () => {
		it('should parse full report for legal entity', () => {
			const result = parseReportResponse(fixture('full-report-prawna-response.xml'));
			expect(result.praw_regon9).toBe('012345678');
			expect(result.praw_nip).toBe('1234567890');
			expect(result.praw_nazwa).toBe('EXAMPLE SP. Z O.O.');
			expect(result.praw_adSiedzMiejscowosc_Nazwa).toBe('Warszawa');
		});

		it('should return empty object for empty response', () => {
			const result = parseReportResponse(fixture('empty-response.xml'));
			expect(result).toEqual({});
		});
	});
});
