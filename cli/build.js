const fs = require('fs');
const path = require('path');

// Simple build script that copies src to dist with .js extension
const srcDir = path.join(__dirname, 'src');
const distDir = path.join(__dirname, 'dist');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      const content = fs.readFileSync(srcPath, 'utf8');
      // For .ts files, change to .js
      const destFile = entry.name.endsWith('.ts')
        ? entry.name.slice(0, -3) + '.js'
        : entry.name;
      fs.writeFileSync(path.join(dest, destFile), content);
    }
  }
}

// Add shebang to index.js
const indexSrc = path.join(srcDir, 'index.ts');
const indexDest = path.join(distDir, 'index.js');
const content = fs.readFileSync(indexSrc, 'utf8');

// Ensure shebang is at the top
let finalContent = content;
if (!finalContent.startsWith('#!/usr/bin/env node')) {
  finalContent = '#!/usr/bin/env node\n' + finalContent;
}

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(indexDest, finalContent);

// Copy all other files
copyDir(srcDir, distDir);

console.log('Build complete!');
