const fs = require('fs');
const path = require('path');

const packagesDir = path.join(__dirname, '..', 'packages');
const errors = [];

if (!fs.existsSync(packagesDir)) {
  console.log('No packages directory yet — skipping verification');
  process.exit(0);
}

const packages = fs.readdirSync(packagesDir).filter(d =>
  fs.statSync(path.join(packagesDir, d)).isDirectory()
);

if (packages.length === 0) {
  console.log('No packages found — skipping verification');
  process.exit(0);
}

for (const pkg of packages) {
  const pkgJsonPath = path.join(packagesDir, pkg, 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    errors.push(`${pkg}: missing package.json`);
    continue;
  }

  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));

  // Skip private packages (e.g. shared/test-utils)
  if (pkgJson.private) {
    continue;
  }

  // Check required keyword
  if (!pkgJson.keywords || !pkgJson.keywords.includes('n8n-community-node-package')) {
    errors.push(`${pkg}: missing keyword "n8n-community-node-package"`);
  }

  // Check n8n field exists
  if (!pkgJson.n8n) {
    errors.push(`${pkg}: missing "n8n" field`);
  } else {
    // Check n8n.nodes paths point to dist/
    if (pkgJson.n8n.nodes) {
      for (const nodePath of pkgJson.n8n.nodes) {
        if (!nodePath.startsWith('dist/')) {
          errors.push(`${pkg}: n8n.nodes path "${nodePath}" must start with "dist/"`);
        }
      }
    }
    // Check n8n.credentials paths point to dist/
    if (pkgJson.n8n.credentials) {
      for (const credPath of pkgJson.n8n.credentials) {
        if (!credPath.startsWith('dist/')) {
          errors.push(`${pkg}: n8n.credentials path "${credPath}" must start with "dist/"`);
        }
      }
    }
  }

  // Check repository.directory
  if (!pkgJson.repository || !pkgJson.repository.directory) {
    errors.push(`${pkg}: missing repository.directory (required for provenance)`);
  }

  // Check license
  if (pkgJson.license !== 'MIT') {
    errors.push(`${pkg}: license must be "MIT", got "${pkgJson.license}"`);
  }
}

if (errors.length > 0) {
  console.error('Package verification FAILED:');
  errors.forEach(e => console.error(`  - ${e}`));
  process.exit(1);
} else {
  console.log(`All ${packages.length} package(s) verified successfully`);
}
