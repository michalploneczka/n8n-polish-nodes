# Architecture Patterns

**Domain:** n8n community node monorepo (11 packages, independent npm publishing)
**Researched:** 2026-03-20
**Overall confidence:** MEDIUM-HIGH (training data only, no live verification possible)

> **Note on disagreements with STACK.md:** The earlier STACK.md research recommends pnpm + changesets. This ARCHITECTURE.md recommends npm workspaces + tag-based publishing. See the "Contested Decisions" section below for explicit analysis of both positions and a final recommendation.

---

## Recommended Architecture

**npm workspaces** monorepo with a flat `packages/` layout, shared TypeScript config via `extends`, and a single GitHub Actions publish workflow triggered by git tags.

---

## Contested Decisions (STACK.md vs ARCHITECTURE.md)

These three decisions have different recommendations in the two research files. Here is the full analysis for each, with a final verdict.

### Decision 1: npm workspaces vs pnpm workspaces

**STACK.md says:** pnpm because n8n's own repo uses it, strict isolation prevents phantom deps, better `--filter` syntax.

**ARCHITECTURE.md says:** npm workspaces because n8n community nodes are consumed via `npm install` and developed via `npm link`.

**Analysis:**

| Factor | npm workspaces | pnpm workspaces |
|--------|---------------|-----------------|
| Consumer toolchain match | YES -- n8n installs community nodes via npm | NO -- consumer uses npm regardless |
| `npm link` for local dev | Native, no friction | Works but creates symlink-in-symlink chains that can confuse n8n's node resolver |
| Phantom dependency prevention | NO strict isolation (flat hoisting) | YES -- strict by default |
| Build speed | Adequate for 11 packages | Faster installs via content-addressable store |
| CI setup complexity | Zero extra setup | Needs `pnpm/action-setup` step in GitHub Actions |
| Contributor friction | npm is universal, no extra install | Contributors must install pnpm |
| n8n core uses it | NO | YES -- but n8n core has 30+ interdependent packages; different scale |

**VERDICT: npm workspaces.** The phantom dependency risk is real but manageable for 11 independent packages with 1-2 runtime deps each (n8n-workflow, optionally fast-xml-parser). The `npm link` compatibility is more important because it is the primary local dev workflow and gets exercised daily. Phantom deps can be caught by a CI step that runs `npm pack` + installs the tarball in isolation.

**Confidence:** MEDIUM -- the `npm link` compatibility concern with pnpm is based on known patterns but was not live-tested. If pnpm `link` works flawlessly with n8n's custom node directory, pnpm becomes viable. Test before committing to either.

### Decision 2: n8n-workflow as dependency vs peerDependency

**STACK.md says:** peerDependency (n8n provides it at runtime, prevents version conflicts, reduces package size).

**ARCHITECTURE.md says:** regular dependency (n8n installs community nodes in isolation, peers don't resolve).

**Analysis:**

The n8n-nodes-starter template (github.com/n8n-io/n8n-nodes-starter) historically used **both** -- `peerDependencies` for the runtime declaration and `devDependencies` for local development. This is actually the correct pattern:

```json
{
  "peerDependencies": {
    "n8n-workflow": "*"
  },
  "devDependencies": {
    "n8n-workflow": "^1.0.0"
  }
}
```

**Why this works:** n8n provides `n8n-workflow` at runtime (so it is a peer). During development, you need the types (so it is a devDep). npm 7+ auto-installs peer deps, so the peer declaration does not cause issues for consumers.

**VERDICT: peerDependency + devDependency.** This matches the n8n starter template pattern. Do NOT put it in `dependencies` -- that would cause n8n to load a duplicate copy.

**Confidence:** MEDIUM -- based on the n8n-nodes-starter template as of early 2025. Verify against the current starter template.

### Decision 3: Changesets vs Tag-Based Publishing

**STACK.md says:** changesets (@changesets/cli) for automated versioning and changelogs.

**ARCHITECTURE.md says:** Manual version bumps + tag-based publish.

**Analysis:**

| Factor | Changesets | Tag-based |
|--------|-----------|-----------|
| Setup complexity | Medium (config, CI integration, PR workflow) | Low (tag pattern in workflow) |
| Version bump automation | Automated via changeset files | Manual edit of package.json |
| Changelog generation | Automatic (CHANGELOG.md per package) | Manual or none |
| CI workflow complexity | Needs "Version Packages" PR + release step | Single workflow triggered by tag |
| Risk of version mismatch | Low (automated) | Medium (tag must match package.json) |
| Learning curve | Developers must learn changeset workflow | Developers just push tags |
| Benefit at 11 packages | Moderate -- saves time on repeated releases | Low overhead, simple mental model |

**VERDICT: Start with tag-based, migrate to changesets when it hurts.** Reasoning: You are a solo developer building 11 packages over 8 weeks. Changesets add ceremony (create changeset file, review PR, merge release PR) that slows down a single-person workflow. Tags are simpler: bump version, tag, push. When the project gets contributors or release frequency increases, migrate to changesets. The migration is non-breaking -- changesets work on any monorepo.

**Confidence:** HIGH -- this is a workflow preference, not a technical constraint. Both work.

---

## Directory Structure

```
n8n-polish-nodes/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Lint + build + test on every PR
│       └── publish.yml                   # Publish single package on tag push
├── packages/
│   ├── n8n-nodes-smsapi/
│   │   ├── nodes/
│   │   │   └── Smsapi/
│   │   │       ├── Smsapi.node.ts
│   │   │       ├── Smsapi.node.json      # Codex metadata
│   │   │       └── smsapi.svg
│   │   ├── credentials/
│   │   │   └── SmsapiApi.credentials.ts
│   │   ├── __tests__/                    # Co-located tests
│   │   │   ├── Smsapi.node.test.ts
│   │   │   └── fixtures/
│   │   │       └── responses.json        # Nock response fixtures
│   │   ├── package.json
│   │   ├── tsconfig.json                 # extends ../../tsconfig.base.json
│   │   └── README.md
│   ├── n8n-nodes-fakturownia/
│   ├── n8n-nodes-inpost/
│   ├── n8n-nodes-przelewy24/
│   ├── n8n-nodes-baselinker/
│   ├── n8n-nodes-shoper/
│   ├── n8n-nodes-wfirma/
│   ├── n8n-nodes-ifirma/
│   ├── n8n-nodes-allegro/
│   ├── n8n-nodes-ceidg/
│   └── n8n-nodes-gus-regon/
├── shared/
│   └── test-utils/                       # NOT an npm package, just shared code
│       ├── index.ts
│       ├── mock-node-context.ts          # Reusable n8n execution context mock
│       └── nock-helpers.ts               # Common nock setup/teardown
├── scripts/
│   └── link-node.sh                      # Helper: link a package to local n8n
├── package.json                          # Root: workspaces config, dev scripts
├── tsconfig.base.json                    # Shared TypeScript config
├── .eslintrc.js                          # Shared ESLint config
├── jest.config.base.js                   # Shared Jest base config
├── LICENSE
└── README.md
```

### Component Boundaries

| Component | Responsibility | Publishes to npm? |
|-----------|---------------|-------------------|
| Root `package.json` | Workspace orchestration, dev dependencies, scripts | NO (`"private": true`) |
| `packages/n8n-nodes-*` | Individual n8n community node. Self-contained: own package.json, tsconfig, tests, README | YES (each independently) |
| `shared/test-utils/` | Shared test mocks and nock helpers. Referenced via relative path in jest configs | NO (never published) |
| `.github/workflows/` | CI/CD: lint/build/test on PR, publish on tag | N/A |
| `tsconfig.base.json` | Shared compiler options. Each package extends this | N/A |
| `scripts/` | Developer convenience scripts (linking, validation) | N/A |

---

## Root package.json

```json
{
  "name": "n8n-polish-nodes",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "clean": "npm run clean --workspaces --if-present",
    "verify-packages": "node scripts/verify-packages.js",
    "dev": "echo 'Usage: cd packages/n8n-nodes-<name> && npm run dev'"
  },
  "devDependencies": {
    "typescript": "^5.4",
    "@types/node": "^20",
    "jest": "^29",
    "ts-jest": "^29",
    "@types/jest": "^29",
    "nock": "^14",
    "eslint": "^8",
    "@typescript-eslint/eslint-plugin": "^7",
    "@typescript-eslint/parser": "^7"
  },
  "engines": {
    "node": ">=18.17.0"
  }
}
```

**Key design choice:** Dev dependencies hoisted to root. Each package has only `peerDependencies` (n8n-workflow) and package-specific runtime deps (fast-xml-parser for XML nodes). This avoids 11 copies of TypeScript, Jest, ESLint.

---

## Per-Package package.json Template

```json
{
  "name": "n8n-nodes-smsapi",
  "version": "0.1.0",
  "description": "n8n community node for SMSAPI.pl - Send SMS, manage contacts and groups",
  "keywords": ["n8n-community-node-package"],
  "license": "MIT",
  "author": {
    "name": "Michal Ploneczka",
    "url": "https://codersgroup.pl"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/michalploneczka/n8n-polish-nodes.git",
    "directory": "packages/n8n-nodes-smsapi"
  },
  "main": "dist/nodes/Smsapi/Smsapi.node.js",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "nodes": ["dist/nodes/Smsapi/Smsapi.node.js"],
    "credentials": ["dist/credentials/SmsapiApi.credentials.js"]
  },
  "files": [
    "dist/nodes/",
    "dist/credentials/",
    "LICENSE",
    "README.md"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.json && npm run copy-assets",
    "copy-assets": "find nodes -name '*.svg' -o -name '*.node.json' | while read f; do mkdir -p \"dist/$(dirname $f)\" && cp \"$f\" \"dist/$f\"; done",
    "dev": "tsc -w -p tsconfig.json",
    "lint": "eslint nodes/ credentials/ --ext .ts",
    "test": "jest --config jest.config.js",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run build"
  },
  "peerDependencies": {
    "n8n-workflow": "*"
  },
  "devDependencies": {
    "n8n-workflow": "^1.0.0"
  },
  "engines": {
    "node": ">=18.17.0"
  }
}
```

**Critical details:**
- `n8n-community-node-package` keyword: REQUIRED for n8n to discover the node
- `n8n` field paths: MUST point to compiled `.js` files in `dist/`, never `.ts`
- `files` whitelist: prevents test code, source TS, config files from publishing
- `copy-assets` script: copies SVG icons and .node.json codex files that tsc ignores
- `repository.directory`: enables npm provenance to verify which package directory built this

---

## Shared TypeScript Config Strategy

### `tsconfig.base.json` (root)

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
```

**Why ES2021 + commonjs:** n8n loads community nodes via `require()`. CommonJS output is mandatory. ES2021 target matches n8n's Node.js 18+ requirement. Do not use ES2022 -- while Node 18 supports it, matching n8n's own target reduces risk.

### Per-package `tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": [
    "nodes/**/*.ts",
    "credentials/**/*.ts"
  ]
}
```

Each package overrides only `outDir`, `rootDir`, and `include`. Everything else inherited.

---

## Shared Test Utilities

The `shared/test-utils/` directory contains reusable test helpers that are NOT published to npm. They are referenced via relative imports from each package's tests.

### `shared/test-utils/mock-node-context.ts`

```typescript
import { IExecuteFunctions } from 'n8n-workflow';

/**
 * Creates a minimal mock of IExecuteFunctions for unit testing nodes.
 * Each test can override specific methods as needed.
 */
export function createMockExecuteFunctions(
  overrides: Partial<IExecuteFunctions> = {},
): IExecuteFunctions {
  return {
    getInputData: jest.fn().mockReturnValue([{ json: {} }]),
    getNodeParameter: jest.fn(),
    getCredentials: jest.fn(),
    helpers: {
      httpRequest: jest.fn(),
      returnJsonArray: jest.fn((data) => data.map((d: any) => ({ json: d }))),
      constructExecutionMetaData: jest.fn((data) => data),
    } as any,
    getNode: jest.fn().mockReturnValue({ name: 'TestNode', type: 'test' }),
    continueOnFail: jest.fn().mockReturnValue(false),
    ...overrides,
  } as unknown as IExecuteFunctions;
}
```

### `shared/test-utils/nock-helpers.ts`

```typescript
import nock from 'nock';

/**
 * Standard nock setup for API testing.
 * Call at the top of each describe block.
 */
export function setupNock(baseUrl: string) {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  return nock(baseUrl);
}
```

### Usage in per-package tests

```typescript
// packages/n8n-nodes-smsapi/__tests__/Smsapi.node.test.ts
import { createMockExecuteFunctions } from '../../../shared/test-utils';
import { setupNock } from '../../../shared/test-utils/nock-helpers';
```

---

## GitHub Actions Workflow Structure

### Architecture Decision: Tag-Based Publishing

Each package publishes independently via a git tag convention:

```
n8n-nodes-smsapi@1.0.0       -> publishes n8n-nodes-smsapi v1.0.0
n8n-nodes-fakturownia@1.2.0  -> publishes n8n-nodes-fakturownia v1.2.0
```

**Why tag-based (not changeset/release-please):**
- Solo developer for 8+ weeks -- minimal ceremony
- Manual version bumps in package.json are fine at this scale
- Tag push is the simplest trigger mapping 1:1 to "publish this package"
- CI workflow verifies tag version matches package.json (safety net)

### `.github/workflows/ci.yml` -- Continuous Integration

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-build-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - run: npm ci

      - run: npm run lint

      - run: npm run build

      - run: npm run test
```

### `.github/workflows/publish.yml` -- Publish with Provenance

```yaml
name: Publish Package

on:
  push:
    tags:
      - 'n8n-nodes-*@*'   # Matches: n8n-nodes-smsapi@1.0.0

permissions:
  contents: read
  id-token: write         # REQUIRED for npm provenance attestation

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: npm

      - run: npm ci

      # Extract package name and version from tag
      - name: Parse tag
        id: tag
        run: |
          TAG="${GITHUB_REF#refs/tags/}"
          PACKAGE_NAME="${TAG%@*}"
          VERSION="${TAG##*@}"
          echo "package=$PACKAGE_NAME" >> $GITHUB_OUTPUT
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "dir=packages/$PACKAGE_NAME" >> $GITHUB_OUTPUT

      # Safety: verify version in package.json matches tag
      - name: Verify version
        run: |
          PKG_VERSION=$(node -p "require('./${{ steps.tag.outputs.dir }}/package.json').version")
          if [ "$PKG_VERSION" != "${{ steps.tag.outputs.version }}" ]; then
            echo "::error::Tag version (${{ steps.tag.outputs.version }}) != package.json version ($PKG_VERSION)"
            exit 1
          fi

      # Build the specific package
      - name: Build
        run: npm run build --workspace=${{ steps.tag.outputs.dir }}

      # Run tests for the specific package
      - name: Test
        run: npm run test --workspace=${{ steps.tag.outputs.dir }}

      # Publish with provenance attestation
      - name: Publish
        run: npm publish --workspace=${{ steps.tag.outputs.dir }} --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**Key workflow details:**
- Tag pattern `n8n-nodes-*@*` matches all package tags
- Version verification prevents tag/package.json mismatch
- `--workspace` flag targets only the specific package
- `--provenance` generates SLSA provenance via Sigstore OIDC
- `--access public` is required for first-time publish of unscoped packages

---

## npm Provenance Attestation Setup

**Confidence:** MEDIUM -- based on npm documentation as of early 2025. The May 2026 mandatory date is from the project requirements.

### What It Proves

npm provenance links a published package to its source commit and build process via Sigstore:
1. Which source repository the package was built from
2. Which commit triggered the build
3. That the build ran in a trusted CI environment (not a developer laptop)

### Requirements Checklist

| Requirement | Value | Notes |
|-------------|-------|-------|
| npm version | >= 9.5.0 | Ships with Node 18+ |
| `--provenance` flag | On `npm publish` command | Generates and attaches SLSA provenance |
| `id-token: write` | In GitHub Actions job `permissions` | Required for Sigstore OIDC token |
| `registry-url` | Set in `setup-node` step | Must be `https://registry.npmjs.org` |
| npm token | Granular Access Token | Set as `NPM_TOKEN` repo secret |
| `repository` field | In each package.json | npm validates repo URL matches the Actions repo |

### Setup Steps

1. **Create npm Granular Access Token:**
   - npmjs.com -> Access Tokens -> Generate New Token -> Granular Access Token
   - Permissions: Read and Write (packages)
   - Do NOT use legacy "Automation" tokens (no IP restriction support)

2. **Add GitHub repo secret:**
   - Repo Settings -> Secrets and variables -> Actions -> New repository secret
   - Name: `NPM_TOKEN`, Value: the token from step 1

3. **Package.json `repository` field** (every package):
   ```json
   {
     "repository": {
       "type": "git",
       "url": "https://github.com/michalploneczka/n8n-polish-nodes.git",
       "directory": "packages/n8n-nodes-smsapi"
     }
   }
   ```
   npm validates `repository.url` matches the GitHub repo running the workflow.

4. **Workflow permissions** (in publish.yml):
   ```yaml
   permissions:
     contents: read
     id-token: write
   ```

5. **Publish command:**
   ```bash
   npm publish --provenance --access public
   ```

### First Publish Gotcha

For a brand-new package that has never been published, the npm Granular Access Token cannot be pre-scoped to that package name (it does not exist yet). Options:
- Use a token scoped to "All packages" for first publish, then restrict
- Or create the package name first on npmjs.com manually, then scope the token

### Verification

After publishing:
```bash
npm audit signatures           # Verify all installed packages
```

On npmjs.com: packages with provenance show a green "Provenance" badge linking to the source commit.

---

## Local Development Workflow

### Per-Package Dev Loop

```bash
# Terminal 1: Build + watch
cd packages/n8n-nodes-smsapi
npm run dev            # tsc --watch

# Terminal 2: Link to n8n
cd packages/n8n-nodes-smsapi
npm link

mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
npm link n8n-nodes-smsapi

# Terminal 3: Start n8n
npx n8n start
# Node appears in n8n search panel
# After code changes: tsc --watch recompiles -> restart n8n to pick up changes
```

### Important Caveats

1. **n8n must be restarted** after code changes. No hot reload for community nodes.
2. **`npm link` creates a symlink**, so `tsc --watch` output in `dist/` is immediately visible to n8n without re-linking.
3. **Multiple nodes at once:** Run `npm link` in each package dir, then `npm link <pkg>` in `~/.n8n/custom` for each.
4. **Workspace-aware linking:** From monorepo root, `npm link --workspace=packages/n8n-nodes-smsapi` also works.
5. **n8n custom node directory:** `~/.n8n/custom` by default. Can be changed via `N8N_CUSTOM_EXTENSIONS` env var.

### Convenience Script: `scripts/link-node.sh`

```bash
#!/bin/bash
set -e
# Usage: ./scripts/link-node.sh smsapi
if [ -z "$1" ]; then
  echo "Usage: $0 <node-short-name>"
  echo "Example: $0 smsapi"
  exit 1
fi

NODE_NAME="n8n-nodes-$1"
PACKAGE_DIR="packages/$NODE_NAME"

if [ ! -d "$PACKAGE_DIR" ]; then
  echo "Error: $PACKAGE_DIR does not exist"
  exit 1
fi

echo "Building $NODE_NAME..."
npm run build --workspace="$PACKAGE_DIR"

echo "Linking $NODE_NAME..."
cd "$PACKAGE_DIR" && npm link
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom && npm link "$NODE_NAME"

echo ""
echo "Done! $NODE_NAME is linked to n8n."
echo "Start n8n with: npx n8n start"
echo "After code changes: npm run dev --workspace=packages/$NODE_NAME (in another terminal)"
```

---

## Patterns to Follow

### Pattern 1: Shared Base Config, Per-Package Overrides

**What:** Root has `tsconfig.base.json`, `.eslintrc.js`, `jest.config.base.js`. Each package has minimal configs that extend these.
**When:** Always.
**Why:** Single source of truth. Changes propagate to all 11 packages. Per-package configs are 3-5 lines each.

### Pattern 2: Independent Versioning with Tag-Based Publish

**What:** Each package has its own `version` in `package.json`. Publishing triggered by pushing a tag.
**When:** This project (solo developer, independent packages).
**Why:** Simplest possible workflow with strong safety (version verification in CI).

### Pattern 3: Asset Copy Build Step

**What:** After `tsc`, copy `.svg` and `.node.json` files to `dist/`.
**When:** Every n8n community node build.
**Why:** TypeScript compiler ignores non-TS files. Published packages MUST include icons and codex metadata in `dist/`.

### Pattern 4: `files` Whitelist in package.json

**What:** `"files": ["dist/nodes/", "dist/credentials/", "LICENSE", "README.md"]`
**When:** Always.
**Why:** Prevents tests, source TS, and config from publishing to npm. Keeps package size small.

### Pattern 5: Package Verification Script

**What:** A `scripts/verify-packages.js` that checks all packages have required fields.
**When:** Run in CI before publish.
**Why:** Catches missing keywords, wrong paths in `n8n` field, missing `repository.directory`.

```javascript
// scripts/verify-packages.js
const fs = require('fs');
const path = require('path');
const packagesDir = path.join(__dirname, '..', 'packages');

const errors = [];
for (const dir of fs.readdirSync(packagesDir)) {
  const pkgPath = path.join(packagesDir, dir, 'package.json');
  if (!fs.existsSync(pkgPath)) continue;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (!pkg.keywords?.includes('n8n-community-node-package')) {
    errors.push(`${dir}: missing n8n-community-node-package keyword`);
  }
  if (!pkg.repository?.directory) {
    errors.push(`${dir}: missing repository.directory`);
  }
  if (!pkg.n8n?.nodes?.length) {
    errors.push(`${dir}: missing n8n.nodes`);
  }
  for (const nodePath of (pkg.n8n?.nodes || [])) {
    if (!nodePath.startsWith('dist/')) {
      errors.push(`${dir}: n8n.nodes path must start with dist/: ${nodePath}`);
    }
    if (!nodePath.endsWith('.js')) {
      errors.push(`${dir}: n8n.nodes path must end with .js: ${nodePath}`);
    }
  }
}

if (errors.length) {
  console.error('Package verification failed:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log('All packages verified.');
}
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Runtime Package

**What:** Creating a `packages/shared` npm package with common HTTP helpers, error formatters, etc.
**Why bad:** Each n8n community node is installed independently by users. A shared runtime package becomes a dependency that must be published and versioned separately. Version coordination complexity defeats the purpose of independent packages.
**Instead:** Copy small utilities into each package (2-3 functions is fine to duplicate). For larger shared logic (XML parser for wFirma + GUS REGON), extract to a separate npm package only if the interface stabilizes.

### Anti-Pattern 2: Publishing from Local Machine

**What:** Running `npm publish` locally.
**Why bad:** No provenance attestation from local machine. After May 2026, packages without provenance may be flagged or restricted.
**Instead:** Always publish via GitHub Actions. No npm token on local machines.

### Anti-Pattern 3: Using ESM Modules

**What:** Setting `"type": "module"` or using ES module syntax in output.
**Why bad:** n8n loads community nodes via `require()`. ESM output breaks node discovery.
**Instead:** `"module": "commonjs"` in tsconfig. Never set `"type": "module"` in package.json.

### Anti-Pattern 4: Bundling with webpack/esbuild/rollup

**What:** Bundling the node into a single file.
**Why bad:** n8n expects individual `.js` files it can `require()`. Bundling breaks the `n8n.nodes` and `n8n.credentials` path resolution.
**Instead:** Use `tsc` for compilation. Output preserves file structure.

---

## Data Flow

### Build Flow
```
Source (.ts files)     --tsc-->  dist/ (.js + .d.ts + .js.map)
Assets (.svg, .json)   --copy-->  dist/ (icons + codex metadata)
package.json (files)   --npm pack-->  tarball (only whitelisted files)
```

### Publish Flow
```
Developer:
  1. Bump version in packages/n8n-nodes-smsapi/package.json
  2. Commit: "release: n8n-nodes-smsapi@1.0.0"
  3. Tag: git tag n8n-nodes-smsapi@1.0.0
  4. Push: git push origin main --tags

GitHub Actions (publish.yml):
  1. Triggered by tag pattern n8n-nodes-*@*
  2. Parse tag -> extract package name + version
  3. Verify version matches package.json
  4. npm ci (install all workspace deps)
  5. Build specific package
  6. Test specific package
  7. npm publish --provenance --access public
  8. Sigstore signs the provenance attestation

npm Registry:
  - Package available with provenance badge
  - Source commit linked on npmjs.com
```

### Consumer Install Flow
```
n8n user:
  Settings -> Community Nodes -> Install
  -> Searches or enters: n8n-nodes-smsapi
  -> n8n runs: npm install n8n-nodes-smsapi (in ~/.n8n/nodes/)
  -> n8n reads package.json "n8n" field
  -> Discovers nodes and credentials paths
  -> Node appears in node panel search
```

---

## Scalability Considerations

| Concern | At 3 nodes | At 11 nodes | At 20+ nodes |
|---------|------------|-------------|--------------|
| CI time | ~1 min | ~3 min | Add Turborepo for build caching |
| Publishing | Manual tags | Manual tags | Migrate to changesets |
| Local dev | Link 1-2 nodes | Link what you need | Same pattern |
| Test suite | < 30s | ~2 min | Split into parallel CI matrix |
| npm token | 1 granular token | Same | Per-scope tokens |
| Config sync | Manual check | Verification script | Same script |

---

## Jest Configuration Strategy

### `jest.config.base.js` (root)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'nodes/**/*.ts',
    'credentials/**/*.ts',
    '!**/*.d.ts',
  ],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
```

### Per-package `jest.config.js`

```javascript
const base = require('../../jest.config.base');

module.exports = {
  ...base,
  displayName: 'n8n-nodes-smsapi',
  rootDir: '.',
  moduleNameMapper: {
    '^@test-utils/(.*)$': '<rootDir>/../../shared/test-utils/$1',
  },
};
```

---

## ESLint Configuration

### `.eslintrc.js` (root)

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
```

Each package inherits this via ESLint's automatic config lookup (walks up to root `.eslintrc.js`).

---

## Sources

- n8n community node development documentation (training data, MEDIUM confidence)
- n8n-nodes-starter template (training data, MEDIUM confidence -- verify current version)
- npm workspaces documentation (training data, HIGH confidence -- stable API since npm 7)
- npm provenance attestation documentation (training data, MEDIUM confidence -- feature introduced npm 9.5.0 in 2023)
- Sigstore / SLSA provenance framework (training data, MEDIUM confidence)
- GitHub Actions OIDC token documentation (training data, HIGH confidence)

## Confidence Notes

| Topic | Confidence | Reason |
|-------|-----------|--------|
| npm workspaces setup | HIGH | Stable API, well-documented, unlikely to have changed |
| TypeScript config pattern | HIGH | Standard monorepo pattern |
| npm provenance `--provenance` flag | MEDIUM | Exists since npm 9.5.0; verify current requirements for May 2026 |
| `id-token: write` permission | HIGH | Standard GitHub Actions OIDC requirement |
| n8n `npm link` workflow | MEDIUM | Based on known patterns; n8n may have changed custom node loading |
| n8n-workflow as peer + dev dep | MEDIUM | Matches n8n-nodes-starter template pattern; verify current template |
| Tag-based vs changesets publish | HIGH | Workflow choice, both technically sound |
| Granular Access Token for npm | MEDIUM | npm has been pushing these since 2023; verify current best practice |
