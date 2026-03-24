import * as fs from 'fs';
import * as path from 'path';

export const PACKAGES_DIR = path.join(__dirname, '../../packages');

/**
 * Auto-discover all n8n node packages in the monorepo.
 * Returns sorted array of directory names starting with 'n8n-nodes-'.
 */
export function getPackages(): string[] {
  return fs
    .readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('n8n-nodes-'))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Returns absolute path to a package directory.
 */
export function getPackageDir(pkgName: string): string {
  return path.join(PACKAGES_DIR, pkgName);
}

/**
 * Reads and parses package.json from a given package.
 */
export function loadPackageJson(pkgName: string): Record<string, unknown> {
  const pkgPath = path.join(getPackageDir(pkgName), 'package.json');
  return JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
}

/**
 * Packages that use public APIs and require no credentials.
 * Their n8n.credentials array should be empty.
 */
export const PUBLIC_API_PACKAGES: string[] = [
  'n8n-nodes-nbp',
  'n8n-nodes-krs',
  'n8n-nodes-vies',
  'n8n-nodes-biala-lista-vat',
  'n8n-nodes-nfz',
];
