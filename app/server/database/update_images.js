import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'showcase.db'));
db.serialize(() => {
  db.run("UPDATE properties SET image = '/logo/sk-builders-logo.png' WHERE image = '/house/completed-house.jpg' OR image IS NULL OR image = ''", (err) => {
    if (err) console.error('Prop update error:', err);
  });
  db.run("UPDATE land SET image = '/logo/sk-builders-logo.png' WHERE image = '/house/completed-house.jpg' OR image IS NULL OR image = ''", (err) => {
    if (err) console.error('Land update error:', err);
  });
  db.run("UPDATE projects SET cover_image = '/logo/sk-builders-logo.png' WHERE cover_image = '/house/completed-house.jpg' OR cover_image IS NULL OR cover_image = ''", (err) => {
    if (err) console.error('Proj update error:', err);
  });
  db.all('SELECT id, property_id, title, image FROM properties', (err, rows) => {
    console.log('Properties:', rows);
    db.close();
  });
});
