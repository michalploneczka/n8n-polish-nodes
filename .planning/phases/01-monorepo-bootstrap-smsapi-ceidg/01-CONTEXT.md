# Phase 1: Monorepo Bootstrap + SMSAPI + CEIDG - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the complete monorepo infrastructure and publish two declarative nodes: SMSAPI (SMS gateway) and CEIDG (government company registry). Phase goal is a working build/test/lint pipeline, shared test harness, and validated npm provenance publish workflow using CEIDG as the guinea pig.

Creating additional nodes (Fakturownia, InPost, etc.) is explicitly out of scope for this phase.

</domain>

<decisions>
## Implementation Decisions

### Package manager
- **D-01:** Use **pnpm workspaces** — aligns with n8n core repo conventions (pnpm-workspace.yaml confirmed in n8n source)
- **D-02:** Validate `pnpm link` compatibility with `~/.n8n/custom` as part of Phase 1 pipeline validation plan (01-10). If broken, escalate before proceeding to Phase 2.

### Build tooling
- **D-03:** Use **`@n8n/node-cli`** (v0.23.0, confirmed existing in n8n repo) for build/lint/dev. Do NOT use `n8n-node-dev` or plain `tsc`.
- **D-04:** Scripts per package: `build` → `n8n-node build`, `dev` → `n8n-node dev`, `lint` → `n8n-node lint`, `release` → `n8n-node release`, `prepublishOnly` → `n8n-node prerelease`
- **D-05:** `n8n-node build` handles SVG and `.node.json` asset copying automatically — no manual copy-assets step needed

### Directory structure (per @n8n/node-cli template)
- **D-06:** Per-package layout: `nodes/ServiceName/`, `credentials/`, `icons/` at package root — no `src/` prefix (CLAUDE.md structure is correct)
- **D-07:** Icons live in `icons/` at package root, referenced in nodes and credentials as `file:../icons/service.svg` (light) and optionally `file:../icons/service.dark.svg`
- **D-08:** n8nNodesApiVersion: **1** (confirmed current value from all @n8n/node-cli templates)

### SVG icons
- **D-09:** Use **placeholder SVGs** for Phase 1 (simple 60x60 colored rectangle with service initials). Real official logos sourced and converted before v1.0 publish. Pipeline validation does not require production-quality logos.

### Test harness
- **D-10:** Test runner: **Jest 29 + ts-jest + nock** (matches nodes-base pattern, proven with n8n node testing)
- **D-11:** Shared test utilities in `shared/test-utils/` (NOT a published package). Create a `createMockExecuteFunctions()` function inspired by `nodes-base/test/nodes/Helpers.ts` but WITHOUT `n8n-core` dependency (community nodes cannot depend on n8n-core). Mock must implement: `getNodeParameter()`, `getNode()`, `getWorkflow()`, `continueOnFail()`, `helpers.httpRequestWithAuthentication()`, `helpers.assertBinaryData()`.
- **D-12:** Each package gets its own `jest.config.js` extending a root `jest.config.base.js`. Tests live in `nodes/ServiceName/__tests__/` or `__tests__/` at package root.

### Credential pattern
- **D-13:** Use `IAuthenticateGeneric` with `authenticate` and `test` properties (per @n8n/node-cli credential template). SMSAPI uses Bearer token: `Authorization: Bearer {{$credentials?.apiToken}}`. CEIDG uses API key header: `Authorization: {{$credentials?.apiKey}}`.
- **D-14:** Both credentials implement `ICredentialTestRequest` to enable "Test Connection" in n8n UI.

### SMSAPI-specific
- **D-15:** `format=json` injected in `requestDefaults.qs` at node level, NOT per-operation. This ensures all legacy `/sms.do` calls return JSON.
- **D-16:** Declarative style throughout — use `routing` in operations. No `execute()` method.

### CEIDG-specific
- **D-17:** Declarative style throughout — pure `routing` definitions, no `execute()`.
- **D-18:** CEIDG is the publish pipeline guinea pig: build → link → verify n8n discovery → dry-run publish with provenance. Do this before SMSAPI.

### Monorepo root
- **D-19:** Root `package.json` uses pnpm workspaces with `packages/*` and `shared/*` globs.
- **D-20:** Root scripts: `build:all`, `lint:all`, `test:all` using `pnpm --filter` syntax.
- **D-21:** Root devDependencies hold all shared tooling: TypeScript, Jest, ts-jest, nock, ESLint, @n8n/node-cli, n8n-workflow.

### Claude's Discretion
- Exact placeholder SVG design (color, initials, font)
- Root `tsconfig.base.json` exact compiler options (must include: strict, target ES2021, module commonjs, declaration true)
- ESLint config specifics (use @n8n/node-cli's built-in ESLint config via `extends: ['./node_modules/@n8n/node-cli/eslint']`)
- Jest coverage thresholds
- Whether to use `pnpm --recursive` or `pnpm --filter` in root scripts

</decisions>

<specifics>
## Specific Ideas

- Reference pattern for declarative credential: `packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/credentials/GithubIssuesApi.credentials.ts` in the n8n examples repo
- Reference pattern for declarative node: `packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/nodes/GithubIssues/GithubIssues.node.ts`
- Reference test mock: `packages/nodes-base/test/nodes/Helpers.ts` — but strip `n8n-core` import and `constructExecutionMetaData` (not available to community nodes)
- n8n examples repo path: `/Users/mploneczka/projects/n8nexamples/n8n` — 305 official nodes as reference implementations

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### @n8n/node-cli templates (authoritative structure)
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/README.md` — CLI commands (build/dev/lint/release), project structure expectations
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/nodes/GithubIssues/GithubIssues.node.ts` — canonical declarative node pattern (requestDefaults, routing, resource/operation)
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/credentials/GithubIssuesApi.credentials.ts` — canonical credential pattern (IAuthenticateGeneric, ICredentialTestRequest)
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/package.json` — canonical package.json with n8n field, scripts, peerDependencies

### Test utilities reference
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/nodes-base/test/nodes/Helpers.ts` — createMockExecuteFunction pattern (strip n8n-core dependency for community use)

### Project planning docs
- `.planning/REQUIREMENTS.md` §INFRA, §SMSAPI Node, §CEIDG Node — all requirement IDs for Phase 1
- `.planning/ROADMAP.md` §Phase 1 — 10 plans, success criteria, technical notes
- `.planning/research/SUMMARY.md` — contested decisions analysis (pnpm vs npm, changesets vs tags, shared package patterns)
- `.planning/research/PITFALLS.md` — critical pitfalls to avoid (format=json, dist/ paths, provenance OIDC)
- `.planning/research/ARCHITECTURE.md` — monorepo architecture decisions with rationale

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- n8n examples at `/Users/mploneczka/projects/n8nexamples/n8n/packages/nodes-base/nodes/` — 305 nodes as reference implementations for naming conventions, property patterns, error handling

### Established Patterns
- `@n8n/node-cli` manages build/lint/dev — do not add separate tsc/rollup build steps
- pnpm-workspace.yaml at root, per-package package.json with `n8n` field pointing to `dist/`
- n8nNodesApiVersion: 1 throughout

### Integration Points
- `pnpm link` output → `~/.n8n/custom/` for local n8n testing
- GitHub Actions `publish.yml`: tag pattern `package-name@version`, `id-token: write`, `--provenance` flag

</code_context>

<deferred>
## Deferred Ideas

- Real official SVG logos for SMSAPI and CEIDG — sourced before v1.0 publish (not Phase 1)
- `continueOnFail()` support in SMSAPI — both nodes are declarative; continueOnFail is automatic in declarative style
- Retry with exponential backoff — rate limit retry deferred to Phase 5 (BaseLinker) where it's first needed
- Shared XML parser package — defer to Phase 7 when both wFirma and GUS REGON are being built

</deferred>

---

*Phase: 01-monorepo-bootstrap-smsapi-ceidg*
*Context gathered: 2026-03-20*
