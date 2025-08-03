import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix relative imports by adding .js extension
      content = content.replace(
        /from ['"]([^'"]*)(?!\.js)['"]/g,
        (match, p1) => {
          if (p1.startsWith('.') && !p1.endsWith('.js')) {
            // Check if this is a directory import (no file extension)
            const importPath = path.join(path.dirname(filePath), p1);
            if (fs.existsSync(importPath) && fs.statSync(importPath).isDirectory()) {
              // It's a directory, so add /index.js
              return match.replace(p1, p1 + '/index.js');
            } else {
              // It's a file, so add .js
              return match.replace(p1, p1 + '.js');
            }
          }
          return match;
        }
      );
      
      fs.writeFileSync(filePath, content);
      console.log(`Fixed imports in: ${filePath}`);
    }
  });
}

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Fixing import paths...');
  fixImports(distPath);
  console.log('Import paths fixed successfully!');
} else {
  console.log('dist directory not found. Run build first.');
}