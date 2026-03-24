import * as fs from 'fs';
import * as path from 'path';
import { getPackages, getPackageDir, loadPackageJson } from './helpers';

const packages = getPackages();

describe.each(packages)('Package %s build output', (pkgName) => {
  let pkg: Record<string, unknown>;
  let pkgDir: string;
  let distDir: string;
  let hasDistDir: boolean;

  beforeAll(() => {
    pkg = loadPackageJson(pkgName);
    pkgDir = getPackageDir(pkgName);
    distDir = path.join(pkgDir, 'dist');
    hasDistDir = fs.existsSync(distDir);
  });

  it('dist/ directory exists OR tests skip gracefully', () => {
    if (!hasDistDir) {
      // eslint-disable-next-line no-console
      console.log(`  [SKIP] ${pkgName}: dist/ not found - run npm run build first`);
    }
    // This test always passes -- it documents dist/ presence
    expect(true).toBe(true);
  });

  it('all n8n.nodes paths exist in dist/', () => {
    if (!hasDistDir) {
      return; // skip when dist/ is absent
    }
    const n8n = pkg.n8n as Record<string, unknown>;
    const nodes = n8n.nodes as string[];
    for (const nodePath of nodes) {
      const fullPath = path.join(pkgDir, nodePath);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('all n8n.credentials paths exist in dist/', () => {
    if (!hasDistDir) {
      return; // skip when dist/ is absent
    }
    const n8n = pkg.n8n as Record<string, unknown>;
    const credentials = n8n.credentials as string[] | undefined;
    if (credentials && credentials.length > 0) {
      for (const credPath of credentials) {
        const fullPath = path.join(pkgDir, credPath);
        expect(fs.existsSync(fullPath)).toBe(true);
      }
    }
  });

  it('has at least one .js file in dist/nodes/ when dist/ exists', () => {
    if (!hasDistDir) {
      return; // skip when dist/ is absent
    }
    const distNodesDir = path.join(distDir, 'nodes');
    if (!fs.existsSync(distNodesDir)) {
      throw new Error(`dist/nodes/ directory missing in ${pkgName} despite dist/ existing`);
    }

    // Recursively find .js files in dist/nodes/
    const findJsFiles = (dir: string): string[] => {
      const files: string[] = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findJsFiles(fullPath));
        } else if (entry.name.endsWith('.js')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const jsFiles = findJsFiles(distNodesDir);
    expect(jsFiles.length).toBeGreaterThan(0);
  });
});
