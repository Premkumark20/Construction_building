import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');

const dbPath = path.join(__dirname, 'showcase.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at', dbPath);
    db.run('PRAGMA journal_mode = WAL;');
    db.run('PRAGMA busy_timeout = 5000;');
    initDatabase();
  }
});

function initDatabase() {
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql, (err) => {
    if (err) {
      console.error('Error executing schema SQL:', err);
      return;
    }
    console.log('Database tables initialized.');
    ensureColumns();
  });
}

// Safely ensure all columns exist for existing databases
function ensureColumns() {
  const safeAdd = (table, col, def) => {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`, () => {});
  };

  // Properties table columns
  safeAdd('properties', 'property_id', 'TEXT');
  safeAdd('properties', 'title', 'TEXT');
  safeAdd('properties', 'type', 'TEXT');
  safeAdd('properties', 'category', "TEXT DEFAULT 'Houses for Sale'");
  safeAdd('properties', 'status', "TEXT DEFAULT 'Available'");
  safeAdd('properties', 'listing_type', "TEXT DEFAULT 'For Sale'");
  safeAdd('properties', 'location', 'TEXT');
  safeAdd('properties', 'address', 'TEXT');
  safeAdd('properties', 'area', 'TEXT');
  safeAdd('properties', 'city', "TEXT DEFAULT 'Chennai'");
  safeAdd('properties', 'pincode', 'TEXT');
  safeAdd('properties', 'maps_url', 'TEXT');
  safeAdd('properties', 'latitude', 'TEXT');
  safeAdd('properties', 'longitude', 'TEXT');
  safeAdd('properties', 'landmark', 'TEXT');
  safeAdd('properties', 'price', 'TEXT');
  safeAdd('properties', 'price_display_type', "TEXT DEFAULT 'Exact Price'");
  safeAdd('properties', 'negotiable', "TEXT DEFAULT 'Yes'");
  safeAdd('properties', 'price_per_sqft', 'TEXT');
  safeAdd('properties', 'plot_area', 'TEXT');
  safeAdd('properties', 'plot_size', 'TEXT');
  safeAdd('properties', 'plot_area_unit', "TEXT DEFAULT 'sq.ft'");
  safeAdd('properties', 'builtup_area', 'TEXT');
  safeAdd('properties', 'builtup_area_unit', "TEXT DEFAULT 'sq.ft'");
  safeAdd('properties', 'floor_area', 'TEXT');
  safeAdd('properties', 'floors', 'TEXT');
  safeAdd('properties', 'bedrooms', 'TEXT');
  safeAdd('properties', 'bathrooms', 'TEXT');
  safeAdd('properties', 'balconies', 'TEXT');
  safeAdd('properties', 'kitchens', 'TEXT');
  safeAdd('properties', 'living_room', 'TEXT');
  safeAdd('properties', 'dining_area', 'TEXT');
  safeAdd('properties', 'pooja_room', 'TEXT');
  safeAdd('properties', 'construction_status', "TEXT DEFAULT 'Completed'");
  safeAdd('properties', 'year_built', 'TEXT');
  safeAdd('properties', 'construction_type', "TEXT DEFAULT 'RCC / Concrete'");
  safeAdd('properties', 'roof_type', "TEXT DEFAULT 'RCC Flat Concrete Roof'");
  safeAdd('properties', 'parking_available', "TEXT DEFAULT 'Yes'");
  safeAdd('properties', 'parking_type', "TEXT DEFAULT 'Car + Bike'");
  safeAdd('properties', 'cars', 'TEXT');
  safeAdd('properties', 'bikes', 'TEXT');
  safeAdd('properties', 'compound_wall', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'gate', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'water_connection', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'eb_connection', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'sewer_connection', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'borewell', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'overhead_tank', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'ground_water', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'road_access', 'INTEGER DEFAULT 0');
  safeAdd('properties', 'facing', "TEXT DEFAULT 'East'");
  safeAdd('properties', 'road_width', 'TEXT');
  safeAdd('properties', 'road_width_unit', "TEXT DEFAULT 'ft'");
  safeAdd('properties', 'road_type', 'TEXT');
  safeAdd('properties', 'corner_property', "TEXT DEFAULT 'No'");
  safeAdd('properties', 'patta_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('properties', 'ec_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('properties', 'approved_plan_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('properties', 'building_approval_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('properties', 'property_tax_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('properties', 'sale_deed_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('properties', 'other_documents', 'TEXT');
  safeAdd('properties', 'short_description', 'TEXT');
  safeAdd('properties', 'full_description', 'TEXT');
  safeAdd('properties', 'description', 'TEXT');
  safeAdd('properties', 'highlights', 'TEXT');
  safeAdd('properties', 'image', 'TEXT');
  safeAdd('properties', 'published', 'INTEGER DEFAULT 1');
  safeAdd('properties', 'featured', 'INTEGER DEFAULT 0');

  // Land table columns
  safeAdd('land', 'land_id', 'TEXT');
  safeAdd('land', 'title', 'TEXT');
  safeAdd('land', 'land_type', "TEXT DEFAULT 'Residential Plot'");
  safeAdd('land', 'listing_type', "TEXT DEFAULT 'For Sale'");
  safeAdd('land', 'status', "TEXT DEFAULT 'Available'");
  safeAdd('land', 'address', 'TEXT');
  safeAdd('land', 'area', 'TEXT');
  safeAdd('land', 'city', "TEXT DEFAULT 'Chennai'");
  safeAdd('land', 'pincode', 'TEXT');
  safeAdd('land', 'maps_url', 'TEXT');
  safeAdd('land', 'latitude', 'TEXT');
  safeAdd('land', 'longitude', 'TEXT');
  safeAdd('land', 'landmark', 'TEXT');
  safeAdd('land', 'plot_area', 'TEXT');
  safeAdd('land', 'plot_area_unit', "TEXT DEFAULT 'sq.ft'");
  safeAdd('land', 'frontage', 'TEXT');
  safeAdd('land', 'length', 'TEXT');
  safeAdd('land', 'width', 'TEXT');
  safeAdd('land', 'total_price', 'TEXT');
  safeAdd('land', 'price', 'TEXT');
  safeAdd('land', 'price_per_sqft', 'TEXT');
  safeAdd('land', 'negotiable', "TEXT DEFAULT 'Yes'");
  safeAdd('land', 'price_display_type', "TEXT DEFAULT 'Exact Price'");
  safeAdd('land', 'approval_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('land', 'facing', "TEXT DEFAULT 'East'");
  safeAdd('land', 'road_width', 'TEXT');
  safeAdd('land', 'road_width_unit', "TEXT DEFAULT 'ft'");
  safeAdd('land', 'road_type', 'TEXT');
  safeAdd('land', 'road_facing', 'TEXT');
  safeAdd('land', 'corner_plot', "TEXT DEFAULT 'No'");
  safeAdd('land', 'eb_available', 'INTEGER DEFAULT 0');
  safeAdd('land', 'water_available', 'INTEGER DEFAULT 0');
  safeAdd('land', 'drainage_available', 'INTEGER DEFAULT 0');
  safeAdd('land', 'borewell_available', 'INTEGER DEFAULT 0');
  safeAdd('land', 'patta_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('land', 'ec_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('land', 'parent_documents_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('land', 'sale_deed_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('land', 'approval_documents_status', "TEXT DEFAULT 'Not Provided'");
  safeAdd('land', 'other_documents', 'TEXT');
  safeAdd('land', 'nearby_school', 'TEXT');
  safeAdd('land', 'nearby_hospital', 'TEXT');
  safeAdd('land', 'nearby_bus_stop', 'TEXT');
  safeAdd('land', 'nearby_railway', 'TEXT');
  safeAdd('land', 'nearby_main_road', 'TEXT');
  safeAdd('land', 'nearby_shopping', 'TEXT');
  safeAdd('land', 'short_description', 'TEXT');
  safeAdd('land', 'full_description', 'TEXT');
  safeAdd('land', 'description', 'TEXT');
  safeAdd('land', 'highlights', 'TEXT');
  safeAdd('land', 'image', 'TEXT');
  safeAdd('land', 'published', 'INTEGER DEFAULT 1');
  safeAdd('land', 'featured', 'INTEGER DEFAULT 0');
  safeAdd('land', 'location', 'TEXT');

  // Projects table columns
  safeAdd('projects', 'project_id', 'TEXT');
  safeAdd('projects', 'name', 'TEXT');
  safeAdd('projects', 'title', 'TEXT');
  safeAdd('projects', 'project_type', "TEXT DEFAULT 'Individual House'");
  safeAdd('projects', 'status', "TEXT DEFAULT 'Completed'");
  safeAdd('projects', 'address', 'TEXT');
  safeAdd('projects', 'area', 'TEXT');
  safeAdd('projects', 'city', "TEXT DEFAULT 'Chennai'");
  safeAdd('projects', 'pincode', 'TEXT');
  safeAdd('projects', 'maps_url', 'TEXT');
  safeAdd('projects', 'latitude', 'TEXT');
  safeAdd('projects', 'longitude', 'TEXT');
  safeAdd('projects', 'plot_area', 'TEXT');
  safeAdd('projects', 'plot_area_unit', "TEXT DEFAULT 'sq.ft'");
  safeAdd('projects', 'builtup_area', 'TEXT');
  safeAdd('projects', 'builtup_area_unit', "TEXT DEFAULT 'sq.ft'");
  safeAdd('projects', 'floors', 'TEXT');
  safeAdd('projects', 'bedrooms', 'TEXT');
  safeAdd('projects', 'bathrooms', 'TEXT');
  safeAdd('projects', 'start_date', 'TEXT');
  safeAdd('projects', 'expected_completion_date', 'TEXT');
  safeAdd('projects', 'actual_completion_date', 'TEXT');
  safeAdd('projects', 'rcc_structure', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'concrete_roof', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'compound_wall', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'gate', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'parking', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'water_connection', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'electrical_work', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'plumbing', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'painting', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'interior_work', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'overview', 'TEXT');
  safeAdd('projects', 'description', 'TEXT');
  safeAdd('projects', 'construction_details', 'TEXT');
  safeAdd('projects', 'special_features', 'TEXT');
  safeAdd('projects', 'challenges', 'TEXT');
  safeAdd('projects', 'solutions', 'TEXT');
  safeAdd('projects', 'completion_date', 'TEXT');
  safeAdd('projects', 'cover_image', 'TEXT');
  safeAdd('projects', 'image', 'TEXT');
  safeAdd('projects', 'published', 'INTEGER DEFAULT 1');
  safeAdd('projects', 'featured', 'INTEGER DEFAULT 0');
  safeAdd('projects', 'location', 'TEXT');

  safeAdd('site_settings', 'logo_url', "TEXT DEFAULT '/logo/sk-builders-logo.png'");
  safeAdd('site_settings', 'phone', 'TEXT');
  safeAdd('site_settings', 'whatsapp_number', 'TEXT');

  safeAdd('media_videos', 'video_type', "TEXT DEFAULT 'hero'");

  // Migrate gallery table to only (id, image, created_at) and clean image paths
  db.all("PRAGMA table_info(gallery)", [], (err, columns) => {
    if (!err && Array.isArray(columns)) {
      const colNames = columns.map(c => c.name);
      if (colNames.includes('title') || colNames.includes('location') || colNames.includes('category')) {
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS gallery_clean (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);
          db.run(`INSERT INTO gallery_clean (id, image, created_at) SELECT id, image, created_at FROM gallery WHERE image IS NOT NULL AND image != ''`);
          db.run(`DROP TABLE gallery`);
          db.run(`ALTER TABLE gallery_clean RENAME TO gallery`);
          console.log('Gallery table successfully migrated to only (id, image, created_at).');
        });
      }
    }
  });

  // Clean any legacy upload- prefixes in gallery database records
  db.all("SELECT id, image FROM gallery WHERE image LIKE '%upload-%'", [], (err, rows) => {
    if (!err && Array.isArray(rows)) {
      rows.forEach(r => {
        const cleanPath = r.image.replace('/upload-', '/');
        db.run("UPDATE gallery SET image = ? WHERE id = ?", [cleanPath, r.id]);
      });
    }
  });

  seedInitialData();
}

function seedInitialData() {
  const bgVideosDir = path.join(projectRoot, 'app/public/videos');
  if (!fs.existsSync(bgVideosDir)) {
    fs.mkdirSync(bgVideosDir, { recursive: true });
  }

  // 1. Purge records pointing to deleted files
  db.all("SELECT * FROM media_videos", [], (err, rows) => {
    if (!err && Array.isArray(rows)) {
      rows.forEach(r => {
        let fullP = path.join(projectRoot, r.filepath);
        if (!fs.existsSync(fullP)) {
          // Check alternate paths
          const alt1 = path.join(bgVideosDir, r.filename);
          const alt2 = path.join(projectRoot, 'uploads/videos', r.filename);
          if (!fs.existsSync(alt1) && !fs.existsSync(alt2)) {
            db.run("DELETE FROM media_videos WHERE id = ?", [r.id]);
          }
        }
      });
    }

    // 2. Scan app/public/videos folder for background videos and register them
    try {
      const bgFiles = fs.readdirSync(bgVideosDir).filter(f => f.toLowerCase().endsWith('.mp4') || f.toLowerCase().endsWith('.webm'));
      bgFiles.forEach(file => {
        const stats = fs.statSync(path.join(bgVideosDir, file));
        db.get("SELECT id FROM media_videos WHERE LOWER(filename) = LOWER(?) AND video_type = 'background'", [file], (err, existing) => {
          if (!existing) {
            db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = 'background' AND is_primary = 1", [], (err, primRow) => {
              const isPrim = (!primRow || primRow.count === 0) ? 1 : 0;
              db.run(
                "INSERT INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'background', ?, ?)",
                [file, `app/public/videos/${file}`, isPrim, stats.size]
              );
            });
          }
        });
      });
    } catch (e) {
      console.error('Error scanning background videos folder:', e);
    }
  });

  // Seed admin user only if table is empty
  db.get("SELECT COUNT(*) as count FROM admin_users", [], (err, row) => {
    if (!err && (!row || row.count === 0)) {
      db.run(`
        INSERT INTO admin_users (username, password, phone, email, facebook, instagram, whatsapp)
        VALUES ('admin', 'admin123', '', 'info@skbuilders.com', 'https://facebook.com', 'https://instagram.com', '')
      `);
    }
  });

  // Seed site settings
  db.get("SELECT COUNT(*) as count FROM site_settings", [], (err, row) => {
    if (!err && row.count === 0) {
      db.run(`
        INSERT INTO site_settings (
          company_name, company_subtitle, phone, email, location, service_areas,
          hero_tagline, hero_headline_find, hero_headline_property, hero_headline_confidence, hero_subtitle,
          facebook_url, instagram_url, whatsapp_number
        ) VALUES (
          'SK BUILDERS', '& PROPERTY CONSULTANT', '', 'info@skbuilders.com',
          'Poonamallee, Mangadu, Kundrathur, Tamil Nadu - 600056', 'Poonamallee • Mangadu • Kundrathur',
          'BUILDING QUALITY HOMES.', 'Find', 'Right Property', 'Confidence',
          'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation in Poonamallee, Mangadu & Kundrathur.',
          'https://facebook.com', 'https://instagram.com', ''
        )
      `);
    }
  });

  // Seed services
  db.get("SELECT COUNT(*) as count FROM services", [], (err, row) => {
    if (!err && row.count === 0) {
      const insert = db.prepare(`
        INSERT INTO services (title, description, icon_name, link_url, display_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      const list = [
        ['Houses for Sale', 'Ready-to-move individual houses built with quality and trust.', 'Home', '#properties', 1],
        ['Lands for Sale', 'Residential plots in prime locations. DTCP approved plots available.', 'MapPin', '#properties', 2],
        ['Contract House Construction', 'We build your dream home on your land with quality and on-time delivery.', 'HardHat', '#contact', 3],
        ['Property Consultant', 'Expert help for buying or selling land and houses. End-to-end guidance.', 'Users', '#contact', 4],
        ['Documentation Support', 'Assistance for all property related documents and legal process.', 'FileText', '#contact', 5],
        ['Construction Consultation', 'Planning, estimation, site visit and expert construction advice.', 'Compass', '#contact', 6]
      ];
      list.forEach(s => insert.run(s[0], s[1], s[2], s[3], s[4]));
      insert.finalize();
    }
  });

  // Do not seed mock properties, land, or projects - tables remain clean for real admin data
}

export default db;
