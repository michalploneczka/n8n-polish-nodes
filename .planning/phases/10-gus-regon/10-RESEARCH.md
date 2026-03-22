# Phase 10: GUS REGON - Research

**Researched:** 2026-03-22
**Domain:** SOAP/XML API integration, GUS BIR1 (Baza Internetowa REGON)
**Confidence:** HIGH

## Summary

The GUS REGON BIR API is a SOAP 1.2 web service exposing Poland's official business registry (REGON). It requires session-based authentication: login with API key to get a session ID (sid), send sid as HTTP header on subsequent requests, then logout. Responses contain HTML-encoded XML inside CDATA sections within the SOAP envelope -- this double-encoding is the primary technical challenge.

The `bir1` npm package (v4.1.1) provides a proven reference implementation in TypeScript that uses `fast-xml-parser` + `entities` (for HTML decoding). Its source code reveals the exact SOAP envelope templates, namespaces, action URIs, and parsing pipeline. We should NOT use bir1 as a dependency (per CLAUDE.md: no SDK dependencies) but should replicate its proven patterns: template-literal SOAP envelopes, regex-based SOAP result extraction, `decodeXML()` from `entities` for HTML-encoded CDATA, and `fast-xml-parser` for inner XML parsing.

**Primary recommendation:** Build SOAP envelopes as template literals (proven approach from bir1), use `entities` + `fast-xml-parser` as dependencies for response parsing, implement transparent session management in GenericFunctions with login-before-request and logout-after pattern.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REGON-01 | Credentials -- API Key (free from dane.biznes.gov.pl) | Credential class with apiKey + environment toggle (test/production). Test key: `abcde12345abcde12345` |
| REGON-02 | SOAP session management -- DaneZaloguj -> operation -> DaneWyloguj | Proven pattern from bir1: login gets sid, sid sent as HTTP header `sid`, logout passes sid in SOAP body |
| REGON-03 | XML envelope construction and XML response parsing | Template literals for SOAP envelopes (6 templates), fast-xml-parser + entities for parsing |
| REGON-04 | Search by NIP | DaneSzukajPodmioty with `<dat:Nip>` parameter in DataContract namespace |
| REGON-05 | Search by REGON | DaneSzukajPodmioty with `<dat:Regon>` parameter |
| REGON-06 | Search by KRS | DaneSzukajPodmioty with `<dat:Krs>` parameter |
| REGON-07 | Get full data + PKD codes | DanePobierzPelnyRaport with regon + report type name. Multiple report types for different entity types |
| REGON-08 | Programmatic style -- SOAP requires execute() | Standard programmatic pattern matching LinkerCloud/Fakturownia nodes |
| REGON-09 | Tests, package.json, codex, icon, README | Nock tests with SOAP/XML fixtures, mock httpRequest to return SOAP XML strings |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fast-xml-parser | 5.5.8 | Parse inner XML from CDATA content to JSON | Used by bir1 reference impl; lightweight, no native deps, handles Polish chars |
| entities | 8.0.0 | HTML-decode CDATA content (decodeXML function) | SOAP responses contain HTML-encoded XML; entities is what bir1 uses for this |
| n8n-workflow | * (peer) | n8n type definitions, NodeApiError | Standard for all n8n community nodes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| nock | (devDep, workspace) | HTTP mocking for tests | Test SOAP request/response cycles |
| @n8n/node-cli | * (devDep) | Build, lint, dev mode | Standard build tooling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Template literals for SOAP | `soap` npm package | soap pkg is heavy (250KB+), adds WSDL parsing we don't need. Template literals proven by bir1 |
| `entities` for HTML decode | Manual regex replace | entities handles all HTML entities including edge cases; regex is fragile |
| fast-xml-parser | xml2js | fast-xml-parser is faster, smaller, actively maintained, bir1-proven |

**Installation:**
```bash
npm install fast-xml-parser entities
```

**Note:** fast-xml-parser and entities are runtime dependencies (not devDependencies) because they are needed during n8n node execution.

## Architecture Patterns

### Recommended Project Structure
```
packages/n8n-nodes-gus-regon/
├── nodes/
│   └── GusRegon/
│       ├── GusRegon.node.ts          # Main node (programmatic execute)
│       ├── GusRegon.node.json        # Codex metadata
│       ├── GenericFunctions.ts       # SOAP session + HTTP helpers
│       ├── SoapTemplates.ts          # All SOAP envelope template functions
│       ├── XmlParser.ts              # Response parsing: unsoap -> decode -> parse -> flatten
│       └── resources/
│           └── company.ts            # Resource operations + fields definitions
├── credentials/
│   └── GusRegonApi.credentials.ts    # API Key + environment toggle
├── icons/
│   └── gus-regon.svg                 # GUS logo 60x60
├── __tests__/
│   ├── GusRegon.node.test.ts         # Integration tests with mocked HTTP
│   ├── XmlParser.test.ts             # Unit tests for XML parsing pipeline
│   └── fixtures/                     # SOAP XML response fixtures
│       ├── zaloguj-response.xml
│       ├── search-nip-response.xml
│       ├── search-regon-response.xml
│       ├── search-krs-response.xml
│       ├── full-report-prawna-response.xml
│       ├── full-report-fizyczna-response.xml
│       └── error-response.xml
├── package.json
├── tsconfig.json
├── jest.config.js
├── eslint.config.mjs
└── README.md
```

### Pattern 1: SOAP Envelope Templates (Template Literals)
**What:** Each SOAP action has a dedicated template-literal function that produces the XML envelope string.
**When to use:** Every SOAP request.
**Example:**
```typescript
// Source: bir1 npm package (v4.1.1) src/templates/
const PROD_URL = 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const TEST_URL = 'https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc';
const NS = 'http://CIS/BIR/PUBL/2014/07';
const NS_DAT = 'http://CIS/BIR/PUBL/2014/07/DataContract';

export function zalogujEnvelope(url: string, apiKey: string): string {
  return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/Zaloguj</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:Zaloguj>
      <ns:pKluczUzytkownika>${apiKey}</ns:pKluczUzytkownika>
    </ns:Zaloguj>
  </soap:Body>
</soap:Envelope>`;
}

export function daneSzukajPodmiotyEnvelope(
  url: string,
  params: { nip?: string; regon?: string; krs?: string },
): string {
  return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}" xmlns:dat="${NS_DAT}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/DaneSzukajPodmioty</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:DaneSzukajPodmioty>
      <ns:pParametryWyszukiwania>
        ${params.nip ? `<dat:Nip>${params.nip}</dat:Nip>` : ''}
        ${params.regon ? `<dat:Regon>${params.regon}</dat:Regon>` : ''}
        ${params.krs ? `<dat:Krs>${params.krs}</dat:Krs>` : ''}
      </ns:pParametryWyszukiwania>
    </ns:DaneSzukajPodmioty>
  </soap:Body>
</soap:Envelope>`;
}
```

### Pattern 2: Double-Decode Response Pipeline
**What:** SOAP response -> regex extract Result -> HTML-decode -> XML parse -> flatten to JSON
**When to use:** Every SOAP response.
**Example:**
```typescript
// Source: bir1 npm package extract.js
import { decodeXML } from 'entities';
import { XMLParser } from 'fast-xml-parser';

// Step 1: Extract the Result content from SOAP envelope
function unsoapResult(soapXml: string): string {
  const match = /<\S+Result>(.+)<\/\S+Result>/s.exec(soapXml);
  if (!match?.[1]) throw new Error('Empty SOAP response');
  return match[1];
}

// Step 2: HTML-decode the extracted content (CDATA contains HTML-encoded XML)
// Step 3: Parse inner XML to JS object
const parser = new XMLParser({ parseTagValue: false });

function parseResponse(soapXml: string): Record<string, string> {
  const rawResult = unsoapResult(soapXml);
  const decodedXml = decodeXML(rawResult);
  const parsed = parser.parse(decodedXml);
  return parsed.root?.dane ?? parsed;
}
```

### Pattern 3: Transparent Session Management
**What:** GenericFunctions handles login/logout automatically per execute() call.
**When to use:** Every node execution.
**Example:**
```typescript
// In GenericFunctions.ts
export async function gusRegonApiRequest(
  this: IExecuteFunctions,
  soapBody: string,
): Promise<string> {
  const credentials = await this.getCredentials('gusRegonApi');
  const isProd = credentials.environment === 'production';
  const baseUrl = isProd ? PROD_URL : TEST_URL;

  // 1. Login
  const loginBody = zalogujEnvelope(baseUrl, credentials.apiKey as string);
  const loginResponse = await this.helpers.httpRequest({
    method: 'POST',
    url: baseUrl,
    headers: { 'Content-Type': 'application/soap+xml' },
    body: loginBody,
    returnFullResponse: false,
  });
  const sid = unsoapResult(loginResponse);

  try {
    // 2. Execute operation with sid header
    const response = await this.helpers.httpRequest({
      method: 'POST',
      url: baseUrl,
      headers: {
        'Content-Type': 'application/soap+xml',
        'sid': sid,
      },
      body: soapBody,
      returnFullResponse: false,
    });
    return response;
  } finally {
    // 3. Always logout (best-effort)
    try {
      const logoutBody = wylogujEnvelope(baseUrl, sid);
      await this.helpers.httpRequest({
        method: 'POST',
        url: baseUrl,
        headers: { 'Content-Type': 'application/soap+xml' },
        body: logoutBody,
        returnFullResponse: false,
      });
    } catch {
      // Logout failure is non-critical; session expires after 60 min
    }
  }
}
```

### Pattern 4: Report Type Selection for Full Data
**What:** DanePobierzPelnyRaport requires knowing entity type to select correct report name.
**When to use:** Get Full Data operation.
**Example flow:**
```typescript
// After DaneSzukajPodmioty returns results, check Typ field:
// Typ = 'P' -> Legal entity (osoba prawna) -> use 'PublDaneRaportPrawna'
// Typ = 'F' -> Natural person (osoba fizyczna) -> use 'PublDaneRaportFizycznaOsoba'
// Typ = 'LP' -> Local unit of legal entity -> use 'PublDaneRaportLokalnaPrawnej'
// Typ = 'LF' -> Local unit of natural person -> use 'PublDaneRaportLokalnaFizycznej'
```

### Anti-Patterns to Avoid
- **Using `soap` npm package:** Overkill for 5 fixed endpoints. WSDL parsing adds unnecessary complexity and dependency weight.
- **Hardcoding test URL in templates:** bir1 hardcodes test URL -- we must parameterize for production/test toggle.
- **Skipping HTML-decode step:** The CDATA content is HTML-encoded XML (`&lt;` instead of `<`). Parsing without decoding first produces garbage.
- **Not escaping XML special chars in search params:** NIP/REGON/KRS are numeric-only so less risky, but company names in responses may contain `&`, `"`, `<` -- parser handles this.
- **Session reuse across items:** Sessions are valid 60 minutes, but simplest approach is login-per-execute, not login-per-item. One login per node execution, iterate items within that session.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML entity decoding | Custom regex for `&lt;` `&gt;` `&amp;` | `entities` package `decodeXML()` | Hundreds of HTML entities exist, regex misses edge cases |
| XML parsing | Custom regex-based XML extractor | `fast-xml-parser` XMLParser | Handles namespaces, CDATA, attributes, Polish chars correctly |
| SOAP envelope parsing | Full DOM XML parser for outer SOAP | Regex: `/<\S+Result>(.+)<\/\S+Result>/s` | SOAP envelope structure is fixed, regex is sufficient and bir1-proven |

**Key insight:** The SOAP protocol wrapper is trivially simple (5 fixed actions, fixed envelope structure). The real complexity is in the double-encoded response parsing pipeline, where established libraries (`entities` + `fast-xml-parser`) handle edge cases that hand-rolled regex cannot.

## Common Pitfalls

### Pitfall 1: Double-Encoded CDATA Responses
**What goes wrong:** API returns SOAP XML containing a `<DaneSzukajPodmiotyResult>` tag whose content is HTML-encoded XML (e.g., `&lt;root&gt;&lt;dane&gt;...`). Developers parse the SOAP envelope but get a string of HTML entities instead of structured data.
**Why it happens:** GUS API serializes inner XML as HTML-encoded string inside the SOAP result element.
**How to avoid:** Three-step pipeline: (1) regex-extract Result content, (2) `decodeXML()` to get actual XML, (3) `XMLParser.parse()` to get JSON.
**Warning signs:** Parsed result contains literal `&lt;` or `&amp;` strings.

### Pitfall 2: Wrong Content-Type Header
**What goes wrong:** HTTP 415 Unsupported Media Type error.
**Why it happens:** Using `application/xml` or `text/xml` instead of `application/soap+xml`.
**How to avoid:** Always use `Content-Type: application/soap+xml; charset=utf-8` (SOAP 1.2 requirement).
**Warning signs:** 415 status code, error mentioning `multipart/related`.

### Pitfall 3: Session ID Transmission Method
**What goes wrong:** Session authentication fails despite correct login.
**Why it happens:** sid must be sent as HTTP header `sid: {value}`, NOT in the SOAP envelope body or as a cookie.
**How to avoid:** Add `sid` to HTTP request headers object, not SOAP XML.
**Warning signs:** Error code 7 ("Brak sesji") from GetValue('KomunikatKod').

### Pitfall 4: Wrong Report Type for Entity Type
**What goes wrong:** DanePobierzPelnyRaport returns error code 4 ("Nie znaleziono podmiotow").
**Why it happens:** Using a report type for legal entities (e.g., `PublDaneRaportPrawna`) when the entity is a natural person, or vice versa.
**How to avoid:** First call DaneSzukajPodmioty to get the `Typ` field, then select report type based on Typ value (P/F/LP/LF).
**Warning signs:** Error code 4, error code 5 ("Nieprawidlowa lub pusta nazwa raportu").

### Pitfall 5: Hardcoded Test URL in Envelope Templates
**What goes wrong:** Production credentials fail because SOAP envelopes have `wsa:To` pointing to test URL.
**Why it happens:** bir1 reference implementation hardcodes test URL in templates.
**How to avoid:** Pass URL as parameter to all envelope template functions.
**Warning signs:** Works with test key but fails with production key.

### Pitfall 6: Empty Results vs Errors
**What goes wrong:** Search returns empty string in Result element but no SOAP fault.
**Why it happens:** GUS API returns empty result for "not found" instead of a proper error.
**How to avoid:** Check if Result content is empty/whitespace before attempting to parse. Return empty array for "not found".
**Warning signs:** XMLParser throws on empty string input.

## Code Examples

### SOAP Action URIs (Complete Reference)
```typescript
// Source: bir1 npm package templates
const ACTIONS = {
  zaloguj: 'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Zaloguj',
  wyloguj: 'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/Wyloguj',
  szukaj:  'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DaneSzukajPodmioty',
  raport:  'http://CIS/BIR/PUBL/2014/07/IUslugaBIRzewnPubl/DanePobierzPelnyRaport',
  getValue: 'http://CIS/BIR/2014/07/IUslugaBIR/GetValue',  // Note: different namespace!
};
```

### API URLs
```typescript
const URLS = {
  production: 'https://wyszukiwarkaregon.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc',
  test: 'https://wyszukiwarkaregontest.stat.gov.pl/wsBIR/UslugaBIRzewnPubl.svc',
};
// Test key (public, works without registration): 'abcde12345abcde12345'
```

### Namespaces
```typescript
const NAMESPACES = {
  soap: 'http://www.w3.org/2003/05/soap-envelope',
  wsa: 'http://www.w3.org/2005/08/addressing',
  ns: 'http://CIS/BIR/PUBL/2014/07',
  dat: 'http://CIS/BIR/PUBL/2014/07/DataContract',
  nsGetValue: 'http://CIS/BIR/2014/07',  // GetValue uses different namespace!
};
```

### Error Codes (from GUS API)
```typescript
// Source: bir1 npm package types.ts
const ERROR_CODES: Record<string, string> = {
  '': 'No session. Session expired or invalid sid header.',
  '0': 'Previous operation completed successfully.',
  '1': 'Code no longer current.',
  '2': 'Too many identifiers passed to DaneSzukaj.',
  '4': 'No entities found. (Common cause: wrong report name P vs F).',
  '5': 'Invalid or empty report name.',
  '7': 'No session. Session expired or invalid sid header.',
};
```

### DanePobierzPelnyRaport Envelope
```typescript
// Source: bir1 npm package templates
export function danePobierzPelnyRaportEnvelope(
  url: string,
  regon: string,
  reportName: string,
): string {
  return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="${NS}">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>${NS}/IUslugaBIRzewnPubl/DanePobierzPelnyRaport</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:DanePobierzPelnyRaport>
      <ns:pRegon>${regon}</ns:pRegon>
      <ns:pNazwaRaportu>${reportName}</ns:pNazwaRaportu>
    </ns:DanePobierzPelnyRaport>
  </soap:Body>
</soap:Envelope>`;
}
```

### Report Type Names (Subset for v1)
```typescript
// Source: bir1 npm package types.d.ts
// For initial implementation, support these common report types:
const REPORT_TYPES = {
  // Legal entities (Typ = 'P')
  legalEntity: 'PublDaneRaportPrawna',
  legalEntityPkd: 'PublDaneRaportDzialalnosciPrawnej',
  // Natural persons / sole proprietors (Typ = 'F')
  naturalPerson: 'PublDaneRaportFizycznaOsoba',
  naturalPersonCeidg: 'PublDaneRaportDzialalnoscFizycznejCeidg',
  naturalPersonPkd: 'PublDaneRaportDzialalnosciFizycznej',
  // Entity type detection
  entityType: 'PublDaneRaportTypJednostki',
} as const;
```

### Credential Test Pattern (using GetValue)
```typescript
// GetValue with 'StatusUslugi' can verify API connectivity without full search
// GetValue uses DIFFERENT namespace: http://CIS/BIR/2014/07 (not PUBL)
export function getValueEnvelope(url: string, paramName: string): string {
  return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ns="http://CIS/BIR/2014/07">
  <soap:Header xmlns:wsa="http://www.w3.org/2005/08/addressing">
    <wsa:To>${url}</wsa:To>
    <wsa:Action>http://CIS/BIR/2014/07/IUslugaBIR/GetValue</wsa:Action>
  </soap:Header>
  <soap:Body>
    <ns:GetValue>
      <ns:pNazwaParametru>${paramName}</ns:pNazwaParametru>
    </ns:GetValue>
  </soap:Body>
</soap:Envelope>`;
}
```

### Nock Test Pattern for SOAP
```typescript
// Testing SOAP requests with nock requires matching POST body content
import nock from 'nock';

const SOAP_RESPONSE_SEARCH = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope">
  <s:Body>
    <DaneSzukajPodmiotyResponse xmlns="http://CIS/BIR/PUBL/2014/07">
      <DaneSzukajPodmiotyResult>&lt;root&gt;&lt;dane&gt;&lt;Regon&gt;012345678&lt;/Regon&gt;&lt;Nip&gt;1234567890&lt;/Nip&gt;&lt;Nazwa&gt;EXAMPLE SP&amp;Oacute;&amp;#321;KA Z O.O.&lt;/Nazwa&gt;&lt;Typ&gt;P&lt;/Typ&gt;&lt;/dane&gt;&lt;/root&gt;</DaneSzukajPodmiotyResult>
    </DaneSzukajPodmiotyResponse>
  </s:Body>
</s:Envelope>`;

// Login mock
nock(TEST_URL)
  .post('', (body: string) => body.includes('Zaloguj'))
  .reply(200, LOGIN_RESPONSE, { 'Content-Type': 'application/soap+xml' });

// Search mock (requires sid header)
nock(TEST_URL, { reqheaders: { sid: 'test-session-id' } })
  .post('', (body: string) => body.includes('DaneSzukajPodmioty'))
  .reply(200, SOAP_RESPONSE_SEARCH, { 'Content-Type': 'application/soap+xml' });
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SOAP 1.1 with text/xml | SOAP 1.2 with application/soap+xml | GUS BIR has always used 1.2 | Must use correct Content-Type |
| Full WSDL client (soap npm) | Template literals for known endpoints | Common in modern Node.js SOAP integrations | Much lighter, no WSDL parsing overhead |
| Manual HTML entity replacement | `entities` library decodeXML() | entities@8.0.0 (current) | Handles all edge cases correctly |

**Important:** The GUS BIR API itself has not changed significantly in years. The WSDL and endpoints are stable. The bir1 npm package (v4.1.1, actively maintained as of 2024) confirms the API contract is stable.

## Open Questions

1. **httpRequest response type for SOAP**
   - What we know: n8n's `this.helpers.httpRequest` with `json: false` returns string. SOAP responses are XML strings.
   - What's unclear: Whether we need `encoding` or `returnFullResponse` options for correct string handling.
   - Recommendation: Use `{ json: false }` to get raw string response. Test with actual SOAP response in first plan.

2. **PKD codes in full report**
   - What we know: PKD codes are available via separate report types (`PublDaneRaportDzialalnosciPrawnej` for legal entities, `PublDaneRaportDzialalnosciFizycznej` for natural persons).
   - What's unclear: Whether to auto-fetch PKD report alongside main report, or expose as separate operation.
   - Recommendation: Expose as part of "Get Full Data" operation with optional PKD toggle. Two API calls internally (main report + PKD report) merged into one response.

3. **Session optimization for multiple items**
   - What we know: Session valid for 60 minutes. Single login per execute() call is sufficient.
   - What's unclear: Whether n8n execute() processes all items in one call or makes separate calls.
   - Recommendation: Login once at start of execute(), process all items, logout in finally block. This matches LinkerCloud/Fakturownia pattern.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| fast-xml-parser | XML response parsing | Needs install | 5.5.8 (npm) | -- |
| entities | HTML entity decoding | Needs install | 8.0.0 (npm) | -- |
| Node.js | Runtime | Assumed present | -- | -- |
| GUS BIR test endpoint | Testing | Public access | -- | Use test key `abcde12345abcde12345` |

**Missing dependencies with no fallback:**
- fast-xml-parser and entities must be installed as runtime dependencies in the package

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `packages/n8n-nodes-gus-regon/jest.config.js` (Wave 0) |
| Quick run command | `cd packages/n8n-nodes-gus-regon && npx jest --config jest.config.js` |
| Full suite command | `cd packages/n8n-nodes-gus-regon && npx jest --config jest.config.js --verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REGON-01 | Credentials class with apiKey + environment | unit | `npx jest GusRegon.node.test.ts -t "Credentials"` | Wave 0 |
| REGON-02 | Login/logout session lifecycle | unit | `npx jest GusRegon.node.test.ts -t "session"` | Wave 0 |
| REGON-03 | SOAP envelope build + XML parse pipeline | unit | `npx jest XmlParser.test.ts` | Wave 0 |
| REGON-04 | Search by NIP returns structured JSON | unit | `npx jest GusRegon.node.test.ts -t "NIP"` | Wave 0 |
| REGON-05 | Search by REGON returns structured JSON | unit | `npx jest GusRegon.node.test.ts -t "REGON"` | Wave 0 |
| REGON-06 | Search by KRS returns structured JSON | unit | `npx jest GusRegon.node.test.ts -t "KRS"` | Wave 0 |
| REGON-07 | Get full data + PKD codes | unit | `npx jest GusRegon.node.test.ts -t "full"` | Wave 0 |
| REGON-08 | Programmatic execute() method | unit | `npx jest GusRegon.node.test.ts -t "execute"` | Wave 0 |
| REGON-09 | Package metadata (codex, icon) | unit | `npx jest GusRegon.node.test.ts -t "metadata"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd packages/n8n-nodes-gus-regon && npx jest --config jest.config.js`
- **Per wave merge:** Full suite + lint
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `packages/n8n-nodes-gus-regon/jest.config.js` -- jest configuration
- [ ] `packages/n8n-nodes-gus-regon/__tests__/GusRegon.node.test.ts` -- main test file
- [ ] `packages/n8n-nodes-gus-regon/__tests__/XmlParser.test.ts` -- XML parsing unit tests
- [ ] `packages/n8n-nodes-gus-regon/__tests__/fixtures/` -- SOAP XML fixture files

## Project Constraints (from CLAUDE.md)

- Programmatic style required (SOAP API cannot use declarative routing)
- `eslint-disable` for `no-http-request-with-manual-auth` justified by SOAP Content-Type requirements
- fast-xml-parser and entities are runtime dependencies in package.json (not devDependencies)
- No SDK dependencies (do not use `bir1` as dependency -- replicate patterns only)
- Credentials must be separate file
- Error handling via `NodeApiError` with English messages
- SVG icon 60x60 with official GUS logo
- Codex file categories: likely "Data & Storage" or similar
- Tests with mocked HTTP (no real API calls in CI)
- String-form icon paths (per Phase 01 decision)
- `strict: false` in n8n config (per Phase 01 decision)
- Credential icon property required for lint compliance (per Phase 12 decision)

## Sources

### Primary (HIGH confidence)
- bir1 npm package v4.1.1 source code (extracted and analyzed) -- SOAP templates, parsing pipeline, session management, report types, error codes
- [GUS API Portal](https://api.stat.gov.pl/Home/RegonApi) -- official documentation

### Secondary (MEDIUM confidence)
- [PowerShell GUS BIR implementation](https://github.com/amnich/GUS-BIR-API-powershell-function) -- confirmed SOAP envelope format, Content-Type, sid header
- [PHP GUS API library](https://github.com/johnzuk/GusApi) -- cross-verified session flow and report types
- [Make.com community thread](https://community.make.com/t/soap-and-http-walk-around-poland-gus-service/8644) -- confirmed Content-Type requirement and session token behavior

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified against bir1 source code and multiple implementations
- Architecture: HIGH - patterns directly from working bir1 implementation + project conventions
- Pitfalls: HIGH - documented across multiple implementations and community reports

**Research date:** 2026-03-22
**Valid until:** 2026-06-22 (GUS BIR API is stable, unchanged for years)
