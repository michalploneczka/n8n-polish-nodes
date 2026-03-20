const { cpSync, mkdirSync, readdirSync, existsSync } = require('fs');
const path = require('path');

function findCodexFiles(dir, results = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'dist' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findCodexFiles(fullPath, results);
    } else if (entry.name.endsWith('.node.json')) {
      results.push(path.relative('.', fullPath));
    }
  }
  return results;
}

const files = findCodexFiles('.');

for (const filePath of files) {
  const destPath = path.join('dist', filePath);
  mkdirSync(path.dirname(destPath), { recursive: true });
  cpSync(filePath, destPath);
}

if (files.length > 0) {
  console.log(`Copied ${files.length} codex file(s) to dist/`);
}
