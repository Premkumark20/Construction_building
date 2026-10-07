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

// Copy static asset directories
if (fs.existsSync(distDir)) {
  copyDir(path.resolve('uploads'), path.join(distDir, 'uploads'));
  copyDir(path.resolve('logo'), path.join(distDir, 'logo'));
  copyDir(path.resolve('frames'), path.join(distDir, 'frames'));
  copyDir(path.resolve('videos'), path.join(distDir, 'videos'));
  console.log('Successfully copied uploads, logo, frames, and videos into dist/ for static serving.');

  // Create 404.html for GitHub Pages single page application routing
  const indexHtmlPath = path.join(distDir, 'index.html');
  const notFoundHtmlPath = path.join(distDir, '404.html');
  if (fs.existsSync(indexHtmlPath)) {
    fs.copyFileSync(indexHtmlPath, notFoundHtmlPath);
    console.log('Successfully generated dist/404.html for GitHub Pages client-side routing.');
  }
}

copyDir(path.resolve('logo'), path.resolve('app/public/logo'));
