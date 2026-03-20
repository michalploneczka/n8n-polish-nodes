# Domain Pitfalls

**Domain:** n8n Community Node Development (Polish service integrations)
**Researched:** 2026-03-20
**Overall Confidence:** MEDIUM (based on training data knowledge of n8n internals, TypeScript patterns, and specific API documentation patterns; no live web verification available)

---

## Critical Pitfalls

Mistakes that cause rewrites, npm publish failures, or n8n review rejection.

---

### Pitfall 1: Missing `format=json` on SMSAPI Legacy Endpoints

**What goes wrong:** SMSAPI's older endpoints (notably `/sms.do`) return a custom plain-text format by default, not JSON. The declarative routing in n8n assumes JSON responses. Without `format=json` in query params, n8n receives plain text and either crashes with a JSON parse error or returns gibberish to the user.

**Why it happens:** Only the newer REST endpoints (`/contacts`, `/profile`) default to JSON. The SMS-sending endpoints are legacy and default to line-delimited key:value format.

**Consequences:** Node appears to work in development (you read the docs for newer endpoints), then fails when users actually send SMS. Silent data corruption if n8n wraps the plain text as a string instead of parsing it.

**Prevention:**
- Add `format=json` as a **hardcoded** query parameter on every SMSAPI request, not as user-facing option
- In declarative style, use `routing.request.qs` to inject it:
  ```typescript
  routing: {
    request: {
      qs: {
        format: 'json',
      },
    },
  },
  ```
- Add this at the **node level** (top-level `requestDefaults`), not per-operation, so it is never missed

**Detection:** Test every endpoint individually. If you only test `/contacts` (which returns JSON natively), you will miss this bug on `/sms.do`.

---

### Pitfall 2: n8n Declarative Routing `send` Object Silently Ignored

**What goes wrong:** In declarative style nodes, the `routing` property on `INodeProperties` has specific rules about nesting. If you put routing configuration in the wrong place (e.g., on a parent field rather than the leaf field that has the value), n8n silently ignores it. No error, no warning -- the request just does not include the parameter.

**Why it happens:** n8n's declarative engine only processes `routing.send` on fields that have actual user-provided values. If a field is a `collection` or `fixedCollection`, the routing must be on the child properties, not the parent.

**Consequences:** Parameters silently missing from API requests. You test and the API returns "missing required parameter" errors, but the n8n UI shows the field is filled in.

**Prevention:**
- Always place `routing.send` on the **leaf properties** (the ones with `type: 'string'`, `type: 'number'`, etc.)
- Never place `routing.send` on `type: 'collection'` or `type: 'fixedCollection'` parents
- Test every parameter individually by checking the actual HTTP request being sent (use n8n's built-in request logging or nock assertions)

**Detection:** Use nock tests that assert on the exact request body/query sent. A test like `nock.post('/endpoint', body => body.to === '48123456789')` will catch missing params that a simple "no error thrown" test misses.

---

### Pitfall 3: `n8n` Field in package.json Pointing to Wrong Paths

**What goes wrong:** The `n8n.nodes` and `n8n.credentials` arrays in `package.json` must point to the **compiled `.js` files** in the `dist/` directory, not the `.ts` source files. If they point wrong, n8n cannot find the node after installation and it silently does not appear in the node picker.

**Why it happens:** You write TypeScript, but n8n loads compiled JavaScript. Easy to forget the `dist/` prefix or use `.ts` extension.

**Consequences:** Node installs via npm without error, but never appears in n8n. Users file "node not showing up" issues. Extremely frustrating to debug because there is no error message.

**Prevention:**
- Always use `dist/` prefix: `"dist/nodes/Smsapi/Smsapi.node.js"`
- Always use `.js` extension, never `.ts`
- Verify with `npm pack --dry-run` that the dist files are included in the tarball
- Add a CI check that runs `npm pack` and verifies the listed files exist

**Detection:** After `npm run build`, verify the files referenced in `package.json` actually exist:
```bash
for f in $(node -e "const p=require('./package.json'); [...p.n8n.nodes, ...p.n8n.credentials].forEach(f => console.log(f))"); do
  [ -f "$f" ] || echo "MISSING: $f"
done
```

---

### Pitfall 4: npm Publish Provenance Failure in GitHub Actions

**What goes wrong:** `npm publish --provenance` fails with cryptic OIDC errors if the GitHub Actions workflow is not configured correctly. Common failures: missing `id-token: write` permission, wrong npm registry configuration, or running in a fork PR context.

**Why it happens:** Provenance attestation requires the GitHub Actions OIDC token to be available, which requires explicit permissions. The default token permissions in many workflow configurations do not include `id-token: write`.

**Consequences:** CI pipeline works for builds and tests but fails at publish step. You discover this only when you try to publish the first package. If provenance is mandatory (as of May 2026), no publish without it.

**Prevention:**
- Workflow MUST include:
  ```yaml
  permissions:
    contents: read
    id-token: write  # REQUIRED for provenance
  ```
- Use `NODE_AUTH_TOKEN` secret, not `NPM_TOKEN` (subtle naming matters for some action versions)
- Set the registry URL explicitly in the setup-node step:
  ```yaml
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      registry-url: 'https://registry.npmjs.org'
  ```
- NEVER run `npm publish --provenance` from fork PRs (OIDC tokens are not available in forks)
- For monorepo: each package needs its own `npm publish` step run from within its directory, with the correct `package.json`

**Detection:** Test the entire publish workflow early with your first package (CEIDG is the simplest -- use it as the pipeline guinea pig). Do not wait until you have 4 nodes ready.

---

### Pitfall 5: Missing `n8n-community-node-package` Keyword

**What goes wrong:** n8n discovers community nodes by searching npm for packages with the keyword `n8n-community-node-package`. If this keyword is missing or misspelled, the node is invisible to n8n's community node installation UI.

**Why it happens:** Typo, or forgetting to add it to a new package's `package.json` when copying from template.

**Consequences:** Package publishes successfully on npm but users cannot find or install it through n8n's UI. They can only install via CLI with the exact package name.

**Prevention:**
- Add a CI lint step that checks every `packages/*/package.json` contains the keyword
- Template the `package.json` and use a monorepo script to validate consistency

**Detection:** After first publish, search for your package in n8n's community nodes UI. If not found, check the keyword.

---

### Pitfall 6: OAuth2 Authorization Code Flow for Allegro -- Redirect URI Mismatch

**What goes wrong:** Allegro uses OAuth2 Authorization Code flow, which requires a redirect URI. n8n has a specific callback URL format (`https://{n8n-host}/rest/oauth2-credential/callback`). If this does not exactly match what is registered in Allegro's developer console, the auth flow fails silently or with a generic "invalid redirect" error.

**Why it happens:** n8n's callback URL depends on the deployment (cloud vs self-hosted, with or without reverse proxy, custom base path). Users configure the wrong URL in Allegro's app settings.

**Consequences:** Users cannot authenticate. They blame the node, not their Allegro app configuration. You get support issues that are environment-specific.

**Prevention:**
- In the credential type, set `oAuth2.authUrl` and `oAuth2.accessTokenUrl` correctly for Allegro
- Use the n8n built-in OAuth2 credential type as base (`extends` pattern if available, or implement `ICredentialType` with `authenticate` using `oAuth2` generic auth)
- Document the exact redirect URI format users need to register in Allegro developer console
- Allegro sandbox (`allegrosandbox.pl`) has DIFFERENT OAuth endpoints than production -- credential must support both via an environment toggle

**Detection:** Test both sandbox and production OAuth flows in an actual n8n instance, not just unit tests. OAuth2 Authorization Code cannot be meaningfully tested with nock alone.

---

### Pitfall 7: BaseLinker Single-Endpoint API Breaking Declarative Style

**What goes wrong:** BaseLinker sends ALL requests as POST to a single URL (`connector.php`) with the method name in the form body. n8n's declarative routing cannot handle this -- it expects different URLs for different operations. Attempting to shoehorn BaseLinker into declarative style results in either (a) all operations hitting the same URL with wrong method params, or (b) an impossibly convoluted routing config.

**Why it happens:** Declarative style assumes REST-like URL patterns. BaseLinker's API is RPC-style with a single endpoint.

**Consequences:** If you try declarative: wasted time rewriting to programmatic. If you do it wrong in programmatic: all operations accidentally call the wrong BaseLinker method because the `method` body param is misrouted.

**Prevention:**
- Use programmatic style (`execute()` method) from the start for BaseLinker
- Build a helper function that constructs the BaseLinker request:
  ```typescript
  async function baselinkerRequest(
    this: IExecuteFunctions,
    method: string,
    parameters: Record<string, unknown>,
  ): Promise<unknown> {
    const credentials = await this.getCredentials('baselinkerApi');
    const body = new URLSearchParams({
      method,
      parameters: JSON.stringify(parameters),
    });
    return this.helpers.httpRequest({
      method: 'POST',
      url: 'https://api.baselinker.com/connector.php',
      headers: {
        'X-BLToken': credentials.apiToken as string,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
  }
  ```
- Map n8n resource/operation combos to BaseLinker method names in a lookup table, not in if/else chains

**Detection:** If you find yourself writing 20+ routing rules that all point to the same URL, you chose the wrong style.

---

## Moderate Pitfalls

---

### Pitfall 8: SOAP/XML Envelope Construction for GUS REGON (BIR)

**What goes wrong:** GUS REGON API is a SOAP service requiring properly formatted XML envelopes with specific namespace declarations. Using string interpolation to build XML leads to encoding bugs (special characters in search terms break the XML), namespace errors, and silent failures where the API returns a valid SOAP response with an empty result set instead of an error.

**Why it happens:** SOAP is unforgiving about XML structure. Missing a namespace, wrong element order, or unescaped `&` in a company name breaks everything.

**Prevention:**
- Use a proper XML builder library (e.g., `fast-xml-parser` or `xmlbuilder2`) instead of template literals
- GUS REGON has a session pattern: `Zaloguj` (returns session ID) -> `DaneSzukajPodmioty` (with session header) -> `DaneWyloguj`. The session ID must be passed as a SOAP header (`sid`), not a body parameter
- Store the SOAP envelope templates as constants, not inline strings
- Handle the fact that GUS REGON returns HTML-encoded XML inside CDATA sections -- you need to decode twice:
  1. Parse SOAP envelope
  2. Extract CDATA content
  3. HTML-decode the inner content
  4. Parse the inner XML
- Add `fast-xml-parser` as a dependency (lightweight, maintained, supports CDATA)

**Detection:** Test with company names containing Polish characters (e.g., with special chars like `&`, `<`, `"`) and verify results parse correctly.

---

### Pitfall 9: Binary Data Handling for PDF Downloads (Fakturownia, InPost, iFirma)

**What goes wrong:** When downloading PDFs from APIs (invoice PDFs, shipping labels), developers use `this.helpers.httpRequest()` with default settings, which tries to parse the response as JSON. The PDF binary content gets mangled or triggers a JSON parse error.

**Why it happens:** n8n's `httpRequest` defaults to expecting JSON. Binary responses need explicit configuration.

**Consequences:** Corrupted PDF files, or errors that block the entire workflow.

**Prevention:**
- For programmatic nodes, use `this.helpers.httpRequest()` with `encoding: 'arraybuffer'` or `responseType: 'arraybuffer'`:
  ```typescript
  const response = await this.helpers.httpRequest({
    method: 'GET',
    url: `https://app.fakturownia.pl/invoices/${id}.pdf`,
    qs: { api_token: credentials.apiToken },
    encoding: 'arraybuffer',
  });

  const binaryData = await this.helpers.prepareBinaryData(
    Buffer.from(response as Buffer),
    `invoice-${id}.pdf`,
    'application/pdf',
  );

  return {
    json: {},
    binary: { data: binaryData },
  };
  ```
- For declarative style, you cannot handle binary responses directly -- this forces programmatic style for any operation that downloads files
- Always set the correct MIME type (`application/pdf`) and a meaningful filename

**Detection:** Download a PDF and verify it opens correctly. A zero-byte file or a file that starts with `{` (JSON) means the response handling is wrong.

---

### Pitfall 10: iFirma HMAC-SHA1 Signature Calculation Errors

**What goes wrong:** iFirma requires every request to be signed with HMAC-SHA1 using the API key and a specific string-to-sign format. Getting the string-to-sign wrong (wrong field order, wrong encoding, missing newlines) results in 401 Unauthorized errors with no helpful message from iFirma about what is wrong.

**Why it happens:** HMAC signature debugging is opaque -- the API only says "invalid signature," not "your string-to-sign was X but should be Y." iFirma's documentation on the exact signing algorithm is sparse.

**Consequences:** Days of debugging authentication before you can even test a single endpoint.

**Prevention:**
- Implement the signing in a separate, unit-testable function with known test vectors:
  ```typescript
  import { createHmac } from 'crypto';

  function signRequest(
    url: string,
    apiKey: string,
    requestBody: string,
    userName: string,
  ): string {
    const hmac = createHmac('sha1', apiKey);
    // iFirma's signing format: url + userName + keyName + requestContent
    // Verify exact format against iFirma docs -- this is an approximation
    hmac.update(url + userName + requestBody);
    return hmac.digest('hex');
  }
  ```
- Write unit tests for the signing function with hardcoded inputs/outputs BEFORE trying to hit the real API
- Use `crypto.createHmac` from Node.js built-in `crypto` module, NOT external libraries
- Log the string-to-sign during development (but never in production/published code)
- iFirma uses different API keys for different resource types (invoices vs expenses) -- the credential must store multiple keys

**Detection:** If you get 401 on every request but the API key is correct, the signature is wrong. Compare your string-to-sign byte-by-byte with a working implementation.

---

### Pitfall 11: Przelewy24 Amount in Grosze (Integer Arithmetic)

**What goes wrong:** Przelewy24 expects amounts in **grosze** (1/100 PLN, i.e., cents), as integers. If you pass `99.99` (PLN) instead of `9999` (grosze), the user is charged 100x less. If you use floating-point multiplication (`99.99 * 100 = 9998.999...`), you get rounding errors.

**Why it happens:** JavaScript floating-point arithmetic. `0.1 + 0.2 !== 0.3`. Multiplying user-entered PLN amounts by 100 can yield non-integer results.

**Consequences:** Incorrect payment amounts. Financial errors.

**Prevention:**
- Accept amounts from users in PLN (user-friendly) but convert using `Math.round()`:
  ```typescript
  const amountInGrosze = Math.round(parseFloat(amountPLN) * 100);
  ```
- Validate that the result is a positive integer before sending
- The CRC checksum (SHA384) MUST be calculated with the grosze value, not the PLN value
- Add a note in the field description: "Amount in PLN (e.g., 99.99). Will be converted to grosze automatically."

**Detection:** Test with values known to cause floating-point issues: `19.99`, `0.10`, `100.01`.

---

### Pitfall 12: Przelewy24 CRC Checksum SHA384 Order of Fields

**What goes wrong:** Przelewy24 requires a CRC checksum (SHA384) for transaction registration and verification. The checksum is calculated over specific fields in a **specific order**, concatenated with `|` separator. Getting the field order wrong produces a valid SHA384 hash that Przelewy24 rejects with a generic "invalid CRC" error.

**Why it happens:** The required field order differs between registration and verification. Documentation may list fields in a different order than required for CRC.

**Prevention:**
- For transaction registration, the CRC string is: `{"sessionId":"{sid}","merchantId":{mid},"amount":{amount},"currency":"{cur}","crc":"{crcKey}"}`
  (Verify exact format against current P24 docs -- this is the general pattern)
- Build the CRC string as a separate, unit-testable function
- Use Node.js built-in `crypto.createHash('sha384')`, not external libraries
- Unit test with known input/output pairs from Przelewy24 documentation or sandbox

**Detection:** If transaction registration always fails with "invalid CRC," double-check field order and encoding. Przelewy24 sandbox returns slightly more helpful error messages than production.

---

### Pitfall 13: nock Testing with n8n -- Request Matching Gotchas

**What goes wrong:** nock intercepts HTTP requests at the Node.js level, but n8n's `httpRequest` helper adds headers, transforms the body, and modifies URLs in ways you might not expect. Your nock interceptor does not match the actual request n8n sends, causing "Nock: No match for request" errors.

**Why it happens:** n8n adds `User-Agent` headers, might follow redirects, and serializes body content differently than you expect (e.g., form-encoded vs JSON).

**Consequences:** Tests fail with misleading errors. Developers loosen nock matchers too much (e.g., matching any body) which hides real bugs.

**Prevention:**
- Use `nock.recorder.rec()` during initial development to see exactly what n8n sends, then build your interceptor from the recording
- Match on essential fields only (URL, method, critical body params), not everything
- For form-encoded bodies (BaseLinker, SMSAPI), nock receives parsed objects, not raw strings:
  ```typescript
  nock('https://api.baselinker.com')
    .post('/connector.php', (body: Record<string, string>) => {
      return body.method === 'getOrders';
    })
    .reply(200, { status: 'SUCCESS', orders: [] });
  ```
- Clean up nock after each test: `nock.cleanAll()` in `afterEach()`
- Enable `nock.disableNetConnect()` to catch unmocked requests

**Detection:** If tests pass locally but fail in CI, or pass individually but fail when run together, nock cleanup is likely missing.

---

### Pitfall 14: NodeApiError Wrapping -- Wrong Constructor Arguments

**What goes wrong:** `NodeApiError` has a specific constructor signature. Passing wrong arguments (e.g., the error object instead of `this.getNode()` as first arg, or missing the options object) creates unhelpful error messages in the n8n UI, or throws a secondary error that masks the original.

**Why it happens:** The `NodeApiError` constructor signature is: `new NodeApiError(this.getNode(), error, { message?, httpCode? })`. Developers often pass just the error or reverse the arguments.

**Consequences:** Users see "Unknown error" instead of helpful messages. Debugging becomes impossible.

**Prevention:**
- Always wrap API errors in `try/catch` with proper `NodeApiError`:
  ```typescript
  try {
    const response = await this.helpers.httpRequest(options);
    return response;
  } catch (error) {
    throw new NodeApiError(this.getNode(), error as JsonObject, {
      message: `SMSAPI error: ${(error as any).message}`,
      httpCode: String((error as any).statusCode || ''),
    });
  }
  ```
- Import `NodeApiError` from `n8n-workflow`
- For declarative nodes, error handling is automatic through the routing system, but custom `preSend` or `postReceive` functions still need manual error wrapping

**Detection:** Trigger each error condition in tests (401, 404, 500, timeout, network error) and verify the error message is helpful and includes the HTTP status code.

---

### Pitfall 15: TypeScript Strict Mode -- `this` Context in n8n Execute Functions

**What goes wrong:** With TypeScript strict mode, the `this` keyword in `execute()` and helper functions is strictly typed. If you extract a helper function outside the class and call it, `this` loses its n8n context (`IExecuteFunctions`), and methods like `this.getCredentials()`, `this.helpers.httpRequest()`, and `this.getNodeParameter()` are undefined.

**Why it happens:** TypeScript strict mode enforces `this` parameter typing. Arrow functions capture lexical `this`, but regular functions passed as callbacks do not.

**Consequences:** Runtime `TypeError: Cannot read property 'getCredentials' of undefined`. Works in non-strict mode, fails in strict.

**Prevention:**
- For helper functions that need n8n context, pass `this` explicitly:
  ```typescript
  async function makeApiRequest(
    context: IExecuteFunctions,
    method: string,
    endpoint: string,
  ): Promise<unknown> {
    const credentials = await context.getCredentials('smsapiApi');
    // ...
  }

  // In execute():
  const result = await makeApiRequest(this, 'GET', '/contacts');
  ```
- Or use `.call(this)` / `.bind(this)` patterns
- Never use arrow functions for the `execute()` method itself (it is a class method)

**Detection:** TypeScript compiler catches most of these in strict mode -- that is the point. But if you use `any` casts to silence errors, you lose the protection.

---

## Minor Pitfalls

---

### Pitfall 16: wFirma XML Response Parsing -- Nested Structure Surprise

**What goes wrong:** wFirma returns XML where the actual data is deeply nested (e.g., `<api><invoices><invoice><id>123</id>...</invoice></invoices></api>`). Naive parsing with `fast-xml-parser` produces deeply nested objects that are hard for users to work with in n8n.

**Prevention:**
- After parsing XML, flatten the response to the relevant level before returning to n8n
- Configure `fast-xml-parser` with `ignoreAttributes: false` (wFirma uses XML attributes for metadata)
- Map the parsed XML to a clean JSON structure that matches what a REST API would return
- Handle both single-item and array responses (XML parsers often return an object when there is 1 item and an array when there are multiple)

---

### Pitfall 17: Shoper OAuth2 client_credentials -- Token Caching

**What goes wrong:** Shoper uses OAuth2 `client_credentials` grant. If you request a new token on every API call, you hit Shoper's aggressive rate limit (2 req/sec) twice as fast -- once for token, once for actual request.

**Prevention:**
- Use n8n's built-in OAuth2 credential type which handles token caching and refresh automatically
- Set the credential type to `oAuth2Api` with grant type `clientCredentials`
- n8n handles token refresh transparently -- do not implement manual token management

---

### Pitfall 18: SVG Icon Requirements -- Gotchas

**What goes wrong:** n8n requires a 60x60 SVG icon. Common issues: icon is actually a PNG renamed to .svg, icon has external references (fonts, images) that do not load, icon uses `viewBox` that does not match expected dimensions, or icon path in the node description is wrong.

**Prevention:**
- Convert logos to true SVG (not embedded raster), ideally paths only
- Set `viewBox="0 0 60 60"` explicitly
- Remove all external references (inline fonts, remove external stylesheets)
- Reference in node description as `icon: 'file:smsapi.svg'` (relative to the node .ts file)
- Test by loading in n8n -- icons that look fine in a browser may not render in n8n's node panel

---

### Pitfall 19: n8n Codex File (.node.json) -- Categories Must Be Valid

**What goes wrong:** The `.node.json` codex file defines categories and subcategories for the n8n node picker. Using invalid category names causes the node to appear in "Miscellaneous" or not be findable by category browsing.

**Prevention:**
- Use only valid n8n categories. Common ones: `"Communication"`, `"Finance & Accounting"`, `"Sales"`, `"Data & Storage"`, `"Productivity"`, `"Marketing"`, `"Development"`
- For Polish service nodes, appropriate categories:
  - SMSAPI: `"Communication"` with subcategory `"SMS"`
  - Fakturownia, wFirma, iFirma: `"Finance & Accounting"`
  - InPost: `"Miscellaneous"` or `"Sales"` (no dedicated "Shipping" category)
  - BaseLinker, Shoper, Allegro: `"Sales"` or `"Data & Storage"`
  - CEIDG, GUS REGON: `"Data & Storage"` or `"Miscellaneous"`

---

### Pitfall 20: Monorepo npm Publish -- Package Scope Confusion

**What goes wrong:** In a monorepo, running `npm publish` from the root publishes the root `package.json`, not the individual packages. Or, GitHub Actions workflow publishes all packages every time, even when only one changed.

**Prevention:**
- Each publish workflow step must `cd` into the specific package directory
- Use git tags per package (e.g., `smsapi-v1.0.0`, `ceidg-v1.0.0`) and trigger workflows per tag pattern
- Or use a conditional check: only publish packages where `package.json` version changed
- Do NOT use npm workspaces `publish` from root -- handle each package independently

---

### Pitfall 21: n8n Community Node Review -- Common Rejection Reasons

**What goes wrong:** Submitting to n8n's Creator Portal for verification (verified badge) and getting rejected.

**Common rejection reasons (based on n8n community patterns):**
1. **Missing error handling** -- API errors not wrapped in `NodeApiError`, users see raw stack traces
2. **Hardcoded credentials** -- Any credential value in source code (even for tests)
3. **Missing `continue on fail` support** -- Node does not check `this.continueOnFail()` in the catch block
4. **No input validation** -- Node crashes on empty/null inputs instead of showing helpful errors
5. **Missing pagination** -- Node returns only first page of results without telling the user
6. **Poor field descriptions** -- Fields without `description` property, or descriptions that just repeat the field name
7. **Missing codex file** -- The `.node.json` file is required for proper categorization
8. **Linter violations** -- `n8n-nodes-base` linter rules not satisfied

**Prevention:**
- Run the n8n linter (`npm run lint`) before every publish
- Implement `continueOnFail()` in every `execute()`:
  ```typescript
  const items = this.getInputData();
  const results: INodeExecutionData[] = [];
  for (let i = 0; i < items.length; i++) {
    try {
      // ... process item
      results.push({ json: responseData });
    } catch (error) {
      if (this.continueOnFail()) {
        results.push({ json: { error: (error as Error).message } });
        continue;
      }
      throw error;
    }
  }
  return [results];
  ```
- Add meaningful `description` to every field
- Implement pagination where the API supports it (SMSAPI contacts, Fakturownia, BaseLinker, etc.)

---

## API-Specific Gotchas Summary

| API | Gotcha | Impact | Mitigation |
|-----|--------|--------|------------|
| SMSAPI | Legacy endpoints return plain text without `format=json` | Broken parsing | Always inject `format=json` in query params |
| SMSAPI | Phone numbers must include country code (`48XXXXXXXXX`) | Failed sends | Validate format, add hint in field description |
| BaseLinker | All requests are POST to single URL with `method` in body | Cannot use declarative style | Use programmatic style with helper function |
| BaseLinker | Dates are Unix timestamps, not ISO 8601 | Wrong date filtering | Convert in helper, document in field descriptions |
| BaseLinker | Error responses have `status: "ERROR"` in JSON body (HTTP 200) | Errors not caught by n8n default error handling | Check `status` field in response, throw `NodeApiError` manually |
| wFirma | Returns XML, not JSON | Requires XML parser dependency | Use `fast-xml-parser`, flatten before returning |
| wFirma | Single item vs array inconsistency in XML | Type errors at runtime | Always normalize to array with `Array.isArray()` check |
| iFirma | HMAC-SHA1 signature required per request | Cannot use declarative style | Build and unit-test signing function separately |
| iFirma | Different API keys for different resource types | Auth confusion | Credential type must store multiple keys with clear labels |
| Allegro | OAuth2 Authorization Code (not client_credentials) | Most complex auth flow in n8n | Use n8n's built-in OAuth2, document redirect URI setup |
| Allegro | Different rate limits per endpoint group | Unpredictable throttling | Implement per-endpoint backoff, not global |
| Allegro | Sandbox has different domain (`allegrosandbox.pl`) | Environment confusion | Add environment toggle in credentials |
| Przelewy24 | Amounts in grosze (integer), NOT PLN (float) | Financial errors | `Math.round(amount * 100)`, never raw multiply |
| Przelewy24 | CRC SHA384 with specific field order | Rejected transactions | Unit-test CRC function with known vectors |
| GUS REGON | SOAP/XML with session-based auth | Most complex technically | Session management: login, query, logout per operation |
| GUS REGON | Returns HTML-encoded XML in CDATA | Double parsing required | Parse SOAP -> decode HTML -> parse inner XML |
| GUS REGON | Test vs production API key (same key, different login method) | Environment confusion | Document clearly in credentials |
| CEIDG | Simplest API, but returns nested JSON | Unnecessary complexity for users | Flatten response to essential fields |
| Fakturownia | Subdomain-based URL (`{subdomain}.fakturownia.pl`) | Cannot use static base URL | Build base URL dynamically from credentials |
| Fakturownia | PDF download is binary, not JSON | JSON parse error if not handled | Use `arraybuffer` encoding, return as binary data |
| Shoper | OAuth2 client_credentials with aggressive rate limit (2 req/sec) | Token requests count toward rate limit | Use n8n built-in OAuth2 token caching |

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Week 1: SMSAPI + CEIDG | `format=json` missing on legacy SMSAPI endpoints | Add to `requestDefaults` at node level, test `/sms.do` specifically |
| Week 1: First npm publish | Provenance OIDC failure in GitHub Actions | Set up and test publish workflow with CEIDG before SMSAPI |
| Week 2: Fakturownia | Binary PDF response handling breaks declarative | Use programmatic for Download PDF operation, declarative for the rest |
| Week 2: Fakturownia | Subdomain-based base URL | Dynamic URL construction in `requestDefaults` or credential `authenticate` method |
| Week 3: InPost | Sandbox vs production base URL confusion | Environment toggle in credentials, default to sandbox |
| Week 4: Przelewy24 | CRC checksum field order + grosze math | Unit-test signing + amount conversion before integration testing |
| Week 5-6: BaseLinker | Declarative style impossible, HTTP 200 errors | Programmatic from day 1, manual error checking on every response |
| Week 7: wFirma | XML parsing + single-vs-array inconsistency | Add XML parser early, normalize all responses to arrays |
| Week 7: Shoper | OAuth2 token refresh + rate limiting | Rely on n8n OAuth2 built-in, add retry with backoff |
| Week 8+: iFirma | HMAC signature debugging is opaque | Build and test signing function in isolation before anything else |
| Week 8+: Allegro | OAuth2 Auth Code flow complexity + huge API surface | Start with minimal operations (4-5), test OAuth flow manually first |
| Week 8+: GUS REGON | SOAP session management + double XML parsing | Consider using `soap` npm package instead of building from scratch |

---

## Sources

- n8n source code patterns (training data, MEDIUM confidence)
- SMSAPI.pl API documentation patterns (training data, MEDIUM confidence)
- BaseLinker API connector.php pattern (from PROJECT.md, HIGH confidence -- confirmed by project author)
- Przelewy24 CRC checksum pattern (training data, LOW confidence -- verify exact field order against current docs)
- GUS REGON BIR SOAP pattern (training data, MEDIUM confidence)
- iFirma HMAC signing pattern (training data, LOW confidence -- sparse documentation, verify against actual API)
- npm provenance attestation requirements (training data, MEDIUM confidence)
- n8n community node review patterns (training data, LOW confidence -- based on community forum patterns, verify against current n8n Creator Portal requirements)

**Note:** WebSearch and WebFetch were unavailable during this research. All findings are based on training data and the project context provided. Confidence is MEDIUM overall. Key items to verify against live documentation before implementation:
1. iFirma exact HMAC signing algorithm and string-to-sign format
2. Przelewy24 exact CRC field order for current API version
3. GUS REGON SOAP envelope format and session management
4. n8n current linter rules and Creator Portal review criteria
5. npm provenance exact GitHub Actions configuration for 2026
