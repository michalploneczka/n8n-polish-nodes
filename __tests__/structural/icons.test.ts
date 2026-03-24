import * as fs from 'fs';
import * as path from 'path';
import { getPackages, getPackageDir } from './helpers';

const packages = getPackages();

describe.each(packages)('Package %s icons', (pkgName) => {
  const pkgDir = getPackageDir(pkgName);
  const iconsDir = path.join(pkgDir, 'icons');

  it('has an icons directory with at least one SVG file', () => {
    expect(fs.existsSync(iconsDir)).toBe(true);
    const svgFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));
    expect(svgFiles.length).toBeGreaterThan(0);
  });

  it('has valid SVG content', () => {
    const svgFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));
    for (const svgFile of svgFiles) {
      const svgPath = path.join(iconsDir, svgFile);
      const content = fs.readFileSync(svgPath, 'utf-8').trim();
      expect(content).toMatch(/^(<\?xml|<svg)/);
    }
  });

  it('has SVG file larger than 100 bytes', () => {
    const svgFiles = fs.readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));
    for (const svgFile of svgFiles) {
      const svgPath = path.join(iconsDir, svgFile);
      const stats = fs.statSync(svgPath);
      expect(stats.size).toBeGreaterThan(100);
    }
  });
});
