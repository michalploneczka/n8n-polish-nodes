# Phase 16: Testy strukturalne - walidacja konfiguracji wszystkich packages - Research

**Researched:** 2026-03-24
**Domain:** Structural testing / monorepo consistency validation
**Confidence:** HIGH

## Summary

This phase creates a structural test suite that validates configuration consistency across all 12 packages in the monorepo. The tests verify that every package meets the n8n community node requirements: correct package.json fields, valid codex metadata files, SVG icons present, credential/node file alignment with the `n8n` section in package.json, and build output correctness.

The project already has Jest (29.7.0) with ts-jest (29.4.6) and a shared base config (`jest.config.base.js`). Each package has its own `jest.config.js` and `__tests__/` directory. The structural tests should live at the **root level** (not per-package) since they validate cross-package consistency and the monorepo as a whole.

**Primary recommendation:** Create a single root-level `__tests__/structural/` test suite using Jest that dynamically discovers all packages under `packages/` and validates each one against a canonical set of rules derived from the project's CLAUDE.md conventions and n8n community node requirements.

## Project Constraints (from CLAUDE.md)

### Mandatory per CLAUDE.md
- Every node is a separate npm package named `n8n-nodes-{service}` with keyword `n8n-community-node-package`
- Credentials separate from node files
- README per node with description, example workflow, API docs link
- SVG icon 60x60, square aspect ratio
- Codex file (.node.json) with categories, subcategories, resources
- `npm run lint` must pass without errors
- package.json must have: name, version, description, keywords, license (MIT), author, repository, n8n section
- n8n section must list credentials and nodes paths pointing to `dist/`
- `files: ["dist"]` in every package.json
- peerDependencies must include `n8n-workflow`

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| jest | 29.7.0 | Test runner | Already installed in monorepo root devDeps |
| ts-jest | 29.4.6 | TypeScript transform for Jest | Already used by all per-package tests |
| glob/fs | built-in | Package discovery | No external dependency needed, use Node.js fs with recursive readdir |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fast-xml-parser | (not needed) | SVG validation | NOT needed - SVG starts with `<svg` tag check is sufficient |

No additional npm packages needed. The structural tests use only Node.js built-ins (fs, path) and the existing Jest setup.

## Architecture Patterns

### Recommended Project Structure
```
n8n-polish-nodes/
├── __tests__/
│   └── structural/
│       ├── package-json.test.ts     # package.json field validation
│       ├── codex.test.ts            # .node.json existence + schema
│       ├── icons.test.ts            # SVG icon existence + basic validity
│       ├── build-output.test.ts     # dist/ file alignment with n8n paths
│       ├── cross-package.test.ts    # cross-package consistency checks
│       └── helpers.ts               # shared discovery + loading utilities
├── jest.config.structural.js        # dedicated jest config for structural tests
└── package.json                     # add "test:structural" script
```

### Pattern 1: Dynamic Package Discovery
**What:** Auto-discover packages from `packages/` directory instead of hardcoding
**When to use:** All structural tests must iterate over every package
**Example:**
```typescript
// Source: project filesystem analysis
import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const PACKAGES_DIR = join(__dirname, '../../packages');

function getPackages(): string[] {
  return readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('n8n-nodes-'))
    .map(d => d.name);
}

function loadPackageJson(pkgName: string): Record<string, unknown> {
  return require(join(PACKAGES_DIR, pkgName, 'package.json'));
}
```

### Pattern 2: describe.each for Per-Package Tests
**What:** Use Jest `describe.each` to run the same assertions against every package
**When to use:** Every structural test file
**Example:**
```typescript
const packages = getPackages();

describe.each(packages)('Package %s', (pkgName) => {
  const pkgJson = loadPackageJson(pkgName);

  it('should have n8n-community-node-package keyword', () => {
    expect(pkgJson.keywords).toContain('n8n-community-node-package');
  });
});
```

### Pattern 3: Conditional Assertions Based on Package Type
**What:** Some packages have no credentials (public API: nbp, krs, vies, biala-lista-vat, nfz)
**When to use:** When validating credential file alignment
**Example:**
```typescript
const n8nSection = pkgJson.n8n as { credentials: string[]; nodes: string[] };
const hasCredentials = n8nSection.credentials.length > 0;

if (hasCredentials) {
  it('should have credential source files matching n8n.credentials paths', () => {
    // verify credentials/*.credentials.ts files exist
  });
} else {
  it('should have no credential source files', () => {
    // verify credentials/ dir is empty or absent
  });
}
```

### Anti-Patterns to Avoid
- **Hardcoded package list:** Never list packages by name in tests -- always discover from filesystem. New packages should be validated automatically.
- **Testing build output requires build:** Do NOT require `npm run build` as a precondition for most tests. Test source files directly. Only `build-output.test.ts` should check dist/ and can be skipped if dist/ is absent.
- **Overly strict SVG validation:** Do not parse SVG with XML parser. Check for `<svg` tag presence and file size > 0 is sufficient.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON schema validation | Custom field-by-field checks | Direct Jest assertions with `expect` | Schema validators are overkill for 12 known fields |
| Package discovery | Hardcoded array | `readdirSync` with filter | Auto-discovers new packages |
| Parallel test execution | Custom runner | Jest's built-in `describe.each` | Handles reporting and failure isolation |

## Common Pitfalls

### Pitfall 1: Build Output Tests Failing in CI Before Build Step
**What goes wrong:** Tests that check `dist/` fail because build hasn't run yet
**Why it happens:** Structural tests run before or without build step
**How to avoid:** Split into two categories: (1) source-only checks (always run), (2) build-output checks (skip with `describe.skipIf(!existsSync(distDir))` or conditional skip)
**Warning signs:** Tests pass locally (dist exists from prior build) but fail in CI

### Pitfall 2: Icon Path Mismatch Between Node Source and Filesystem
**What goes wrong:** Node TypeScript file references `icon: 'file:smsapi.svg'` but icon is at `icons/smsapi.svg`
**Why it happens:** n8n resolves icon paths relative to the node file location in dist, but copy-codex.js and build handle the mapping
**How to avoid:** Test that the icon referenced in the node class exists either at `icons/{name}.svg` (source) or verify via the n8n section indirectly
**Warning signs:** Icon shows as broken in n8n UI

### Pitfall 3: Credential Files Listed in package.json But Not Existing
**What goes wrong:** package.json n8n.credentials lists a dist path, but source file doesn't exist
**Why it happens:** Typo in path or file renamed without updating package.json
**How to avoid:** Map `dist/credentials/X.credentials.js` back to `credentials/X.credentials.ts` and verify source exists

### Pitfall 4: Codex File Node Reference Mismatch
**What goes wrong:** Codex `.node.json` has `"node": "n8n-nodes-smsapi.smsapi"` but package name or node class doesn't match
**Why it happens:** Copy-paste from another package without updating
**How to avoid:** Validate that codex `node` field follows pattern `{packageName}.{nodeName}` where packageName matches package.json name and nodeName is lowercase version of the node directory name

## Code Examples

### package.json Validation Rules
```typescript
// Source: CLAUDE.md conventions + existing package.json analysis
const REQUIRED_FIELDS = {
  name: (v: string) => v.startsWith('n8n-nodes-'),
  version: (v: string) => /^\d+\.\d+\.\d+/.test(v),
  description: (v: string) => v.length > 10,
  keywords: (v: string[]) => v.includes('n8n-community-node-package'),
  license: (v: string) => v === 'MIT',
  author: (v: { name: string }) => v.name === 'Michal Ploneczka',
  repository: (v: { type: string; url: string; directory: string }) =>
    v.url === 'https://github.com/michalploneczka/n8n-polish-nodes.git',
  files: (v: string[]) => v.includes('dist'),
  n8n: (v: { n8nNodesApiVersion: number; nodes: string[] }) =>
    v.n8nNodesApiVersion === 1 && v.nodes.length > 0,
  peerDependencies: (v: Record<string, string>) => 'n8n-workflow' in v,
};

const REQUIRED_SCRIPTS = ['build', 'dev', 'lint', 'test', 'clean'];
```

### Codex Validation Rules
```typescript
// Source: existing codex files analysis
interface CodexFile {
  node: string;
  nodeVersion: string;
  codexVersion: string;
  categories: string[];
  subcategories: Record<string, string[]>;
  resources: {
    primaryDocumentation: Array<{ url: string }>;
  };
}

const VALID_CATEGORIES = [
  'Communication', 'Data & Storage', 'Finance & Accounting',
  'Miscellaneous', 'Commerce', 'Productivity',
];
```

### Cross-Package Consistency Check
```typescript
// All packages should share these identical values
const CONSISTENT_FIELDS = {
  'author.name': 'Michal Ploneczka',
  'author.email': 'michal.ploneczka@gmail.com',
  'repository.url': 'https://github.com/michalploneczka/n8n-polish-nodes.git',
  'license': 'MIT',
  'n8n.n8nNodesApiVersion': 1,
  'n8n.strict': false,
};
```

### Jest Config for Structural Tests
```javascript
// jest.config.structural.js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/__tests__/structural/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
```

## Validation Rules Inventory

Complete list of what structural tests must validate, derived from CLAUDE.md and existing package analysis:

### package.json (per package)
| Field | Rule | Derived From |
|-------|------|-------------|
| `name` | starts with `n8n-nodes-` | CLAUDE.md rule 1 |
| `version` | valid semver | npm requirement |
| `description` | non-empty, English | CLAUDE.md README convention |
| `keywords` | includes `n8n-community-node-package` | CLAUDE.md rule 1 |
| `license` | `MIT` | CLAUDE.md |
| `author.name` | `Michal Ploneczka` | CLAUDE.md |
| `author.email` | `michal.ploneczka@gmail.com` | existing pattern |
| `author.url` | `https://codersgroup.pl` | existing pattern |
| `repository.url` | correct GitHub URL | CLAUDE.md |
| `repository.directory` | `packages/{name}` | existing pattern |
| `scripts.build` | contains `n8n-node build` | existing pattern |
| `scripts.test` | defined | CLAUDE.md rule 4 |
| `scripts.lint` | contains `n8n-node lint` | CLAUDE.md rule 7 |
| `files` | `["dist"]` | existing pattern |
| `n8n.n8nNodesApiVersion` | `1` | existing pattern |
| `n8n.nodes` | non-empty array, paths start with `dist/nodes/` | n8n requirement |
| `n8n.credentials` | paths start with `dist/credentials/` (if non-empty) | n8n requirement |
| `peerDependencies` | includes `n8n-workflow` | CLAUDE.md STACK |

### Codex files (per package)
| Field | Rule |
|-------|------|
| file exists | `nodes/{NodeName}/{NodeName}.node.json` |
| `node` | matches `{package-name}.{lowercase-node-name}` |
| `nodeVersion` | valid string (e.g., "1.0") |
| `codexVersion` | `"1.0"` |
| `categories` | non-empty array of valid n8n categories |
| `subcategories` | keys match categories |
| `resources.primaryDocumentation` | non-empty array with valid URLs |

### Icons (per package)
| Check | Rule |
|-------|------|
| file exists | `icons/{name}.svg` exists |
| valid SVG | file starts with `<svg` or `<?xml` |
| non-empty | file size > 100 bytes |

### Source/dist alignment (per package)
| Check | Rule |
|-------|------|
| node source exists | `nodes/{NodeName}/{NodeName}.node.ts` exists |
| credential source exists | for each `n8n.credentials` entry, corresponding `.credentials.ts` exists in `credentials/` |
| tsconfig.json exists | per-package tsconfig present |
| jest.config.js exists | per-package jest config present |
| README.md exists | per-package README present |
| `__tests__/` exists | at least one `.test.ts` file |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.4.6 |
| Config file | `jest.config.structural.js` (new, root-level) |
| Quick run command | `npx jest --config jest.config.structural.js` |
| Full suite command | `npx jest --config jest.config.structural.js --verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | File |
|--------|----------|-----------|------|
| STRUCT-01 | package.json has all required fields | unit | `package-json.test.ts` |
| STRUCT-02 | codex files exist and have valid schema | unit | `codex.test.ts` |
| STRUCT-03 | SVG icons exist and are valid | unit | `icons.test.ts` |
| STRUCT-04 | build output matches n8n paths | unit | `build-output.test.ts` |
| STRUCT-05 | cross-package consistency | unit | `cross-package.test.ts` |

### Sampling Rate
- **Per task commit:** `npx jest --config jest.config.structural.js`
- **Per wave merge:** `npx jest --config jest.config.structural.js --verbose`
- **Phase gate:** Full suite green

### Wave 0 Gaps
- [ ] `jest.config.structural.js` -- root-level jest config for structural tests
- [ ] `__tests__/structural/helpers.ts` -- shared package discovery utilities
- [ ] Root `package.json` needs `test:structural` script

## Open Questions

1. **Should build-output tests require a prior build?**
   - What we know: `dist/` directories exist locally from previous builds, but CI may not have them
   - Recommendation: Make build-output tests conditional -- skip gracefully if dist/ absent, but validate if present. Document that `npm run build:all && npm run test:structural` is the full validation.

2. **Should we validate icon dimensions (60x60)?**
   - What we know: CLAUDE.md says 60x60, but SVG dimensions are in the viewBox attribute and hard to validate meaningfully
   - Recommendation: Check viewBox attribute exists in SVG content but do NOT enforce exact 60x60 -- SVGs scale.

## Sources

### Primary (HIGH confidence)
- Project filesystem analysis -- all 12 packages surveyed for structure patterns
- CLAUDE.md -- canonical rules for package structure
- Existing package.json files -- pattern analysis of all 12 packages
- Existing codex files -- schema derived from 12 `.node.json` files
- Existing jest.config.base.js -- test infrastructure already in place

### Secondary (MEDIUM confidence)
- n8n community node conventions -- derived from existing working packages and CLAUDE.md spec

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing Jest setup, no new dependencies
- Architecture: HIGH - straightforward filesystem validation with known patterns
- Pitfalls: HIGH - identified from real project structure analysis
- Validation rules: HIGH - derived directly from 12 existing packages

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- structural rules change rarely)
