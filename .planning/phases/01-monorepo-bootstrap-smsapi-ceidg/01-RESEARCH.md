# Phase 1: Monorepo Bootstrap + SMSAPI + CEIDG - Research

**Researched:** 2026-03-20
**Domain:** n8n community node monorepo (pnpm workspaces, @n8n/node-cli, declarative nodes, npm provenance)
**Confidence:** HIGH (all critical findings verified against live source code in `/Users/mploneczka/projects/n8nexamples/n8n`)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use **pnpm workspaces** — aligns with n8n core repo conventions (pnpm-workspace.yaml confirmed in n8n source)
- **D-02:** Validate `pnpm link` compatibility with `~/.n8n/custom` as part of Phase 1 pipeline validation plan (01-10). If broken, escalate before proceeding to Phase 2.
- **D-03:** Use **`@n8n/node-cli`** (v0.23.0, confirmed existing in n8n repo) for build/lint/dev. Do NOT use `n8n-node-dev` or plain `tsc`.
- **D-04:** Scripts per package: `build` → `n8n-node build`, `dev` → `n8n-node dev`, `lint` → `n8n-node lint`, `release` → `n8n-node release`, `prepublishOnly` → `n8n-node prerelease`
- **D-05:** `n8n-node build` handles SVG and `.node.json` asset copying automatically — no manual copy-assets step needed. **[CORRECTED below — see Critical Finding #1]**
- **D-06:** Per-package layout: `nodes/ServiceName/`, `credentials/`, `icons/` at package root — no `src/` prefix
- **D-07:** Icons live in `icons/` at package root, referenced in nodes and credentials as `file:../icons/service.svg` (light) and optionally `file:../icons/service.dark.svg`
- **D-08:** n8nNodesApiVersion: **1** (confirmed current value from all @n8n/node-cli templates)
- **D-09:** Use **placeholder SVGs** for Phase 1 (simple 60x60 colored rectangle with service initials). Real official logos sourced and converted before v1.0 publish.
- **D-10:** Test runner: **Jest 29 + ts-jest + nock** (matches nodes-base pattern, proven with n8n node testing)
- **D-11:** Shared test utilities in `shared/test-utils/` (NOT a published package). Create a `createMockExecuteFunctions()` function inspired by `nodes-base/test/nodes/Helpers.ts` but WITHOUT `n8n-core` dependency. Mock must implement: `getNodeParameter()`, `getNode()`, `getWorkflow()`, `continueOnFail()`, `helpers.httpRequestWithAuthentication()`, `helpers.assertBinaryData()`.
- **D-12:** Each package gets its own `jest.config.js` extending a root `jest.config.base.js`. Tests live in `nodes/ServiceName/__tests__/` or `__tests__/` at package root.
- **D-13:** Use `IAuthenticateGeneric` with `authenticate` and `test` properties. SMSAPI uses Bearer token: `Authorization: Bearer {{$credentials?.apiToken}}`. CEIDG uses API key header: `Authorization: {{$credentials?.apiKey}}`.
- **D-14:** Both credentials implement `ICredentialTestRequest` to enable "Test Connection" in n8n UI.
- **D-15:** `format=json` injected in `requestDefaults.qs` at node level, NOT per-operation.
- **D-16:** Declarative style throughout SMSAPI — use `routing` in operations. No `execute()` method.
- **D-17:** Declarative style throughout CEIDG — pure `routing` definitions, no `execute()`.
- **D-18:** CEIDG is the publish pipeline guinea pig: build → link → verify n8n discovery → dry-run publish with provenance. Do this before SMSAPI.
- **D-19:** Root `package.json` uses pnpm workspaces with `packages/*` and `shared/*` globs.
- **D-20:** Root scripts: `build:all`, `lint:all`, `test:all` using `pnpm --filter` syntax.
- **D-21:** Root devDependencies hold all shared tooling: TypeScript, Jest, ts-jest, nock, ESLint, @n8n/node-cli, n8n-workflow.

### Claude's Discretion

- Exact placeholder SVG design (color, initials, font)
- Root `tsconfig.base.json` exact compiler options (must include: strict, target ES2021, module commonjs, declaration true)
- ESLint config specifics (use @n8n/node-cli's built-in ESLint config via `extends: ['./node_modules/@n8n/node-cli/eslint']`)
- Jest coverage thresholds
- Whether to use `pnpm --recursive` or `pnpm --filter` in root scripts

### Deferred Ideas (OUT OF SCOPE)

- Real official SVG logos for SMSAPI and CEIDG — sourced before v1.0 publish (not Phase 1)
- `continueOnFail()` support in SMSAPI — both nodes are declarative; continueOnFail is automatic in declarative style
- Retry with exponential backoff — rate limit retry deferred to Phase 5 (BaseLinker) where it's first needed
- Shared XML parser package — defer to Phase 7 when both wFirma and GUS REGON are being built

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Monorepo z pnpm workspaces — wspólny root package.json, packages/ directory, wspólny tooling | D-19, D-21: pnpm-workspace.yaml with `packages/*` and `shared/*` globs; verified pnpm v8+ stable |
| INFRA-02 | Wspólny tsconfig.json (base) dziedziczony przez każdy package | Template tsconfig verified: es2019 target, strict, commonjs, resolveJsonModule |
| INFRA-03 | Root-level skrypty: `build:all`, `lint:all`, `test:all` | D-20: use `pnpm --filter` syntax; root package is private |
| INFRA-04 | GitHub Actions workflow publish.yml z `--provenance` flag i `id-token: write` permission | Architecture verified: tag pattern `n8n-nodes-*@*`, Sigstore OIDC |
| INFRA-05 | Shared test utilities — mock `IExecuteFunctions` i `this.helpers.httpRequest()` dla nock | D-11: createMockExecuteFunctions() without n8n-core; strip constructExecutionMetaData |
| INFRA-06 | README.md root z listą node'ów, badges npm, link do każdego package | Standard markdown; npm badge URL pattern documented |
| INFRA-07 | LICENSE (MIT) i .gitignore (node_modules, dist) | Standard; no surprises |
| SMSAPI-01 | Credentials — Bearer Token (apiToken) z `documentationUrl` do docs SMSAPI | D-13: IAuthenticateGeneric with Bearer, ICredentialTestRequest on /profile |
| SMSAPI-02 | Resource: SMS — operacja Send z `format=json` w query params | D-15: inject in requestDefaults.qs; NEVER per-operation |
| SMSAPI-03 | Resource: SMS — operacja Send Group | Declarative routing; group param targets /sms.do with `group` param |
| SMSAPI-04 | Resource: SMS — operacja Get Report | GET /sms.do with messageId; format=json from requestDefaults covers this |
| SMSAPI-05 | Resource: Contacts — operacje List, Create, Update, Delete | /contacts endpoints return JSON natively; no format=json needed (still injected via requestDefaults) |
| SMSAPI-06 | Resource: Groups — operacja List | GET /contacts/groups |
| SMSAPI-07 | Resource: Account — operacja Balance | GET /profile |
| SMSAPI-08 | Obsługa błędów HTTP jako `NodeApiError` | Declarative nodes get automatic error handling; verify error object shape |
| SMSAPI-09 | Testy z nock — happy path + error handling | nock v14.0.11 confirmed; disableNetConnect pattern documented |
| SMSAPI-10 | package.json z keyword `n8n-community-node-package`, pole `n8n` z paths do dist | Canonical package.json template verified from @n8n/node-cli |
| SMSAPI-11 | Plik codex (.node.json) — categories: Communication, subcategory: SMS | CRITICAL: must be manually copied to dist/ — n8n-node build does NOT copy .node.json files |
| SMSAPI-12 | Ikona SVG 60x60 | D-09: placeholder for Phase 1; icons/ directory, file: reference in node description |
| SMSAPI-13 | README z opisem, example workflow JSON, link do API docs | Standard markdown; document SMSAPI.pl format=json requirement |
| CEIDG-01 | Credentials — API Key w header Authorization | D-13: IAuthenticateGeneric with header auth |
| CEIDG-02 | Resource: Companies — operacja Search by NIP | GET /firmy?nip={nip} |
| CEIDG-03 | Resource: Companies — operacja Search by Name | GET /firmy?nazwa={name} |
| CEIDG-04 | Resource: Companies — operacja Get | GET /firmy/{id} |
| CEIDG-05 | Styl deklaratywny (routing) — żadnego execute() method | D-17: confirmed possible for CEIDG (GET-only, JSON, API key) |
| CEIDG-06 | Obsługa błędów HTTP jako `NodeApiError` | Automatic in declarative style |
| CEIDG-07 | Testy z nock — happy path + error handling | Same pattern as SMSAPI tests |
| CEIDG-08 | package.json, codex, SVG ikona, README | Same as SMSAPI-10..13; CEIDG goes first as guinea pig (D-18) |

</phase_requirements>

---

## Summary

Phase 1 establishes the entire monorepo infrastructure and delivers two published declarative nodes. All locked decisions in CONTEXT.md have been verified against the live n8n source in `/Users/mploneczka/projects/n8nexamples/n8n`. One critical correction to D-05 is documented below.

The `@n8n/node-cli` (v0.23.0) exists and is confirmed working. The canonical project structure uses `nodes/ServiceName/` (no `src/` prefix), `credentials/`, and `icons/` directories at package root. The template tsconfig targets `es2019` (not ES2021 as some prior research suggested), uses strict mode and commonjs output. The `n8n-node build` command compiles TypeScript and copies `**/*.{png,svg}` and `**/__schema__/**/*.json` — it does NOT copy `.node.json` codex files, which must be handled separately.

n8n's directory loader derives the codex file path by taking the node's `.js` path and appending `on` (`.js` → `.json`). For `dist/nodes/Smsapi/Smsapi.node.js`, it looks for `dist/nodes/Smsapi/Smsapi.node.json`. Without this file in `dist/`, the node loads but has no categories/subcategories in the n8n UI. A post-build copy step is required in each package's `build` script.

**Primary recommendation:** Use `@n8n/node-cli` for build/lint/dev per D-03/D-04, but add `"postbuild": "node -e \"const g=require('fast-glob');const {cp,mkdir}=require('fs/promises');g.sync(['**/*.node.json'],{ignore:['dist','node_modules']}).forEach(async f=>{const d='dist/'+f;await mkdir(require('path').dirname(d),{recursive:true});await cp(f,d)});\""` to each package — or use a simpler shell glob in the scripts.

---

## Critical Findings (Corrections to CONTEXT.md)

### Critical Finding #1: D-05 is INCORRECT — `.node.json` files NOT copied by `n8n-node build`

**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/commands/build.ts` (verified)

The `copyStaticFiles()` function in `n8n-node build` uses this glob:
```typescript
const staticFiles = glob.sync(['**/*.{png,svg}', '**/__schema__/**/*.json'], {
  ignore: ['dist', 'node_modules'],
});
```

`.node.json` codex files in `nodes/ServiceName/` do NOT match `**/*.{png,svg}` nor `**/__schema__/**/*.json`. They will NOT be copied to `dist/` automatically.

**n8n's codex loading mechanism** (verified in `/Users/mploneczka/projects/n8nexamples/n8n/packages/core/src/nodes-loader/directory-loader.ts` line 340):
```typescript
const codexFilePath = this.resolvePath(`${filePath}on`); // .js to .json
```

n8n derives the codex path by appending `on` to the `.js` path. For community nodes, if the file doesn't exist, it falls back gracefully (no categories shown), but the node WILL load. However, for proper categorization and n8n Creator Portal verification, the codex MUST be present in `dist/`.

**Fix:** Add an explicit copy step in each package's `package.json`:
```json
{
  "scripts": {
    "build": "n8n-node build && node scripts/copy-codex.js"
  }
}
```
Or use a one-liner in the build script to copy `**/*.node.json` files to `dist/`.

### Critical Finding #2: Template tsconfig target is `es2019`, not `ES2021`

**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/tsconfig.json` (verified)

The `@n8n/node-cli` template uses `"target": "es2019"`, not ES2021. The CONTEXT.md discretion area says "must include: target ES2021" — ES2021 is acceptable (it's a superset), but to exactly match the n8n official template, use `es2019`. Either works with Node 18+. Recommendation: use `es2019` to stay aligned with official templates.

### Critical Finding #3: `n8n-node build` uses `pnpm exec` internally, not `npm exec`

**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/commands/build.ts` build tests show `mockSpawn('pnpm', ['exec', '--', 'tsc'], ...)`

The build command internally invokes `pnpm exec tsc`. This is fine since the project uses pnpm (D-01), but confirms pnpm must be installed in the environment.

### Critical Finding #4: `n8n-node dev` watches `src/` directory

**Source:** `@n8n/node-cli` README states: "Watches for changes in your `src/` directory"

The `n8n-node dev` command links to `~/.n8n-node-cli/.n8n/custom` (NOT `~/.n8n/custom`). For local n8n testing via `pnpm link`, use `~/.n8n/custom` manually. `n8n-node dev` manages its own custom user folder at `~/.n8n-node-cli` by default.

### Critical Finding #5: Package.json template includes `"n8n": { "strict": true }`

**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/package.json` (verified)

The canonical template includes `"strict": true` in the `n8n` field. This enables cloud eligibility mode in the linter — stricter ESLint rules aligned with n8n Cloud verification requirements. Include this for all packages.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @n8n/node-cli | 0.23.0 | Build/lint/dev/release CLI | Official n8n tool; handles tsc, asset copying (SVGs/PNGs), ESLint config |
| n8n-workflow | 2.13.0 (peer) | Type definitions for nodes, credentials | Required runtime types; peer dep — n8n provides at runtime |
| typescript | 5.9.3 | TypeScript compilation | Locked by @n8n/node-cli template |
| pnpm | 8+ | Workspace management | D-01: matches n8n core repo conventions |

### Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jest | 30.3.0 | Test runner | All packages |
| ts-jest | 29.4.6 | TypeScript transformer for Jest | Enables TS source in tests without pre-compilation |
| nock | 14.0.11 | HTTP interceptor | Mock all external API calls in tests |
| @types/jest | 29.x | Type definitions for Jest | Required for TypeScript test files |

**Note on jest version:** `npm view jest version` returns 30.3.0, but the CONTEXT.md specifies Jest 29. The @n8n/node-cli template does not include Jest (test setup is per-community-node). Both 29 and 30 are viable. Use Jest 29 (D-10) for stability and alignment with nodes-base pattern.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| eslint | 9.32.0 | Linting | Managed by `n8n-node lint`; do not configure separately |
| prettier | 3.6.2 | Formatting | Managed by `n8n-node lint`; included in @n8n/node-cli |
| release-it | 19.x | Release workflow | Used by `n8n-node release`; no manual config needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| pnpm workspaces | npm workspaces | npm link simpler, but pnpm matches n8n core and prevents phantom deps (D-01 locked) |
| @n8n/node-cli | Plain tsc | @n8n/node-cli handles lint config, asset copying, and dev mode automatically |
| Jest | Vitest | Vitest is faster but @n8n/node-cli doesn't include it; Jest + nock is the proven n8n ecosystem stack |

**Installation (root):**
```bash
pnpm add -D @n8n/node-cli typescript jest@29 ts-jest@29 @types/jest nock eslint
```

**Per-package (minimal):**
```json
{
  "peerDependencies": { "n8n-workflow": "*" },
  "devDependencies": { "n8n-workflow": "*" }
}
```

**Version verification (performed 2026-03-20):**
- `@n8n/node-cli`: 0.23.0 (verified in n8nexamples repo AND via `npm view`)
- `n8n-workflow`: 2.13.0 (verified via `npm view`)
- `typescript`: 5.9.3 (verified via `npm view`)
- `nock`: 14.0.11 (verified via `npm view`)

---

## Architecture Patterns

### Recommended Project Structure

```
n8n-polish-nodes/
├── pnpm-workspace.yaml               # packages: ['packages/*', 'shared/*']
├── package.json                      # private: true, root scripts, devDependencies
├── tsconfig.base.json                # Shared compiler options (extends per-package)
├── jest.config.base.js               # Shared Jest base (extended per-package)
├── .github/
│   └── workflows/
│       ├── ci.yml                    # PR: lint + build + test all packages
│       └── publish.yml               # Tag push: build + test + publish single package
├── packages/
│   ├── n8n-nodes-ceidg/              # Published first (guinea pig)
│   │   ├── nodes/
│   │   │   └── Ceidg/
│   │   │       ├── Ceidg.node.ts
│   │   │       └── Ceidg.node.json   # Codex — must be copied to dist/ manually
│   │   ├── credentials/
│   │   │   └── CeidgApi.credentials.ts
│   │   ├── icons/
│   │   │   └── ceidg.svg             # Placeholder SVG for Phase 1
│   │   ├── __tests__/
│   │   │   └── Ceidg.node.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json             # extends ../../tsconfig.base.json
│   │   └── README.md
│   └── n8n-nodes-smsapi/             # Published after CEIDG pipeline validated
│       ├── nodes/
│       │   └── Smsapi/
│       │       ├── Smsapi.node.ts
│       │       ├── Smsapi.node.json
│       │       └── resources/        # Split SMS, Contacts, Groups, Account
│       │           ├── sms.ts
│       │           ├── contacts.ts
│       │           ├── groups.ts
│       │           └── account.ts
│       ├── credentials/
│       │   └── SmsapiApi.credentials.ts
│       ├── icons/
│       │   └── smsapi.svg
│       ├── __tests__/
│       │   └── Smsapi.node.test.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
├── shared/
│   └── test-utils/                   # NOT published — dev only
│       ├── index.ts
│       ├── mock-execute-functions.ts
│       └── nock-helpers.ts
└── scripts/
    ├── copy-codex.js                 # Post-build: copies .node.json to dist/
    └── verify-packages.js            # CI: validates all packages have required fields
```

### Pattern 1: Declarative Node with requestDefaults

**What:** Define all HTTP behavior in the node description using `routing` on properties. No `execute()` method.
**When to use:** APIs with standard REST patterns, JSON responses, Bearer/API key auth.

```typescript
// Source: /Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/nodes/GithubIssues/GithubIssues.node.ts
import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class SmsapiNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'SMSAPI',
    name: 'smsapi',
    icon: { light: 'file:../../icons/smsapi.svg' },
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Send SMS messages and manage contacts via SMSAPI.pl',
    defaults: { name: 'SMSAPI' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'smsapiApi', required: true }],
    requestDefaults: {
      baseURL: 'https://api.smsapi.pl',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      qs: {
        format: 'json',  // CRITICAL: inject here, never per-operation
      },
    },
    properties: [
      // resource selector, operation selector, then ...resourceDescription
    ],
  };
}
```

### Pattern 2: Credential with IAuthenticateGeneric + ICredentialTestRequest

**What:** Stateless credential type using generic auth (header injection) with a test endpoint.
**When to use:** API key or Bearer token auth where no OAuth flow is needed.

```typescript
// Source: /Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/credentials/GithubIssuesApi.credentials.ts
import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class SmsapiApi implements ICredentialType {
  name = 'smsapiApi';
  displayName = 'SMSAPI API';
  documentationUrl = 'https://www.smsapi.pl/docs';
  properties: INodeProperties[] = [
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials?.apiToken}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://api.smsapi.pl',
      url: '/profile',
      method: 'GET',
    },
  };
}
```

### Pattern 3: Resource-Split File Organization

**What:** Split node properties into separate files per resource. Main node file imports and spreads them.
**When to use:** Nodes with 3+ resources.

```typescript
// Source: GithubIssues template pattern
// nodes/Smsapi/resources/sms.ts — exports smsDescription: INodeProperties[]
// nodes/Smsapi/resources/contacts.ts — exports contactsDescription: INodeProperties[]
// nodes/Smsapi/Smsapi.node.ts:
import { smsDescription } from './resources/sms';
import { contactsDescription } from './resources/contacts';
// ...
properties: [
  resourceSelector,
  operationSelector,
  ...smsDescription,
  ...contactsDescription,
]
```

### Pattern 4: Declarative Routing — leaf property placement

**What:** Place `routing.send` on leaf properties (string, number, boolean), never on `collection` or `fixedCollection` parents.
**When to use:** Always in declarative nodes.

```typescript
// Source: getAll.ts in GithubIssues template
// CORRECT: routing on leaf inside collection
{
  displayName: 'Filters',
  name: 'filters',
  type: 'collection',
  default: {},
  options: [
    {
      displayName: 'State',
      name: 'state',
      type: 'options',
      default: 'open',
      routing: {
        request: { qs: { state: '={{$value}}' } },  // routing on leaf
      },
    },
  ],
}

// WRONG: routing on the collection parent — silently ignored
{
  displayName: 'Filters',
  name: 'filters',
  type: 'collection',
  routing: { ... },  // NEVER here
  options: [ ... ],
}
```

### Pattern 5: Mock IExecuteFunctions for Tests (no n8n-core)

**What:** Minimal mock that satisfies IExecuteFunctions for unit tests without depending on n8n-core.
**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/nodes-base/test/nodes/Helpers.ts` — strip `constructExecutionMetaData` import.

```typescript
// shared/test-utils/mock-execute-functions.ts
import get from 'lodash/get';
import type { IDataObject, IExecuteFunctions, IGetNodeParameterOptions, INode } from 'n8n-workflow';

export const createMockExecuteFunctions = (
  nodeParameters: IDataObject,
  nodeMock: Partial<INode> = { name: 'TestNode', type: 'test' },
  continueBool = false,
): Partial<IExecuteFunctions> =>
  ({
    getNodeParameter(
      parameterName: string,
      _itemIndex: number,
      fallbackValue?: unknown,
      options?: IGetNodeParameterOptions,
    ) {
      const parameter = options?.extractValue ? `${parameterName}.value` : parameterName;
      return get(nodeParameters, parameter, fallbackValue);
    },
    getNode() { return nodeMock as INode; },
    getWorkflow() { return { id: 'test-workflow-id', name: 'Test Workflow', active: false }; },
    continueOnFail() { return continueBool; },
    helpers: {
      httpRequestWithAuthentication: jest.fn(),
      // Do NOT include constructExecutionMetaData — requires n8n-core
    },
  }) as unknown as IExecuteFunctions;
```

### Pattern 6: Codex File Format

**What:** `.node.json` metadata file co-located with the node `.ts` file.
**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/nodes/GithubIssues/GithubIssues.node.json`

```json
{
  "node": "n8n-nodes-smsapi.smsapi",
  "nodeVersion": "1.0",
  "codexVersion": "1.0",
  "categories": ["Communication"],
  "resources": {
    "primaryDocumentation": [{ "url": "https://www.smsapi.pl/docs" }]
  }
}
```

**CRITICAL:** This file must be in `dist/nodes/Smsapi/Smsapi.node.json` at runtime. n8n derives the path: `Smsapi.node.js` → `Smsapi.node.json` (appends `on`). The `n8n-node build` command does NOT copy this file. A post-build script is required.

### Pattern 7: Post-Build Codex Copy Script

**What:** Script to copy `.node.json` files from source to `dist/` after `n8n-node build`.
**Source:** Derived from analysis of `build.ts` copyStaticFiles function.

```javascript
// scripts/copy-codex.js (run from package directory)
const { glob } = require('fast-glob'); // already a transitive dep of @n8n/node-cli
const { cp, mkdir } = require('fs/promises');
const path = require('path');

async function main() {
  const files = glob.sync(['**/*.node.json'], { ignore: ['dist', 'node_modules'] });
  await Promise.all(
    files.map(async (filePath) => {
      const destPath = path.join('dist', filePath);
      await mkdir(path.dirname(destPath), { recursive: true });
      await cp(filePath, destPath);
    }),
  );
}

main().catch(console.error);
```

Each package build script: `"build": "n8n-node build && node ../../scripts/copy-codex.js"`

### Pattern 8: Root pnpm Workspace Scripts

**What:** Root package.json orchestrating all workspace packages.

```json
{
  "name": "n8n-polish-nodes",
  "private": true,
  "scripts": {
    "build:all": "pnpm --filter './packages/*' run build",
    "lint:all": "pnpm --filter './packages/*' run lint",
    "test:all": "pnpm --filter './packages/*' run test",
    "clean:all": "pnpm --filter './packages/*' run clean"
  }
}
```

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
  - 'shared/*'
```

### Pattern 9: Per-Package package.json (canonical)

**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/package.json` (verified)

```json
{
  "name": "n8n-nodes-ceidg",
  "version": "0.1.0",
  "description": "n8n community node for CEIDG — Polish company registry lookup",
  "keywords": ["n8n-community-node-package", "n8n", "ceidg", "poland", "polish"],
  "license": "MIT",
  "author": {
    "name": "Michał Płoneczka",
    "email": "mp@codersgroup.pl",
    "url": "https://codersgroup.pl"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/michalploneczka/n8n-polish-nodes.git",
    "directory": "packages/n8n-nodes-ceidg"
  },
  "scripts": {
    "build": "n8n-node build && node ../../scripts/copy-codex.js",
    "dev": "n8n-node dev",
    "lint": "n8n-node lint",
    "lint:fix": "n8n-node lint --fix",
    "release": "n8n-node release",
    "prepublishOnly": "n8n-node prerelease",
    "test": "jest --config jest.config.js",
    "clean": "rm -rf dist"
  },
  "files": ["dist"],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": ["dist/credentials/CeidgApi.credentials.js"],
    "nodes": ["dist/nodes/Ceidg/Ceidg.node.js"]
  },
  "devDependencies": {
    "@n8n/node-cli": "*",
    "eslint": "9.32.0",
    "typescript": "5.9.2"
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  }
}
```

**Key notes:**
- `"files": ["dist"]` — only dist published, no test code or source TS
- `"n8n": { "strict": true }` — enables cloud eligibility lint mode
- `repository.directory` — required for npm provenance attribution
- n8n-workflow is peerDependency ONLY (no devDependency needed if hoisted from root)

### Pattern 10: Per-Package tsconfig.json

**Source:** `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/tsconfig.json` (verified)

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "commonjs",
    "moduleResolution": "node",
    "target": "es2019",
    "lib": ["es2019", "es2020", "es2022.error"],
    "removeComments": true,
    "useUnknownInCatchVariables": false,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "strictNullChecks": true,
    "preserveConstEnums": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "incremental": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "outDir": "./dist/"
  },
  "include": ["credentials/**/*", "nodes/**/*", "nodes/**/*.json", "package.json"]
}
```

**Note:** This is the verbatim template tsconfig. For the root `tsconfig.base.json`, use these same options minus `outDir` (set per-package). The `include` pattern `nodes/**/*.json` enables `resolveJsonModule` for JSON files but does NOT cause tsc to emit them — hence the manual copy step for `.node.json` files.

### Anti-Patterns to Avoid

- **ESM output:** Never set `"type": "module"` in package.json or `"module": "ESNext"` in tsconfig. n8n loads via `require()`. CommonJS only.
- **Bundling:** No webpack, rollup, or esbuild. n8n expects individual `.js` files that preserve directory structure.
- **Routing on collection parents:** Place `routing.send` only on leaf properties (string/number/boolean type).
- **format=json per-operation:** Must be in `requestDefaults.qs`, not duplicated on each operation.
- **n8n-core dependency:** Community nodes cannot depend on `n8n-core`. Strip `constructExecutionMetaData` from test mocks.
- **Publishing from local machine:** Always use GitHub Actions for provenance. No local `npm publish`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript compilation | Custom tsc wrapper | `n8n-node build` | Handles tsconfig lookup, clean dist/, spinner UX, pnpm exec |
| ESLint configuration | Custom .eslintrc | `n8n-node lint` (reads built-in config) | Ensures cloud eligibility rules; strict mode validation |
| SVG/PNG asset copying | Shell scripts | `n8n-node build` (built-in) | Already copies `**/*.{png,svg}` automatically |
| Release versioning | Manual bump scripts | `n8n-node release` (uses release-it) | Handles changelog, git tags, npm publish |
| HTTP mocking in tests | Custom fetch mocking | nock v14 | Intercepts at Node.js level; works with n8n's httpRequest helpers |
| Credential injection in tests | Real credentials | nock + createMockExecuteFunctions | Safe, offline, deterministic |
| Workspace scripts | Per-package Makefiles | `pnpm --filter` in root | Native pnpm feature, no extra tooling |

**Key insight:** The `@n8n/node-cli` abstracts most build complexity. Resist the urge to add separate tsc/eslint scripts — they will conflict with the CLI's internal config.

---

## Common Pitfalls

### Pitfall 1: Missing `format=json` breaks SMSAPI legacy endpoints

**What goes wrong:** `/sms.do` returns pipe-delimited plain text by default. n8n's declarative routing tries to parse it as JSON and fails silently or throws.

**Why it happens:** SMSAPI has legacy and modern endpoints. Only modern endpoints (`/contacts`, `/profile`) default to JSON.

**How to avoid:** Inject `format: 'json'` in `requestDefaults.qs` at the node level, verified from D-15. Never per-operation — it's a global override.

**Warning signs:** If only `/contacts` is tested and passes but `/sms.do` fails — this is the root cause.

### Pitfall 2: `.node.json` not in `dist/` — missing categories in n8n UI

**What goes wrong:** Node appears in n8n (it loads), but has no category/subcategory. On Creator Portal submission, missing codex fails review.

**Why it happens:** `n8n-node build` copies only PNGs, SVGs, and `__schema__/**/*.json`. `.node.json` files in `nodes/ServiceName/` are NOT copied.

**How to avoid:** Add `scripts/copy-codex.js` (Pattern 7) to each package's `build` script as a `&&` post-step.

**Warning signs:** After build, check `ls dist/nodes/Ceidg/` — if `Ceidg.node.json` is absent, the copy step is missing.

### Pitfall 3: `n8n.nodes` paths in package.json pointing to wrong locations

**What goes wrong:** Node installs but never appears in n8n node picker. Zero error messages.

**Why it happens:** Paths must point to compiled `.js` files in `dist/`, not `.ts` source files.

**How to avoid:** Always: `"dist/nodes/Ceidg/Ceidg.node.js"` (never `.ts`, never without `dist/` prefix). After build, verify: `node -e "require('./dist/nodes/Ceidg/Ceidg.node.js')"` should not throw.

**Warning signs:** `npm pack --dry-run` shows the expected file exists, but n8n still doesn't discover the node.

### Pitfall 4: npm provenance fails with OIDC error in GitHub Actions

**What goes wrong:** Publish step fails with `EOTP` or OIDC token errors.

**Why it happens:** Missing `id-token: write` permission in the workflow job, or using a fork PR context where OIDC tokens are unavailable.

**How to avoid:**
```yaml
permissions:
  contents: read
  id-token: write  # REQUIRED
```
Use `NODE_AUTH_TOKEN` secret (not `NPM_TOKEN`). Set `registry-url: 'https://registry.npmjs.org'` in `setup-node` step.

**Warning signs:** Works locally, fails in CI specifically at publish step.

### Pitfall 5: `n8n-node dev` uses its own n8n instance, not system n8n

**What goes wrong:** Running `n8n-node dev` starts a new n8n at `~/.n8n-node-cli` — not the user's existing n8n instance.

**Why it happens:** `n8n-node dev` manages its own `--custom-user-folder` at `~/.n8n-node-cli` by default.

**How to avoid:** For manual linking to an existing n8n: build with `n8n-node build`, then `pnpm link` from the package directory, then `pnpm link n8n-nodes-ceidg` in `~/.n8n/custom/`. Alternatively, use `n8n-node dev --external-n8n` to point at a running instance.

**Warning signs:** The node appears in one n8n instance but not the expected one.

### Pitfall 6: `routing.send` on collection/fixedCollection parents silently ignored

**What goes wrong:** Parameters silently not sent in API requests. API returns "missing required parameter" despite the field being filled in the UI.

**Why it happens:** n8n's declarative engine only processes `routing.send` on leaf properties.

**How to avoid:** Always place `routing.send` on `type: 'string'`, `type: 'number'`, `type: 'boolean'` properties. For optional parameters, use `type: 'collection'` with routing on child options.

**Warning signs:** nock test assertions on request body fail even though the field appears filled in the n8n UI.

### Pitfall 7: pnpm link symlink chains breaking n8n's module resolver

**What goes wrong:** After `pnpm link`, n8n fails to load the node with `Cannot find module` errors.

**Why it happens:** pnpm creates content-addressed symlinks that can create nested symlink structures n8n's CommonJS resolver doesn't follow.

**How to avoid:** This is what D-02 mandates validation of. Test procedure: `pnpm build` → `pnpm link --global` → `cd ~/.n8n/custom && pnpm link --global n8n-nodes-ceidg` → start n8n → verify node appears. If this fails, fall back to `npm link` (requires converting workspace to npm).

**Warning signs:** `ls -la ~/.n8n/custom/node_modules/n8n-nodes-ceidg` shows a broken symlink or missing files.

---

## Code Examples

### CEIDG Node — Complete Minimal Declarative Implementation

```typescript
// Source: derived from GithubIssues template pattern (verified in n8nexamples)
import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Ceidg implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'CEIDG',
    name: 'ceidg',
    icon: { light: 'file:../../icons/ceidg.svg' },
    group: ['input'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Search Polish company registry (CEIDG) by NIP, name, or ID',
    defaults: { name: 'CEIDG' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'ceidgApi', required: true }],
    requestDefaults: {
      baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v2',
      headers: { Accept: 'application/json' },
    },
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [{ name: 'Company', value: 'company' }],
        default: 'company',
      },
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['company'] } },
        options: [
          { name: 'Get', value: 'get', action: 'Get a company by ID', routing: { request: { method: 'GET', url: '=/firmy/{{$parameter["id"]}}' } } },
          { name: 'Search by NIP', value: 'searchByNip', action: 'Search by NIP', routing: { request: { method: 'GET', url: '/firmy' } } },
          { name: 'Search by Name', value: 'searchByName', action: 'Search by name', routing: { request: { method: 'GET', url: '/firmy' } } },
        ],
        default: 'searchByNip',
      },
      // ... fields per operation
    ],
  };
}
```

### CEIDG Credential

```typescript
// Source: GithubIssuesApi.credentials.ts pattern (verified)
import type { IAuthenticateGeneric, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class CeidgApi implements ICredentialType {
  name = 'ceidgApi';
  displayName = 'CEIDG API';
  documentationUrl = 'https://dane.biznes.gov.pl/api';
  properties: INodeProperties[] = [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'API key from dane.biznes.gov.pl (free registration)',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '={{$credentials?.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: 'https://dane.biznes.gov.pl/api/ceidg/v2',
      url: '/firmy?nip=1234567890',  // test with a known-invalid NIP (400 is fine, 401 is auth failure)
      method: 'GET',
    },
  };
}
```

### Nock Test Pattern for Declarative Nodes

```typescript
// Note: Declarative nodes don't have execute() — testing requires calling n8n's routing engine
// For Phase 1, test at the HTTP level via nock + a minimal test workflow execution
import nock from 'nock';

describe('Ceidg Node', () => {
  beforeAll(() => nock.disableNetConnect());
  afterEach(() => nock.cleanAll());
  afterAll(() => nock.enableNetConnect());

  it('should search by NIP', async () => {
    const scope = nock('https://dane.biznes.gov.pl')
      .get('/api/ceidg/v2/firmy')
      .query({ nip: '1234567890' })
      .reply(200, { content: [{ id: 'test-id', nazwa: 'Test Firma' }] });

    // Execute via mock context or route the declarative call
    // Verify scope was hit
    expect(scope.isDone()).toBe(true);
  });
});
```

### GitHub Actions Publish Workflow

```yaml
# .github/workflows/publish.yml
name: Publish Package

on:
  push:
    tags:
      - 'n8n-nodes-*@*'  # e.g., n8n-nodes-ceidg@0.1.0

permissions:
  contents: read
  id-token: write  # Required for npm provenance attestation

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: pnpm

      - run: pnpm install

      - name: Parse tag
        id: tag
        run: |
          TAG="${GITHUB_REF#refs/tags/}"
          PACKAGE_NAME="${TAG%@*}"
          VERSION="${TAG##*@}"
          echo "package=$PACKAGE_NAME" >> $GITHUB_OUTPUT
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "dir=packages/$PACKAGE_NAME" >> $GITHUB_OUTPUT

      - name: Verify version
        run: |
          PKG_VERSION=$(node -p "require('./${{ steps.tag.outputs.dir }}/package.json').version")
          if [ "$PKG_VERSION" != "${{ steps.tag.outputs.version }}" ]; then
            echo "::error::Version mismatch: tag=${{ steps.tag.outputs.version }} package.json=$PKG_VERSION"
            exit 1
          fi

      - name: Build
        run: pnpm --filter ${{ steps.tag.outputs.package }} run build

      - name: Test
        run: pnpm --filter ${{ steps.tag.outputs.package }} run test

      - name: Publish with provenance
        run: npm publish --provenance --access public
        working-directory: ${{ steps.tag.outputs.dir }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `n8n-node-dev` (old CLI) | `@n8n/node-cli` (new official CLI) | 2024 | New CLI handles build, lint, dev, release with richer UX |
| Manual `tsc` + shell copy scripts | `n8n-node build` (auto-copies PNGs/SVGs) | 2024 | Less boilerplate, but `.node.json` still needs manual copy |
| `n8nNodesApiVersion: 2` speculation | `n8nNodesApiVersion: 1` (confirmed current) | Ongoing | Templates still use v1; no migration needed |
| `npm workspaces` (initial research) | `pnpm workspaces` (locked D-01) | n8n core uses pnpm | Better dep isolation; pnpm link needs validation |
| Separate ESLint config per package | `n8n-node lint` manages ESLint internally | 2024 | Simpler; must enable `"strict": true` in n8n field for cloud eligibility |
| `NPM_TOKEN` secret | `NODE_AUTH_TOKEN` secret with `id-token: write` | npm 9.5.0 (2023) | Enables SLSA provenance attestation |

**Deprecated/outdated:**
- `n8n-node-dev`: Still exists on npm but superseded by `@n8n/node-cli`. Do NOT use.
- `n8nNodesApiVersion: 2`: Not in any current official template. Use version 1.
- Manual `tsc --watch` for dev: `n8n-node dev` provides hot-reload with auto-linking.

---

## Open Questions

1. **pnpm link compatibility with n8n's custom node directory**
   - What we know: pnpm creates content-addressed symlinks; n8n uses `require()` to load nodes
   - What's unclear: Whether pnpm's symlink structure causes issues with n8n's directory traversal
   - Recommendation: D-02 mandates empirical validation in plan 01-10. Have a fallback plan (npm workspaces) if broken.

2. **`n8n-node dev` internal n8n version vs user's n8n**
   - What we know: `n8n-node dev` installs its own n8n (at `~/.n8n-node-cli`) — version may differ from user's installed n8n
   - What's unclear: Whether API compatibility differences affect declarative node behavior between n8n versions
   - Recommendation: Use `n8n-node dev --external-n8n` to test against a specific n8n version.

3. **CEIDG API test endpoint for credential test**
   - What we know: Base URL is `https://dane.biznes.gov.pl/api/ceidg/v2/`, GET `/firmy?nip=X` works
   - What's unclear: Whether an invalid NIP returns 400 (acceptable for test) or 200 with empty content
   - Recommendation: Use a known test NIP from CEIDG test accounts, or accept 400 as proof-of-connectivity.

4. **SMSAPI `/profile` endpoint availability without credit**
   - What we know: `/profile` returns account balance and is the recommended credential test endpoint
   - What's unclear: Whether test-mode accounts have access to `/profile`
   - Recommendation: Create an SMSAPI test account (free, unlimited in `test=1` mode) before implementing credential test.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest 29 |
| Config file | `jest.config.base.js` (root) + `jest.config.js` (per-package) |
| Quick run command | `pnpm --filter n8n-nodes-ceidg test` |
| Full suite command | `pnpm test:all` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | pnpm workspace resolves all packages | integration | `pnpm install && pnpm build:all` | ❌ Wave 0 |
| INFRA-02 | tsconfig.base.json inherited by packages | build check | `pnpm --filter n8n-nodes-ceidg build` (no tsc errors) | ❌ Wave 0 |
| INFRA-03 | Root scripts work across workspace | smoke | `pnpm build:all && pnpm lint:all && pnpm test:all` | ❌ Wave 0 |
| INFRA-04 | GitHub Actions publish workflow triggers on tag | manual | Push test tag, verify Actions run | ❌ Wave 0 |
| INFRA-05 | createMockExecuteFunctions works without n8n-core | unit | `pnpm --filter n8n-nodes-ceidg test` | ❌ Wave 0 |
| SMSAPI-01 | Bearer token credential passes test connection | manual | Connect to n8n with test SMSAPI account | ❌ Wave 0 |
| SMSAPI-02 | SMS Send injects format=json in request | unit | `pnpm --filter n8n-nodes-smsapi test -- --testNamePattern="SMS Send"` | ❌ Wave 0 |
| SMSAPI-08 | HTTP errors return NodeApiError | unit | `pnpm --filter n8n-nodes-smsapi test -- --testNamePattern="error"` | ❌ Wave 0 |
| SMSAPI-09 | All operations have nock tests | unit | `pnpm --filter n8n-nodes-smsapi test` | ❌ Wave 0 |
| CEIDG-02..04 | All 3 CEIDG operations work | unit | `pnpm --filter n8n-nodes-ceidg test` | ❌ Wave 0 |
| CEIDG-05 | No execute() method in CEIDG | linter | `pnpm --filter n8n-nodes-ceidg lint` (no-restricted-syntax rule) | ❌ Wave 0 |
| INFRA-04 | provenance badge on npmjs.com after publish | manual | Inspect npmjs.com package page | manual-only |

### Sampling Rate

- **Per task commit:** `pnpm --filter <package> run test`
- **Per wave merge:** `pnpm test:all && pnpm lint:all && pnpm build:all`
- **Phase gate:** Full suite green + manual n8n link test + CEIDG published to npm with provenance badge visible

### Wave 0 Gaps

- [ ] `packages/n8n-nodes-ceidg/__tests__/Ceidg.node.test.ts` — covers CEIDG-02, CEIDG-03, CEIDG-04, CEIDG-06, CEIDG-07
- [ ] `packages/n8n-nodes-smsapi/__tests__/Smsapi.node.test.ts` — covers SMSAPI-02 through SMSAPI-09
- [ ] `shared/test-utils/index.ts` + `mock-execute-functions.ts` + `nock-helpers.ts` — covers INFRA-05
- [ ] `jest.config.base.js` (root) — shared Jest base config
- [ ] `packages/n8n-nodes-ceidg/jest.config.js` and `packages/n8n-nodes-smsapi/jest.config.js`
- [ ] Framework install: `pnpm add -D jest@29 ts-jest@29 @types/jest nock` (root devDependencies)
- [ ] `scripts/copy-codex.js` — covers SMSAPI-11 and CEIDG-08 (codex in dist/)

---

## Sources

### Primary (HIGH confidence)

- `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/commands/build.ts` — verified `copyStaticFiles()` glob patterns
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/@n8n/node-cli/src/template/templates/declarative/github-issues/template/` — canonical package.json, tsconfig.json, node TS pattern, credential pattern, codex JSON format
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/core/src/nodes-loader/directory-loader.ts` line 340 — verified codex `.json` path derivation (`filePath + 'on'`)
- `/Users/mploneczka/projects/n8nexamples/n8n/packages/nodes-base/test/nodes/Helpers.ts` — `createMockExecuteFunction` pattern (uses n8n-core; community version strips constructExecutionMetaData)
- `npm view @n8n/node-cli version` → 0.23.0; `npm view n8n-workflow version` → 2.13.0; `npm view typescript version` → 5.9.3; `npm view nock version` → 14.0.11; `npm view jest version` → 30.3.0

### Secondary (MEDIUM confidence)

- CONTEXT.md decisions (D-01 through D-21) — locked decisions from `/gsd:discuss-phase` session
- `.planning/research/ARCHITECTURE.md` — monorepo architecture patterns and GitHub Actions workflow templates
- `.planning/research/PITFALLS.md` — SMSAPI format=json pitfall and other node-specific gotchas

### Tertiary (LOW confidence)

- SMSAPI.pl API behavior (CONTEXT.md notes + prior research; not live-verified against sandbox)
- CEIDG test endpoint behavior for credential testing (not live-verified)
- pnpm link compatibility with n8n's node loader (empirical validation pending per D-02)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via npm view and n8nexamples source
- Architecture: HIGH — canonical patterns read directly from @n8n/node-cli template source
- Critical Finding #1 (D-05 correction): HIGH — verified in build.ts source code + directory-loader.ts
- Pitfalls: HIGH for infrastructure (verified in source); MEDIUM for SMSAPI API behavior (not live-tested)
- Test patterns: MEDIUM — Jest + nock architecture is well-established; exact test harness needs Wave 0 scaffolding

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (90 days — @n8n/node-cli stable API, pnpm workspaces stable, npm provenance stable)
