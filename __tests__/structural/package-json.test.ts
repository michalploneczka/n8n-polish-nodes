import { getPackages, loadPackageJson, PUBLIC_API_PACKAGES } from './helpers';

const packages = getPackages();

describe.each(packages)('Package %s', (pkgName) => {
  let pkg: Record<string, unknown>;

  beforeAll(() => {
    pkg = loadPackageJson(pkgName);
  });

  it('has name starting with n8n-nodes-', () => {
    expect(pkg.name).toMatch(/^n8n-nodes-/);
  });

  it('has valid semver version', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('has meaningful description (>10 chars)', () => {
    expect(typeof pkg.description).toBe('string');
    expect((pkg.description as string).length).toBeGreaterThan(10);
  });

  it('has n8n-community-node-package keyword', () => {
    expect(pkg.keywords).toEqual(expect.arrayContaining(['n8n-community-node-package']));
  });

  it('has MIT license', () => {
    expect(pkg.license).toBe('MIT');
  });

  it('has correct author.name', () => {
    const author = pkg.author as Record<string, string>;
    expect(author.name).toBe('Michal Ploneczka');
  });

  it('has correct author.email', () => {
    const author = pkg.author as Record<string, string>;
    expect(author.email).toBe('mp@codersgroup.pl');
  });

  it('has correct author.url', () => {
    const author = pkg.author as Record<string, string>;
    expect(author.url).toBe('https://codersgroup.pl');
  });

  it('has correct repository.url', () => {
    const repo = pkg.repository as Record<string, string>;
    expect(repo.url).toBe('https://github.com/michalploneczka/n8n-polish-nodes.git');
  });

  it('has correct repository.directory', () => {
    const repo = pkg.repository as Record<string, string>;
    expect(repo.directory).toBe(`packages/${pkgName}`);
  });

  it('has dist in files array', () => {
    expect(pkg.files).toEqual(expect.arrayContaining(['dist']));
  });

  it('has n8n.n8nNodesApiVersion === 1', () => {
    const n8n = pkg.n8n as Record<string, unknown>;
    expect(n8n.n8nNodesApiVersion).toBe(1);
  });

  it('has non-empty n8n.nodes array with dist/nodes/ paths', () => {
    const n8n = pkg.n8n as Record<string, unknown>;
    const nodes = n8n.nodes as string[];
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      expect(node).toMatch(/^dist\/nodes\//);
    }
  });

  if (PUBLIC_API_PACKAGES.includes(pkgName)) {
    it('has empty n8n.credentials array (public API)', () => {
      const n8n = pkg.n8n as Record<string, unknown>;
      const credentials = n8n.credentials as string[] | undefined;
      expect(credentials === undefined || (Array.isArray(credentials) && credentials.length === 0)).toBe(true);
    });
  } else {
    it('has non-empty n8n.credentials array with dist/credentials/ paths', () => {
      const n8n = pkg.n8n as Record<string, unknown>;
      const credentials = n8n.credentials as string[];
      expect(credentials.length).toBeGreaterThan(0);
      for (const cred of credentials) {
        expect(cred).toMatch(/^dist\/credentials\//);
      }
    });
  }

  it('has n8n-workflow as peerDependency', () => {
    const peerDeps = pkg.peerDependencies as Record<string, string>;
    expect(peerDeps).toHaveProperty('n8n-workflow');
  });

  it('has build script containing n8n-node', () => {
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.build).toBeDefined();
    expect(scripts.build).toContain('n8n-node');
  });

  it('has test script defined', () => {
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.test).toBeDefined();
  });

  it('has lint script containing n8n-node', () => {
    const scripts = pkg.scripts as Record<string, string>;
    expect(scripts.lint).toBeDefined();
    expect(scripts.lint).toContain('n8n-node');
  });
});
