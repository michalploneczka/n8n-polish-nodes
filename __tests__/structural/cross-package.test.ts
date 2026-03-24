import * as fs from 'fs';
import * as path from 'path';
import { getPackages, getPackageDir, loadPackageJson } from './helpers';

const packages = getPackages();

describe('Consistent metadata across all packages', () => {
  const allPkgs = packages.map((name) => ({
    name,
    pkg: loadPackageJson(name),
  }));

  it('all packages have identical author.name', () => {
    for (const { name, pkg } of allPkgs) {
      const author = pkg.author as Record<string, string>;
      expect(author.name).toBe('Michal Ploneczka');
    }
  });

  it('all packages have identical author.email', () => {
    for (const { name, pkg } of allPkgs) {
      const author = pkg.author as Record<string, string>;
      expect(author.email).toBe('michal.ploneczka@gmail.com');
    }
  });

  it('all packages have identical repository.url', () => {
    for (const { name, pkg } of allPkgs) {
      const repo = pkg.repository as Record<string, string>;
      expect(repo.url).toBe('https://github.com/michalploneczka/n8n-polish-nodes.git');
    }
  });

  it('all packages have identical license (MIT)', () => {
    for (const { name, pkg } of allPkgs) {
      expect(pkg.license).toBe('MIT');
    }
  });

  it('all packages have identical n8n.n8nNodesApiVersion (1)', () => {
    for (const { name, pkg } of allPkgs) {
      const n8n = pkg.n8n as Record<string, unknown>;
      expect(n8n.n8nNodesApiVersion).toBe(1);
    }
  });

  it('all packages have identical n8n.strict (false)', () => {
    for (const { name, pkg } of allPkgs) {
      const n8n = pkg.n8n as Record<string, unknown>;
      expect(n8n.strict).toBe(false);
    }
  });
});

describe('No duplicate package names', () => {
  it('all package names are unique', () => {
    const names = packages.map((name) => {
      const pkg = loadPackageJson(name);
      return pkg.name as string;
    });
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('Repository directory matches package location', () => {
  it.each(packages)('%s has correct repository.directory', (pkgName) => {
    const pkg = loadPackageJson(pkgName);
    const repo = pkg.repository as Record<string, string>;
    expect(repo.directory).toBe(`packages/${pkgName}`);
  });
});

describe.each(packages)('Package %s source file alignment', (pkgName) => {
  let pkg: Record<string, unknown>;
  let pkgDir: string;

  beforeAll(() => {
    pkg = loadPackageJson(pkgName);
    pkgDir = getPackageDir(pkgName);
  });

  it('source .node.ts files exist for each n8n.nodes entry', () => {
    const n8n = pkg.n8n as Record<string, unknown>;
    const nodes = n8n.nodes as string[];
    for (const nodePath of nodes) {
      // dist/nodes/NodeName/NodeName.node.js -> nodes/NodeName/NodeName.node.ts
      const sourcePath = nodePath
        .replace(/^dist\//, '')
        .replace(/\.js$/, '.ts');
      const fullPath = path.join(pkgDir, sourcePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('source .credentials.ts files exist for each n8n.credentials entry', () => {
    const n8n = pkg.n8n as Record<string, unknown>;
    const credentials = n8n.credentials as string[] | undefined;
    if (credentials && credentials.length > 0) {
      for (const credPath of credentials) {
        // dist/credentials/CredName.credentials.js -> credentials/CredName.credentials.ts
        const sourcePath = credPath
          .replace(/^dist\//, '')
          .replace(/\.js$/, '.ts');
        const fullPath = path.join(pkgDir, sourcePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    }
  });

  it('tsconfig.json exists', () => {
    expect(fs.existsSync(path.join(pkgDir, 'tsconfig.json'))).toBe(true);
  });

  it('jest.config.js exists', () => {
    expect(fs.existsSync(path.join(pkgDir, 'jest.config.js'))).toBe(true);
  });

  it('README.md exists', () => {
    expect(fs.existsSync(path.join(pkgDir, 'README.md'))).toBe(true);
  });

  it('__tests__/ directory exists with at least one .test.ts file', () => {
    const testsDir = path.join(pkgDir, '__tests__');
    expect(fs.existsSync(testsDir)).toBe(true);

    // Recursively find .test.ts files
    const findTestFiles = (dir: string): string[] => {
      const files: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findTestFiles(fullPath));
        } else if (entry.name.endsWith('.test.ts')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const testFiles = findTestFiles(testsDir);
    expect(testFiles.length).toBeGreaterThan(0);
  });
});
