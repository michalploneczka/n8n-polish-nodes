import * as fs from 'fs';
import * as path from 'path';
import { getPackages, getPackageDir, loadPackageJson } from './helpers';

const ALLOWED_CATEGORIES = [
  'Communication',
  'Data & Storage',
  'Finance & Accounting',
  'Miscellaneous',
  'Commerce',
  'Productivity',
  'Marketing & Content',
  'Sales',
];

const packages = getPackages();

describe.each(packages)('Package %s codex', (pkgName) => {
  let pkg: Record<string, unknown>;
  let pkgDir: string;
  let nodeEntries: Array<{ nodeDir: string; nodeName: string }>;

  beforeAll(() => {
    pkg = loadPackageJson(pkgName);
    pkgDir = getPackageDir(pkgName);

    const n8n = pkg.n8n as Record<string, unknown>;
    const nodes = n8n.nodes as string[];

    // Extract node directory and name from paths like 'dist/nodes/Smsapi/Smsapi.node.js'
    nodeEntries = nodes.map((nodePath) => {
      const parts = nodePath.split('/');
      // parts: ['dist', 'nodes', 'NodeDir', 'NodeName.node.js']
      const nodeDir = parts[2];
      const nodeName = parts[3].replace('.node.js', '');
      return { nodeDir, nodeName };
    });
  });

  it('has at least one node entry', () => {
    expect(nodeEntries.length).toBeGreaterThan(0);
  });

  it('has codex .node.json file for each node', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      expect(fs.existsSync(codexPath)).toBe(true);
    }
  });

  it('codex JSON parses without error', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const content = fs.readFileSync(codexPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });

  it('codex has non-empty "node" string field', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf-8'));
      expect(typeof codex.node).toBe('string');
      expect(codex.node.length).toBeGreaterThan(0);
    }
  });

  it('codex has non-empty "nodeVersion" string field', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf-8'));
      expect(typeof codex.nodeVersion).toBe('string');
      expect(codex.nodeVersion.length).toBeGreaterThan(0);
    }
  });

  it('codex has codexVersion "1.0"', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf-8'));
      expect(codex.codexVersion).toBe('1.0');
    }
  });

  it('codex has non-empty categories array of valid strings', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf-8'));
      expect(Array.isArray(codex.categories)).toBe(true);
      expect(codex.categories.length).toBeGreaterThan(0);
      for (const cat of codex.categories) {
        expect(ALLOWED_CATEGORIES).toContain(cat);
      }
    }
  });

  it('codex does not contain undocumented subcategories field', () => {
    // n8n Creator Portal review (2026-04) flagged `subcategories` as undocumented.
    // Only node, nodeVersion, codexVersion, categories, resources, alias are supported.
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf-8'));
      expect(codex.subcategories).toBeUndefined();
    }
  });

  it('codex has resources.primaryDocumentation with url', () => {
    for (const { nodeDir, nodeName } of nodeEntries) {
      const codexPath = path.join(pkgDir, 'nodes', nodeDir, `${nodeName}.node.json`);
      const codex = JSON.parse(fs.readFileSync(codexPath, 'utf-8'));
      expect(codex.resources).toBeDefined();
      expect(Array.isArray(codex.resources.primaryDocumentation)).toBe(true);
      expect(codex.resources.primaryDocumentation.length).toBeGreaterThan(0);
      for (const doc of codex.resources.primaryDocumentation) {
        expect(typeof doc.url).toBe('string');
        expect(doc.url.length).toBeGreaterThan(0);
      }
    }
  });
});
