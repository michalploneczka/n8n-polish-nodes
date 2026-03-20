# Project Research Summary

**Project:** n8n Polish Nodes
**Domain:** n8n community node monorepo (11 Polish service integrations)
**Researched:** 2026-03-20
**Confidence:** MEDIUM

## Executive Summary

This project is a monorepo of 11 independent n8n community nodes for Polish services (SMS, invoicing, payments, e-commerce, government registries). Each node is a separately published npm package discovered by n8n via the `n8n-community-node-package` keyword. The well-established pattern for building these is: TypeScript compiled to CommonJS, n8n-workflow as a peer dependency, declarative style for simple REST APIs and programmatic style when APIs require signing, XML parsing, or non-standard request patterns. Only 2 of 11 nodes (SMSAPI, CEIDG) qualify for pure declarative style; the rest require programmatic `execute()` due to custom auth, XML responses, or RPC-style APIs.

The recommended approach is a workspace monorepo with shared TypeScript/Jest/ESLint configs at the root, independent versioning per package, and tag-based publishing via GitHub Actions with npm provenance attestation. The build pipeline must validate two n8n-specific requirements on every publish: (1) the `n8n` field in package.json points to compiled `.js` files in `dist/`, and (2) SVG icons and codex `.node.json` files are copied to `dist/` since `tsc` ignores non-TS assets. A shared test harness mocking `IExecuteFunctions` is essential because n8n provides no official test utilities for community nodes.

The primary risks are: (1) the `@n8n/node-cli` package referenced in PROJECT.md may not exist -- the known tool is `n8n-node-dev`, which must be verified before Phase 1 starts; (2) several APIs have sparse documentation for their auth mechanisms (iFirma HMAC, Przelewy24 CRC field order, GUS REGON SOAP session), requiring exploratory testing against real sandbox APIs; (3) npm provenance is mandatory from May 2026, so the CI publish pipeline must be validated with the very first package (CEIDG) before any real releases.

## Key Findings

### Recommended Stack

TypeScript strict mode compiled to CommonJS (n8n loads nodes via `require()`). All dev tooling hoisted to monorepo root. Per-package: only `peerDependencies` on n8n-workflow plus service-specific runtime deps where needed.

**Core technologies:**
- **TypeScript ~5.5+**: strict mode, target ES2021, module commonjs -- matches n8n's Node 18+ requirement
- **Jest 29 + ts-jest + nock**: n8n ecosystem standard; nock mocks HTTP for testing node `execute()` functions
- **fast-xml-parser 4.x**: lightweight XML parsing for wFirma and GUS REGON (preferred over heavy `soap` library)
- **Node.js crypto (built-in)**: HMAC-SHA1 for iFirma, SHA384 for Przelewy24 CRC -- no external crypto deps needed
- **Tag-based publishing via GitHub Actions**: simplest workflow for solo developer; migrate to changesets when contributors join

**Critical version note:** Verify `@n8n/node-cli` existence via `npm view @n8n/node-cli`. If it does not exist, use `n8n-node-dev` for build/lint. Also verify current `n8nNodesApiVersion` (may be 1 or 2).

### Expected Features

**Must have (table stakes -- every node):**
- `n8n-community-node-package` keyword in package.json
- Dedicated credential type with "Test Connection" support
- Resource/Operation two-level menu with n8n naming conventions (Get Many, not List)
- All errors wrapped as `NodeApiError` with English messages and HTTP status codes
- `continueOnFail()` support in all programmatic nodes
- SVG 60x60 icon, codex `.node.json`, English descriptions
- "Additional Fields" collection pattern for optional parameters

**Should have (differentiators):**
- Automatic pagination with `returnAll` toggle (Fakturownia, BaseLinker, Shoper, Allegro)
- Binary PDF download (Fakturownia, InPost, wFirma, iFirma)
- Sandbox/production environment toggle (InPost, Przelewy24, Allegro, Shoper)
- Exponential backoff retry on 429 responses (SMSAPI, BaseLinker, Shoper)

**Defer to v2+:**
- Trigger/webhook nodes (high complexity, requires persistent webhook registration)
- Full Allegro API (100+ endpoints -- V1 covers Offers, Orders, Shipping, Users only)
- Full BaseLinker API (60+ methods -- V1 covers Orders, Products, Shipping only)
- Binary file upload operations

### Architecture Approach

Workspace monorepo with flat `packages/` layout. Each `packages/n8n-nodes-*` directory is a self-contained npm package with its own package.json, tsconfig (extending root base), tests, and README. A `shared/test-utils/` directory (NOT published) provides the reusable n8n execution context mock and nock helpers. Publishing is per-package via git tags, with CI validating version match between tag and package.json before running `npm publish --provenance`.

**Major components:**
1. **Root workspace config** -- dev dependencies, shared configs (tsconfig.base.json, .eslintrc.js, jest.config.base.js), workspace scripts
2. **Per-package node** -- self-contained: nodes/, credentials/, __tests__/, package.json with `n8n` field, SVG icon, codex file
3. **shared/test-utils/** -- `createMockExecuteFunctions()` mock and nock helpers, referenced via relative imports
4. **CI/CD workflows** -- ci.yml (lint+build+test on PR), publish.yml (tag-triggered publish with provenance)
5. **Package verification script** -- validates all packages have required n8n fields, correct dist/ paths, keyword

### Critical Pitfalls

1. **Missing `format=json` on SMSAPI legacy endpoints** -- `/sms.do` returns plain text by default; inject `format=json` in `requestDefaults` at node level, never per-operation
2. **`n8n` field paths pointing to `.ts` instead of `dist/*.js`** -- node installs but silently never appears in n8n; add CI check that verifies referenced files exist after build
3. **npm provenance OIDC failure** -- missing `id-token: write` permission in GitHub Actions causes cryptic publish failures; test the full publish pipeline with CEIDG (simplest node) first
4. **BaseLinker single-endpoint POST breaks declarative style** -- all requests go to one URL with `method` in body; must use programmatic from day 1, with a lookup table mapping resource/operation to BaseLinker method names
5. **Przelewy24 grosze integer arithmetic** -- amounts must be in grosze (integer), not PLN (float); use `Math.round(amount * 100)` to avoid floating-point bugs

## Contested Decisions (Researcher Disagreements)

### 1. pnpm vs npm workspaces

**STACK.md recommends pnpm:** n8n core uses it, strict dep isolation, better `--filter` syntax.
**ARCHITECTURE.md recommends npm:** consumer uses npm, `npm link` is the primary dev workflow, zero contributor friction.

**Resolution: Test before committing.** The `npm link` compatibility concern with pnpm is legitimate but unverified. Run a quick test in Phase 1: set up pnpm workspace, build one node, link to `~/.n8n/custom`, verify n8n discovers it. If it works, use pnpm (benefits outweigh costs for phantom dep prevention). If `npm link` is problematic with pnpm symlink chains, use npm workspaces. **Default recommendation: pnpm** (aligns with n8n core), but validate the link workflow before locking in.

### 2. Changesets vs tag-based publishing

**STACK.md recommends changesets:** automated versioning, changelogs, prevents version mismatches.
**ARCHITECTURE.md recommends tags:** simpler for solo developer, less ceremony.

**Resolution: Start with tags, migrate when it hurts.** Solo developer building 11 packages over 8 weeks does not need changeset ceremony. Tag-based is simpler: bump version, tag, push. Add changesets when contributors join or release frequency demands automation. Migration is non-breaking.

### 3. ES2021 vs ES2022 target

**STACK.md recommends ES2022.** **ARCHITECTURE.md recommends ES2021** (more conservative, matches n8n's own target).

**Resolution: ES2021.** The conservative choice is correct -- minimizes risk of incompatibility with n8n's runtime. The difference is negligible.

### 4. Shared runtime package vs code duplication

**ARCHITECTURE.md explicitly warns against** a published shared runtime package (version coordination defeats independent packages). Small utilities (2-3 functions) should be duplicated across packages. Only extract to a shared npm package if the interface stabilizes and multiple packages depend on it (e.g., XML parser config for wFirma + GUS REGON).

**Resolution: Agree with ARCHITECTURE.md.** Keep shared code in `shared/test-utils/` (not published, test-only). Duplicate small production helpers. Consider a shared XML utility package only when both wFirma and GUS REGON are being built (Phase 6-7).

## Implications for Roadmap

### Phase 1: Monorepo Bootstrap + SMSAPI + CEIDG
**Rationale:** Establishes the entire project infrastructure. CEIDG is the simplest node (GET-only, API key, JSON) -- use it to validate the full pipeline: build, test, link to n8n, publish with provenance. SMSAPI has confirmed community demand (feature request from 2022).
**Delivers:** Working monorepo, CI/CD pipeline, shared test harness, 2 published nodes
**Features:** Resource/Operation structure, credential types with test connection, NodeApiError wrapping, codex files, SVG icons
**Avoids:** Pitfall 1 (SMSAPI format=json), Pitfall 3 (dist/ paths), Pitfall 4 (provenance OIDC), Pitfall 5 (keyword)
**Open questions to resolve first:** Validate pnpm link workflow with n8n. Verify `@n8n/node-cli` vs `n8n-node-dev`. Check `n8nNodesApiVersion`.

### Phase 2: Fakturownia
**Rationale:** First node requiring pagination and binary data (PDF). Adds two critical patterns that later nodes reuse.
**Delivers:** Invoice/client/product CRUD + PDF download node
**Features:** Pagination (returnAll toggle), binary PDF download, Additional Fields pattern, subdomain-based dynamic URL
**Avoids:** Pitfall 9 (binary data handling -- use `encoding: 'arraybuffer'`)

### Phase 3: InPost ShipX
**Rationale:** First fully programmatic node with complex nested object input (shipment data: receiver, parcels, dimensions). Adds sandbox/production toggle pattern.
**Delivers:** Shipment CRUD + label download + tracking node
**Features:** Complex nested input, binary label download (A4/A6), environment toggle, organization ID routing
**Avoids:** Pitfall 9 (binary), environment URL confusion

### Phase 4: Przelewy24
**Rationale:** Introduces cryptographic signing pattern (CRC SHA384). Contained scope (3-4 operations). Good isolation for testing the signing approach.
**Delivers:** Transaction register/verify/refund + payment methods node
**Features:** CRC checksum signing, grosze conversion, sandbox toggle
**Avoids:** Pitfall 11 (grosze arithmetic), Pitfall 12 (CRC field order)

### Phase 5: BaseLinker
**Rationale:** Largest scope after Allegro. Unique RPC-style API pattern (single-endpoint POST). Needs dedicated time.
**Delivers:** Orders/Products/Shipping node
**Features:** RPC-style request builder with method lookup table, manual error checking (HTTP 200 errors), Unix timestamp handling, pagination
**Avoids:** Pitfall 7 (declarative impossible), BaseLinker-specific error format (status field in JSON body)

### Phase 6: Shoper + wFirma
**Rationale:** Groups two medium-complexity nodes that each introduce one new pattern: OAuth2 client_credentials (Shoper) and XML response parsing (wFirma).
**Delivers:** 2 nodes -- Shoper products/orders/customers + wFirma invoices/contractors/expenses
**Features:** OAuth2 client_credentials via n8n built-in, XML parsing with fast-xml-parser, rate limiting (Shoper 2 req/sec)
**Avoids:** Pitfall 16 (wFirma nested XML -- flatten before returning), Pitfall 17 (Shoper token caching -- use n8n built-in)

### Phase 7: iFirma + Allegro + GUS REGON
**Rationale:** Most complex nodes, built last after accumulating all patterns from earlier phases. Each has a unique hard problem.
**Delivers:** 3 nodes covering remaining Polish services
**Features:** HMAC-SHA1 request signing (iFirma), OAuth2 authorization code with user consent flow (Allegro), SOAP/XML session management with double XML parsing (GUS REGON)
**Avoids:** Pitfall 6 (Allegro redirect URI mismatch), Pitfall 8 (SOAP envelope construction), Pitfall 10 (HMAC debugging opacity)

### Phase Ordering Rationale

- Phase 1 establishes ALL foundational infrastructure -- every subsequent phase depends on working build/test/publish
- CEIDG first as pipeline guinea pig (simplest node, lowest risk to validate the full publish flow)
- Phases 2-3 add pagination and binary data patterns that are reused by 4+ later nodes
- Each subsequent phase adds exactly one new technical challenge, preventing compounding complexity
- Allegro and GUS REGON last because they have the highest complexity and benefit from all patterns established earlier
- wFirma and Shoper grouped because both are medium complexity and can share a development week

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 4 (Przelewy24):** CRC checksum exact field order must be verified against current P24 API docs (training data confidence: LOW)
- **Phase 5 (BaseLinker):** 60+ available methods -- need to select exact V1 scope and verify current request format
- **Phase 7 (iFirma):** HMAC-SHA1 exact string-to-sign format has sparse documentation (confidence: LOW); plan 1-2 days exploratory sandbox testing
- **Phase 7 (Allegro):** OAuth2 redirect URI format depends on n8n deployment; must test against Allegro sandbox
- **Phase 7 (GUS REGON):** SOAP envelope format, session lifecycle, and double-encoded CDATA responses need verification against live sandbox

**Phases with standard patterns (skip deep research):**
- **Phase 1 (SMSAPI + CEIDG):** Well-documented REST APIs, standard n8n declarative patterns
- **Phase 2 (Fakturownia):** Standard REST API, well-documented pagination and PDF download
- **Phase 3 (InPost):** Good ShipX API documentation, standard programmatic patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | TypeScript + Jest + nock is solid (HIGH). Package manager choice needs validation (MEDIUM). `@n8n/node-cli` existence unverified (LOW). |
| Features | MEDIUM-HIGH | n8n node conventions well-established. Verification badge requirements may have evolved since training data. |
| Architecture | MEDIUM-HIGH | Monorepo patterns stable. Tag-based publish is straightforward. npm provenance setup needs live testing. |
| Pitfalls | MEDIUM | n8n-specific pitfalls (paths, keywords, NodeApiError) are HIGH confidence. API-specific gotchas (iFirma HMAC, P24 CRC, GUS REGON SOAP) are LOW -- based on training data, not verified against current API docs. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **`@n8n/node-cli` vs `n8n-node-dev`:** Run `npm view @n8n/node-cli` before Phase 1. If neither exists in a useful form, use plain `tsc` + manual asset copy.
- **`n8nNodesApiVersion`:** May be 1 or 2. Check current n8n-nodes-starter template on GitHub.
- **pnpm link compatibility with n8n:** Must be tested empirically in Phase 1. If broken, fall back to npm workspaces.
- **iFirma HMAC signing format:** Documentation is sparse. Plan for 1-2 days of exploratory testing against the real sandbox API.
- **Przelewy24 CRC field order:** Must be verified against current P24 API docs. The field order differs between registration and verification endpoints.
- **GUS REGON SOAP envelope format:** Need to capture actual working SOAP requests from the test environment. Consider the `soap` npm library if handcrafted XML proves too fragile.
- **n8n Creator Portal submission process:** Verify current requirements at docs.n8n.io before submitting first node for verification badge.
- **Declarative routing `send.paginate` syntax:** Verify in current n8n version. If unsupported, implement pagination manually in programmatic style even for nodes that could otherwise be declarative.

## Sources

### Primary (HIGH confidence)
- Project CLAUDE.md and PROJECT.md -- direct project requirements, constraints, and API-specific notes
- npm package.json conventions -- stable, well-documented
- TypeScript compiler options -- stable API
- GitHub Actions OIDC token permissions -- well-documented

### Secondary (MEDIUM confidence)
- n8n node development docs (training data, not live-verified) -- node structure, credential patterns, error handling
- n8n-nodes-starter template (training data) -- package.json conventions, n8n field format, peer dependency pattern
- npm provenance attestation docs (documented since npm 9.5.0, 2023)
- pnpm workspace documentation -- stable API

### Tertiary (LOW confidence)
- iFirma HMAC-SHA1 exact signing algorithm -- sparse docs, needs sandbox verification
- Przelewy24 CRC SHA384 field order -- may have changed since training data
- GUS REGON SOAP envelope and session format -- needs live testing
- n8n Creator Portal verification requirements -- may have evolved
- n8n `n8nNodesApiVersion` current value -- may have incremented to 2

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
