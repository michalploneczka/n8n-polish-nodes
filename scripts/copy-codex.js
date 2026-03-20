const { globSync } = require('fast-glob');
const { cpSync, mkdirSync } = require('fs');
const path = require('path');

const files = globSync(['**/*.node.json'], { ignore: ['dist', 'node_modules'] });

for (const filePath of files) {
  const destPath = path.join('dist', filePath);
  mkdirSync(path.dirname(destPath), { recursive: true });
  cpSync(filePath, destPath);
}

if (files.length > 0) {
  console.log(`Copied ${files.length} codex file(s) to dist/`);
}
