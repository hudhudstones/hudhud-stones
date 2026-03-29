#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const distPublic = path.join(projectRoot, 'dist', 'public');
const outputFile = path.join(projectRoot, 'server', 'assets-manifest.ts');

// Read all files from dist/public
function getFiles(dir, prefix = '') {
  const files = {};
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      Object.assign(files, getFiles(fullPath, relativePath));
    } else {
      const content = fs.readFileSync(fullPath, 'utf-8');
      files[relativePath] = content;
    }
  }
  
  return files;
}

const assets = getFiles(distPublic);

// Generate TypeScript file
const tsContent = `// Auto-generated asset manifest
export const ASSETS: Record<string, string> = ${JSON.stringify(assets, null, 2)};

export function getAsset(path: string): string | undefined {
  // Try exact match
  if (ASSETS[path]) return ASSETS[path];
  
  // Try without leading slash
  if (path.startsWith('/')) {
    const withoutSlash = path.slice(1);
    if (ASSETS[withoutSlash]) return ASSETS[withoutSlash];
  }
  
  // Try with leading slash
  if (!path.startsWith('/')) {
    if (ASSETS['/' + path]) return ASSETS['/' + path];
  }
  
  return undefined;
}

export function getMimeType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.json')) return 'application/json';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) return 'image/jpeg';
  if (filePath.endsWith('.gif')) return 'image/gif';
  if (filePath.endsWith('.webp')) return 'image/webp';
  if (filePath.endsWith('.woff')) return 'font/woff';
  if (filePath.endsWith('.woff2')) return 'font/woff2';
  if (filePath.endsWith('.ttf')) return 'font/ttf';
  return 'application/octet-stream';
}
`;

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, tsContent);

console.log(`✓ Generated assets manifest with ${Object.keys(assets).length} files`);
console.log(`✓ Total size: ${JSON.stringify(assets).length} bytes`);
