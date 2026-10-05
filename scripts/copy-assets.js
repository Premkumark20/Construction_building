import fs from 'fs';
import path from 'path';

const copyDir = (src, dest) => {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
};

const distDir = path.resolve('dist');
if (fs.existsSync(distDir)) {
  copyDir(path.resolve('uploads'), path.join(distDir, 'uploads'));
  copyDir(path.resolve('logo'), path.join(distDir, 'logo'));
  console.log('Successfully copied uploads and logo into dist/ for static serving.');
}
