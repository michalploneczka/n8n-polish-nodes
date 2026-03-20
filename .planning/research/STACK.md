# Technology Stack

**Project:** n8n Polish Nodes (community node monorepo)
**Researched:** 2026-03-20
**Overall Confidence:** MEDIUM -- based on training data (May 2025 cutoff). WebSearch/WebFetch/npm CLI unavailable during research. Versions should be verified against npm registry before implementation.

## Recommended Stack

### Core n8n Dependencies

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| n8n-workflow | ^1.x (latest) | Node type definitions, INodeType, INodeExecuteFunctions | Required peer dependency for all community nodes. Provides the core interfaces (INodeType, INodeTypeDescription, IExecuteFunctions, ICredentialType). | HIGH |
| n8n-core | ^1.x (latest) | Runtime helpers (only if needed) | Some programmatic nodes may need helpers from n8n-core for binary data handling. Most declarative nodes only need n8n-workflow. | HIGH |

**IMPORTANT:** These are listed as `peerDependencies` in your package.json, NOT `dependencies`. n8n provides them at runtime. Installing them as direct dependencies would bloat the package and cause version conflicts.

### Build Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | ~5.5 - 5.7 | Type-safe node development | n8n ecosystem uses TypeScript. Match the version used by n8n itself (5.x series). Use strict mode as specified in PROJECT.md. | HIGH |
| n8n-node-dev | latest | Build and lint community nodes | This is the **actual** CLI tool for community node development. Despite PROJECT.md mentioning "@n8n/node-cli", the real npm package is `n8n-node-dev`. It provides `n8n-node-dev build`, `n8n-node-dev lint`. Verify this -- the package name may have changed post May 2025. | MEDIUM |
| gulp (via n8n-node-dev) | (bundled) | Asset copying (icons, etc.) | n8n-node-dev uses gulp internally to copy non-TS assets during build. You do not install gulp directly. | HIGH |

**CRITICAL NOTE on @n8n/node-cli:** PROJECT.md references `@n8n/node-cli` as the official tooling. As of my training cutoff (May 2025), the actual package was `n8n-node-dev`. n8n may have released `@n8n/node-cli` as a replacement after that date. **Action required:** Run `npm view @n8n/node-cli` to verify. If it does not exist, use `n8n-node-dev`. If it does exist, use it instead.

### Language & Configuration

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | ~5.5+ | Language | Required by n8n node development; provides type safety with INodeType interfaces | HIGH |
| Node.js | >=18.17 (LTS 20.x or 22.x recommended) | Runtime | n8n 1.x requires Node.js 18+. Target Node 20 LTS for best compatibility. | HIGH |
| ESLint | ^8.x or ^9.x | Linting | n8n-node-dev includes lint rules. Supplement with @typescript-eslint for stricter checks. | MEDIUM |

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Why these settings:**
- `strict: true` -- PROJECT.md requirement; catches credential/type mismatches early
- `target: ES2022` -- n8n runs on Node 18+, ES2022 features are safe
- `module: commonjs` -- n8n loads community nodes via require(), not ESM import
- `declaration: true` -- needed for n8n to resolve types at runtime

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Jest | ^29.x | Test runner | Standard in the n8n ecosystem. n8n's own codebase uses Jest. Excellent TypeScript support via ts-jest. | HIGH |
| ts-jest | ^29.x | TypeScript in Jest | Runs .test.ts files directly without separate compile step | HIGH |
| nock | ^13.x or ^14.x | HTTP mocking | PROJECT.md requirement. Intercepts HTTP requests to mock Polish service APIs. Perfect for testing n8n node execute() functions without hitting real APIs. | HIGH |
| @types/jest | ^29.x | Jest type definitions | TypeScript autocomplete for test files | HIGH |

**Testing pattern for n8n nodes:**
```typescript
import nock from 'nock';
import { executeNode } from '../test-helpers';

describe('SmsApi Node', () => {
  beforeAll(() => nock.disableNetConnect());
  afterEach(() => nock.cleanAll());

  it('should send SMS', async () => {
    nock('https://api.smsapi.pl')
      .post('/sms.do')
      .reply(200, { count: 1, list: [{ id: '123' }] });

    const result = await executeNode('SmsApi', {
      operation: 'send',
      phoneNumber: '+48123456789',
      message: 'Test',
    });

    expect(result[0].json).toHaveProperty('id', '123');
  });
});
```

**NOTE:** Testing n8n nodes requires a test harness that simulates the n8n execution context (IExecuteFunctions). You will need to create a shared `test-helpers.ts` that mocks `this.helpers.httpRequest()` or `this.helpers.request()`. This is the hardest part of testing community nodes -- n8n does not provide an official test harness.

### Monorepo Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| pnpm | ^9.x | Package manager + workspace support | **Recommended over npm workspaces.** pnpm workspaces are faster, use less disk space (symlinked node_modules), and have better support for peer dependencies -- critical when all packages share n8n-workflow as a peer dep. Also: pnpm has `--filter` for targeted builds/publishes. | HIGH |
| Turborepo | ^2.x | Build orchestration (optional) | Only add if build times become painful (>10 packages). For 11 packages, pnpm workspace scripts with `--filter` are sufficient. Turborepo adds caching but also complexity. **Start without it, add later if needed.** | MEDIUM |
| changesets | ^2.x | Version management + changelogs | `@changesets/cli` is the standard for monorepo versioning. Each node gets independent semver. `changeset version` bumps, `changeset publish` publishes. Integrates with GitHub Actions. | HIGH |

**Why pnpm over npm workspaces:**
1. Strict dependency isolation -- prevents phantom dependencies (node accidentally importing a package it doesn't declare)
2. Faster installs via content-addressable store
3. Better `--filter` syntax: `pnpm --filter n8n-nodes-smsapi build` vs npm's more verbose workspace targeting
4. Used by n8n's own monorepo (n8n core is a pnpm workspace monorepo)

**Why NOT Turborepo for this project:**
- 11 packages is small enough that parallel pnpm scripts handle it fine
- Each node builds in <5 seconds -- caching overhead not justified
- Adds configuration complexity (turbo.json, pipeline definitions)
- Can always add later if the monorepo grows

### Monorepo Structure

```
n8n-polish-nodes/
  pnpm-workspace.yaml
  package.json              (root -- scripts, devDependencies only)
  tsconfig.base.json        (shared TS config)
  .changeset/
    config.json
  .github/
    workflows/
      publish.yml           (provenance attestation publish)
      ci.yml                (lint + test on PR)
  packages/
    shared/                 (internal -- NOT published)
      src/
        test-helpers.ts     (n8n execution context mock)
        error-helpers.ts    (NodeApiError wrappers)
        xml-helpers.ts      (for wFirma, GUS REGON)
    n8n-nodes-smsapi/
      package.json
      tsconfig.json         (extends ../../tsconfig.base.json)
      src/
        nodes/
          SmsApi/
            SmsApi.node.ts
            SmsApi.node.json  (codex -- optional, for n8n search)
        credentials/
          SmsApiApi.credentials.ts
      __tests__/
        SmsApi.test.ts
      smsapi.svg             (60x60 icon)
    n8n-nodes-ceidg/
      ...
    n8n-nodes-fakturownia/
      ...
    (etc.)
```

### Package Publishing & Registry

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| GitHub Actions | N/A | CI/CD + publish with provenance | PROJECT.md mandates provenance attestation. Only GitHub Actions (or GitLab CI) supports npm provenance. | HIGH |
| npm provenance | N/A | Supply chain security | `npm publish --provenance` in GitHub Actions. Required by May 2026 per PROJECT.md. | HIGH |

### Supporting Libraries (per-node as needed)

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| fast-xml-parser | ^4.x | XML parsing/building | wFirma (XML responses), GUS REGON (SOAP/XML) | HIGH |
| crypto (built-in) | Node.js built-in | HMAC-SHA1, SHA384 | iFirma (HMAC-SHA1 signatures), Przelewy24 (CRC SHA384) | HIGH |
| soap | ^1.x | SOAP client | GUS REGON BIR API only. Consider if n8n's built-in httpRequest can handle raw SOAP XML instead. | MEDIUM |

**NOTE on soap library:** For GUS REGON, you may be better off crafting raw XML with fast-xml-parser and sending via `this.helpers.httpRequest()` rather than pulling in the `soap` library. The soap library is heavy (~2MB) and GUS REGON only has 3-4 methods. Evaluate during implementation.

## package.json Conventions (per community node)

Each published package MUST follow these conventions for n8n discovery:

```json
{
  "name": "n8n-nodes-smsapi",
  "version": "0.1.0",
  "description": "n8n community node for SMSAPI.pl - Send SMS, manage contacts and groups",
  "keywords": [
    "n8n-community-node-package"
  ],
  "license": "MIT",
  "author": {
    "name": "Michal Ploneczka",
    "url": "https://codersgroup.pl"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/michalploneczka/n8n-polish-nodes",
    "directory": "packages/n8n-nodes-smsapi"
  },
  "main": "dist/nodes/SmsApi/SmsApi.node.js",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": [
      "dist/nodes/SmsApi/SmsApi.node.js"
    ],
    "credentials": [
      "dist/credentials/SmsApiApi.credentials.js"
    ]
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc && cp src/nodes/**/*.svg dist/nodes/ 2>/dev/null || true",
    "lint": "eslint src/",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "n8n-workflow": ">=1.0.0"
  },
  "devDependencies": {
    "n8n-workflow": "^1.x",
    "typescript": "~5.5.0"
  },
  "engines": {
    "node": ">=18.17.0"
  }
}
```

**CRITICAL conventions:**
1. **`keywords` MUST include `"n8n-community-node-package"`** -- this is how n8n discovers community nodes in the npm registry
2. **`n8n` field** -- declares node and credential file paths. n8n reads this to register your node.
3. **`n8nNodesApiVersion: 1`** -- current API version. May be 2 by now -- verify.
4. **`peerDependencies` for n8n-workflow** -- never a direct dependency
5. **`files: ["dist"]`** -- only publish compiled output, not source
6. **Package naming: `n8n-nodes-{servicename}`** -- the `n8n-nodes-` prefix is a convention (not strictly required) but strongly recommended for discoverability
7. **Icon must be in dist** -- the build step must copy .svg files to dist/

## pnpm-workspace.yaml

```yaml
packages:
  - 'packages/*'
```

## Root package.json

```json
{
  "private": true,
  "name": "n8n-polish-nodes",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "build:smsapi": "pnpm --filter n8n-nodes-smsapi build",
    "test:smsapi": "pnpm --filter n8n-nodes-smsapi test"
  },
  "devDependencies": {
    "typescript": "~5.5.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.2.0",
    "nock": "^13.5.0",
    "@types/jest": "^29.5.0",
    "@changesets/cli": "^2.27.0"
  },
  "engines": {
    "node": ">=18.17.0",
    "pnpm": ">=9.0.0"
  }
}
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Package Manager | pnpm workspaces | npm workspaces | npm workspaces hoist by default, causing phantom dependency issues. pnpm's strict isolation prevents this. Also, n8n's own repo uses pnpm. |
| Package Manager | pnpm workspaces | Yarn Berry (PnP) | Yarn PnP's virtual filesystem breaks many tools. pnpm is simpler and widely adopted. |
| Build Orchestration | pnpm scripts | Turborepo | Overkill for 11 small packages. Each builds in seconds. Add later if needed. |
| Build Orchestration | pnpm scripts | Nx | Even heavier than Turborepo. Designed for 50+ package monorepos. |
| Build Orchestration | pnpm scripts | Lerna | Effectively deprecated in favor of Nx or standalone. No reason to adopt in 2026. |
| Test Runner | Jest + ts-jest | Vitest | Vitest is ESM-first; n8n nodes are CJS. Jest has better n8n ecosystem alignment. |
| XML Parser | fast-xml-parser | xml2js | xml2js is older, callback-based, less maintained. fast-xml-parser is faster and promise-friendly. |
| Versioning | changesets | manual | Manual versioning across 11 packages is error-prone. changesets automates it with PR-based workflow. |
| SOAP Client | raw XML + httpRequest | soap library | soap library is heavy (~2MB). For GUS REGON's 3 methods, handcrafted XML is lighter and gives more control. |

## What NOT to Use

| Technology | Why Not |
|------------|---------|
| Lerna | Effectively dead. Acquired by Nx, deprecated as standalone. |
| yarn classic (v1) | No workspace features comparable to pnpm. Legacy. |
| esbuild/swc for build | n8n expects CommonJS output from tsc. Bundlers can break n8n's dynamic require() loading. Stick with tsc. |
| ESM modules | n8n loads community nodes via require(). Do not use ESM (type: "module"). Keep CJS. |
| Webpack/Rollup | Community nodes are not bundled -- n8n expects individual .js files it can require(). Bundling breaks node discovery. |
| Mocha/Chai | Jest is the n8n ecosystem standard. No reason to deviate. |
| Bun | Incompatible runtime. n8n runs on Node.js. |

## Installation (Bootstrap)

```bash
# Initialize monorepo
mkdir n8n-polish-nodes && cd n8n-polish-nodes
pnpm init
# Edit package.json to add "private": true

# Create workspace config
echo 'packages:\n  - "packages/*"' > pnpm-workspace.yaml

# Install shared dev dependencies at root
pnpm add -Dw typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint jest ts-jest nock @types/jest @changesets/cli

# Initialize changesets
pnpm changeset init

# Create first package
mkdir -p packages/n8n-nodes-smsapi/src/nodes/SmsApi
mkdir -p packages/n8n-nodes-smsapi/src/credentials
mkdir -p packages/n8n-nodes-smsapi/__tests__
cd packages/n8n-nodes-smsapi
pnpm init
# Edit package.json per conventions above

# Install n8n-workflow as dev dep (peer dep in production)
pnpm add -D n8n-workflow
```

## GitHub Actions Publish Workflow (Skeleton)

```yaml
# .github/workflows/publish.yml
name: Publish
on:
  push:
    branches: [main]
    paths: ['.changeset/**', 'packages/*/CHANGELOG.md']

permissions:
  contents: write
  id-token: write  # Required for provenance

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm -r build
      - run: pnpm -r test
      - name: Publish with provenance
        run: pnpm -r publish --no-git-checks --provenance
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Sources

- n8n official documentation (docs.n8n.io/integrations/creating-nodes/) -- referenced from training data, not live-verified
- n8n starter template (github.com/n8n-io/n8n-nodes-starter) -- established community node template
- npm registry package conventions -- well-established, stable
- pnpm documentation (pnpm.io) -- stable APIs
- changesets documentation (github.com/changesets/changesets) -- stable APIs

**Verification needed:**
- Exact current version of n8n-workflow (run `npm view n8n-workflow version`)
- Whether `@n8n/node-cli` exists as a replacement for `n8n-node-dev`
- Current `n8nNodesApiVersion` value (may be 1 or 2)
- TypeScript version used in n8n's own codebase (for maximum compatibility)
- ESLint 9 flat config compatibility with n8n lint rules
