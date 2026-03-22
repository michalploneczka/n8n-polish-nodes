import { decodeXML } from 'entities';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ parseTagValue: false });

/**
 * Extract the Result content from a SOAP envelope using regex.
 * Returns empty string for "not found" responses (empty Result element).
 */
export function unsoapResult(soapXml: string): string {
	const match = /<\S+Result>(.+)<\/\S+Result>/s.exec(soapXml);
	if (!match?.[1]) return '';
	return match[1];
}

/**
 * Parse a DaneSzukajPodmioty SOAP response into an array of company records.
 * Handles double-encoded CDATA: HTML-decode then XML-parse.
 * Always returns an array, even for single results.
 */
export function parseSearchResponse(
	soapXml: string,
): Record<string, string>[] {
	const raw = unsoapResult(soapXml);
	if (!raw.trim()) return [];
	const decoded = decodeXML(raw);
	const parsed = parser.parse(decoded);
	const dane = parsed?.root?.dane;
	if (!dane) return [];
	return Array.isArray(dane) ? dane : [dane];
}

/**
 * Parse a DanePobierzPelnyRaport SOAP response into a single record object.
 * Same double-decode pipeline but returns a single object (not array).
 */
export function parseReportResponse(
	soapXml: string,
): Record<string, string> {
	const raw = unsoapResult(soapXml);
	if (!raw.trim()) return {};
	const decoded = decodeXML(raw);
	const parsed = parser.parse(decoded);
	const dane = parsed?.root?.dane;
	return dane || parsed?.root || {};
}
