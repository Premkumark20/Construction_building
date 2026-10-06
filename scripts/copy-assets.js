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

// Helper to write static JSON snapshots for static deployment (GitHub Pages)
function writeApiFile(subpath, data) {
  const jsonString = JSON.stringify(data, null, 2);
  const targets = [
    path.join(distDir, 'api', subpath),
    path.resolve('app/public/api', subpath)
  ];

  targets.forEach((targetPath) => {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    // Write both with and without .json extension for maximum host compatibility
    fs.writeFileSync(`${targetPath}.json`, jsonString, 'utf-8');
    fs.writeFileSync(targetPath, jsonString, 'utf-8');
  });
}

// Generate static data snapshot from SQLite database if available
async function exportStaticApiData() {
  const dbPath = path.resolve('app/server/database/showcase.db');
  if (!fs.existsSync(dbPath)) return;

  try {
    const sqlite3 = (await import('sqlite3')).default;
    const db = new sqlite3.Database(dbPath);

    const queryAll = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
      });

    const queryOne = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row || null)));
      });

    const [settingsRow, adminRow, services, stats, properties, land, projects, gallery, testimonials, heroVideo] = await Promise.all([
      queryOne('SELECT * FROM site_settings LIMIT 1'),
      queryOne('SELECT phone, email, facebook, instagram, whatsapp, display_username FROM admin_users LIMIT 1'),
      queryAll('SELECT * FROM services ORDER BY display_order ASC, id ASC'),
      queryAll('SELECT * FROM stats ORDER BY display_order ASC, id ASC'),
      queryAll('SELECT * FROM properties WHERE published = 1 ORDER BY id DESC'),
      queryAll('SELECT * FROM land WHERE published = 1 ORDER BY id DESC'),
      queryAll('SELECT * FROM projects WHERE published = 1 ORDER BY id DESC'),
      queryAll('SELECT * FROM gallery ORDER BY id DESC'),
      queryAll('SELECT * FROM testimonials ORDER BY id DESC'),
      queryOne('SELECT * FROM media_videos WHERE is_primary = 1 LIMIT 1')
    ]);

    writeApiFile('settings', { settings: settingsRow || {}, admin: adminRow || {} });
    writeApiFile('services', services);
    writeApiFile('stats', stats);
    writeApiFile('properties', { properties });
    writeApiFile('land', { land });
    writeApiFile('projects', { projects });
    writeApiFile('gallery', gallery);
    writeApiFile('testimonials', testimonials);
    writeApiFile('media/hero-video', heroVideo || { video: null });
    writeApiFile('media/frame-urls', { frameUrls: [] });
    writeApiFile('media/frame-progress', { ready: 121, total: 121, progress: 100, status: 'ready' });

    console.log('Successfully exported static API snapshots for GitHub Pages & static hosting.');
    db.close();
  } catch (err) {
    console.warn('Notice exporting static API data (using defaults):', err.message);
  }
}

await exportStaticApiData();
