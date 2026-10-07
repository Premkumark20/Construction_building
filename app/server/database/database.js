import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { hashUsername, hashPassword } from '../utils/authCrypto.js';

const require = createRequire(import.meta.url);
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');

const safeMkdir = (dir) => {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
};

// Auto-create all required media, upload, frame, and database storage folders
const initialDirs = [
  path.join(projectRoot, 'uploads'),
  path.join(projectRoot, 'uploads/images'),
  path.join(projectRoot, 'uploads/images/gallery'),
  path.join(projectRoot, 'uploads/images/properties'),
  path.join(projectRoot, 'uploads/images/projects'),
  path.join(projectRoot, 'uploads/videos'),
  path.join(projectRoot, 'uploads/videos/temp'),
  path.join(projectRoot, 'logo'),
  path.join(projectRoot, 'videos'),
  path.join(projectRoot, 'frames'),
  path.join(projectRoot, 'frames/desktop'),
  path.join(projectRoot, 'app/public/videos'),
];

if (process.env.VERCEL) {
  initialDirs.push(
    '/tmp/uploads',
    '/tmp/uploads/images',
    '/tmp/uploads/images/gallery',
    '/tmp/uploads/images/properties',
    '/tmp/uploads/images/projects',
    '/tmp/uploads/videos',
    '/tmp/uploads/videos/temp',
    '/tmp/logo',
    '/tmp/videos',
    '/tmp/frames',
    '/tmp/frames/desktop',
    '/tmp/frames/mobile'
  );
}

initialDirs.forEach(d => safeMkdir(d));

const EMBEDDED_SCHEMA = `
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  facebook TEXT DEFAULT '',
  instagram TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  display_username TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL DEFAULT 'SK BUILDERS',
  company_subtitle TEXT NOT NULL DEFAULT '& PROPERTY CONSULTANT',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT 'info@skbuilders.com',
  location TEXT NOT NULL DEFAULT 'Poonamallee, Mangadu, Kundrathur, Tamil Nadu - 600056',
  service_areas TEXT NOT NULL DEFAULT 'Poonamallee • Mangadu • Kundrathur',
  hero_tagline TEXT NOT NULL DEFAULT 'BUILDING QUALITY HOMES.',
  hero_headline_find TEXT NOT NULL DEFAULT 'Find',
  hero_headline_property TEXT NOT NULL DEFAULT 'Right Property',
  hero_headline_confidence TEXT NOT NULL DEFAULT 'Confidence',
  hero_subtitle TEXT NOT NULL DEFAULT 'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation in Poonamallee, Mangadu & Kundrathur.',
  facebook_url TEXT DEFAULT 'https://facebook.com',
  instagram_url TEXT DEFAULT 'https://instagram.com',
  whatsapp_number TEXT DEFAULT '',
  logo_url TEXT DEFAULT '/logo/sk-builders-logo.png',
  site_title TEXT DEFAULT 'SK Builders & Property Consultant',
  meta_description TEXT DEFAULT '',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Home',
  link_url TEXT NOT NULL DEFAULT '#properties',
  display_order INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  icon_name TEXT NOT NULL DEFAULT 'Home',
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  display_order INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  property_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'For Sale',
  status TEXT NOT NULL DEFAULT 'Available',
  address TEXT,
  area TEXT,
  city TEXT DEFAULT 'Chennai',
  pincode TEXT,
  maps_url TEXT,
  latitude TEXT,
  longitude TEXT,
  landmark TEXT,
  price TEXT NOT NULL,
  price_display_type TEXT DEFAULT 'Exact Price',
  negotiable TEXT DEFAULT 'Yes',
  price_per_sqft TEXT,
  bhk TEXT,
  builtup_area TEXT,
  plot_area TEXT,
  facing TEXT,
  floors TEXT,
  furnished_status TEXT,
  age_of_property TEXT,
  possession_status TEXT,
  bathrooms TEXT,
  balconies TEXT,
  parking TEXT,
  water_source TEXT,
  power_backup TEXT,
  description TEXT,
  features TEXT,
  image TEXT,
  images TEXT,
  video_url TEXT,
  featured INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land (
  id SERIAL PRIMARY KEY,
  land_id TEXT,
  title TEXT NOT NULL,
  land_type TEXT NOT NULL DEFAULT 'Residential Plot',
  listing_type TEXT NOT NULL DEFAULT 'For Sale',
  status TEXT NOT NULL DEFAULT 'Available',
  address TEXT,
  area TEXT,
  city TEXT DEFAULT 'Chennai',
  pincode TEXT,
  maps_url TEXT,
  latitude TEXT,
  longitude TEXT,
  landmark TEXT,
  total_price TEXT,
  price TEXT,
  price_display_type TEXT DEFAULT 'Exact Price',
  negotiable TEXT DEFAULT 'Yes',
  price_per_sqft TEXT,
  plot_area TEXT NOT NULL,
  plot_area_unit TEXT DEFAULT 'sq.ft',
  frontage TEXT,
  length TEXT,
  width TEXT,
  facing TEXT DEFAULT 'East',
  road_width TEXT,
  road_width_unit TEXT DEFAULT 'ft',
  road_type TEXT,
  road_facing TEXT,
  corner_plot TEXT DEFAULT 'No',
  eb_available INTEGER DEFAULT 0,
  water_available INTEGER DEFAULT 0,
  drainage_available INTEGER DEFAULT 0,
  borewell_available INTEGER DEFAULT 0,
  approval_status TEXT DEFAULT 'Not Provided',
  patta_status TEXT DEFAULT 'Not Provided',
  ec_status TEXT DEFAULT 'Not Provided',
  parent_documents_status TEXT DEFAULT 'Not Provided',
  sale_deed_status TEXT DEFAULT 'Not Provided',
  approval_documents_status TEXT DEFAULT 'Not Provided',
  other_documents TEXT,
  nearby_school TEXT,
  nearby_hospital TEXT,
  nearby_bus_stop TEXT,
  nearby_railway TEXT,
  nearby_main_road TEXT,
  nearby_shopping TEXT,
  short_description TEXT,
  full_description TEXT,
  description TEXT,
  highlights TEXT,
  image TEXT,
  published INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  location TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land_plots (
  id SERIAL PRIMARY KEY,
  property_id TEXT,
  title TEXT NOT NULL,
  land_type TEXT NOT NULL DEFAULT 'Residential Land',
  status TEXT NOT NULL DEFAULT 'Available',
  address TEXT,
  area TEXT,
  city TEXT DEFAULT 'Chennai',
  pincode TEXT,
  maps_url TEXT,
  latitude TEXT,
  longitude TEXT,
  landmark TEXT,
  total_price TEXT NOT NULL,
  price_display_type TEXT DEFAULT 'Exact Price',
  negotiable TEXT DEFAULT 'Yes',
  price_per_sqft TEXT,
  plot_area TEXT NOT NULL,
  plot_area_unit TEXT DEFAULT 'sq.ft',
  plot_dimensions TEXT,
  plot_length TEXT,
  plot_breadth TEXT,
  road_width TEXT,
  road_width_unit TEXT DEFAULT 'feet',
  facing TEXT,
  boundary_wall TEXT DEFAULT 'No',
  corner_plot TEXT DEFAULT 'No',
  gated_community TEXT DEFAULT 'No',
  dtcp_approved TEXT DEFAULT 'Yes',
  rera_approved TEXT DEFAULT 'No',
  cmda_approved TEXT DEFAULT 'No',
  patta_status TEXT DEFAULT 'Yes',
  soil_type TEXT,
  water_source TEXT,
  electricity TEXT DEFAULT 'Yes',
  drainage TEXT DEFAULT 'No',
  description TEXT,
  features TEXT,
  image TEXT,
  images TEXT,
  video_url TEXT,
  featured INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  project_id TEXT,
  name TEXT,
  title TEXT,
  project_type TEXT DEFAULT 'Individual House',
  status TEXT NOT NULL DEFAULT 'Under Construction',
  current_step INTEGER NOT NULL DEFAULT 1,
  start_date TEXT,
  expected_completion_date TEXT,
  actual_completion_date TEXT,
  estimated_completion TEXT,
  actual_completion TEXT,
  location TEXT,
  address TEXT,
  area TEXT,
  city TEXT DEFAULT 'Chennai',
  pincode TEXT,
  maps_url TEXT,
  latitude TEXT,
  longitude TEXT,
  plot_area TEXT,
  plot_area_unit TEXT DEFAULT 'sq.ft',
  builtup_area TEXT,
  builtup_area_unit TEXT DEFAULT 'sq.ft',
  floors TEXT,
  bedrooms TEXT,
  bathrooms TEXT,
  rcc_structure INTEGER DEFAULT 0,
  concrete_roof INTEGER DEFAULT 0,
  compound_wall INTEGER DEFAULT 0,
  gate INTEGER DEFAULT 0,
  parking INTEGER DEFAULT 0,
  water_connection INTEGER DEFAULT 0,
  electrical_work INTEGER DEFAULT 0,
  plumbing INTEGER DEFAULT 0,
  painting INTEGER DEFAULT 0,
  interior_work INTEGER DEFAULT 0,
  client_name TEXT,
  total_area TEXT,
  budget TEXT,
  overview TEXT,
  description TEXT,
  construction_details TEXT,
  special_features TEXT,
  challenges TEXT,
  solutions TEXT,
  completion_date TEXT,
  specifications TEXT,
  cover_image TEXT,
  image TEXT,
  video_url TEXT,
  published INTEGER DEFAULT 1,
  featured INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_stages (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  step_number INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  completion_percentage INTEGER DEFAULT 0,
  start_date TEXT,
  completion_date TEXT,
  notes TEXT,
  images TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  image TEXT NOT NULL,
  title TEXT DEFAULT 'Gallery Photo',
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  quote TEXT NOT NULL,
  rating INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT DEFAULT '',
  service TEXT DEFAULT 'General Inquiry',
  property_id TEXT,
  message TEXT,
  status TEXT DEFAULT 'Pending',
  contacted INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_videos (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  video_type TEXT DEFAULT 'hero',
  is_primary INTEGER DEFAULT 0,
  file_size BIGINT DEFAULT 0,
  frame_urls TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  service TEXT DEFAULT 'General Feedback',
  rating INTEGER DEFAULT 5,
  message TEXT NOT NULL,
  approved INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;

let db;

if (postgresUrl) {
  console.log('Connecting to PostgreSQL database via environment variable...');
  const pool = new Pool({
    connectionString: postgresUrl,
    ssl: { rejectUnauthorized: false }
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client pool:', err.message);
  });

  const convertSql = (sql) => {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
  };

  db = {
    isPg: true,
    pool,
    all(sql, params = [], cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      const pgSql = convertSql(sql);
      pool.query(pgSql, params)
        .then(res => cb && cb(null, res.rows))
        .catch(err => cb && cb(err));
    },
    get(sql, params = [], cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      const pgSql = convertSql(sql);
      pool.query(pgSql, params)
        .then(res => cb && cb(null, res.rows[0] || null))
        .catch(err => cb && cb(err));
    },
    run(sql, params = [], cb) {
      if (typeof params === 'function') {
        cb = params;
        params = [];
      }
      let pgSql = convertSql(sql);
      if (/INSERT OR IGNORE INTO/i.test(pgSql)) {
        pgSql = pgSql.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO') + ' ON CONFLICT DO NOTHING';
      }
      const isInsert = /^\s*INSERT\s+INTO/i.test(pgSql);
      const hasReturning = /RETURNING/i.test(pgSql);
      if (isInsert && !hasReturning && !/ON CONFLICT DO NOTHING/i.test(pgSql)) {
        pgSql += ' RETURNING id';
      }

      pool.query(pgSql, params)
        .then(res => {
          const context = {
            lastID: isInsert && res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].ID) : null,
            changes: res.rowCount
          };
          if (cb) cb.call(context, null);
        })
        .catch(err => cb && cb(err));
    },
    exec(sql, cb) {
      pool.query(sql)
        .then(() => cb && cb(null))
        .catch(err => cb && cb(err));
    },
    serialize(fn) {
      if (fn) fn();
    },
    prepare(sql) {
      const pgSql = convertSql(sql);
      return {
        run(params = [], cb) {
          let runSql = pgSql;
          if (/INSERT OR IGNORE INTO/i.test(runSql)) {
            runSql = runSql.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO') + ' ON CONFLICT DO NOTHING';
          }
          const isInsert = /^\s*INSERT\s+INTO/i.test(runSql);
          const hasReturning = /RETURNING/i.test(runSql);
          if (isInsert && !hasReturning && !/ON CONFLICT DO NOTHING/i.test(runSql)) {
            runSql += ' RETURNING id';
          }
          pool.query(runSql, params)
            .then(res => {
              const context = {
                lastID: isInsert && res.rows && res.rows[0] ? (res.rows[0].id || res.rows[0].ID) : null,
                changes: res.rowCount
              };
              if (cb) cb.call(context, null);
            })
            .catch(err => cb && cb(err));
        },
        finalize(cb) {
          if (cb) cb(null);
        }
      };
    }
  };

  initDatabase();

} else {
  let dbPath = path.join(__dirname, 'showcase.db');
  safeMkdir(path.dirname(dbPath));

  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/showcase.db';
    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpDbPath);
      }
      dbPath = tmpDbPath;
    } catch (e) {
      console.error('Failed to copy SQLite database to /tmp:', e);
    }
  }

  try {
    const sqlite3 = require('sqlite3');
    const sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error connecting to SQLite database:', err);
      } else {
        console.log('Connected to SQLite database at', dbPath);
        sqliteDb.run('PRAGMA journal_mode = WAL;');
        sqliteDb.run('PRAGMA busy_timeout = 5000;');
        initDatabase();
      }
    });

    db = sqliteDb;
    db.isPg = false;
  } catch (err) {
    console.warn('Notice: sqlite3 native driver not available in this environment. Using memory fallback adapter:', err.message);
    db = {
      isPg: false,
      all(sql, params = [], cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        if (cb) cb(null, []);
      },
      get(sql, params = [], cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        if (cb) cb(null, null);
      },
      run(sql, params = [], cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        const context = { lastID: Date.now(), changes: 1 };
        if (cb) cb.call(context, null);
      },
      exec(sql, cb) {
        if (cb) cb(null);
      },
      serialize(fn) {
        if (fn) fn();
      },
      prepare(sql) {
        return {
          run(params = [], cb) {
            if (typeof params === 'function') { cb = params; params = []; }
            const context = { lastID: Date.now(), changes: 1 };
            if (cb) cb.call(context, null);
          },
          finalize(cb) { if (cb) cb(null); }
        };
      }
    };
    initDatabase();
  }
}

function initDatabase() {
  if (db.isPg) {
    let pgSql = '';
    const pgCandidates = [
      path.join(__dirname, 'pg-schema.sql'),
      path.join(process.cwd(), 'app/server/database/pg-schema.sql'),
      path.join(projectRoot, 'app/server/database/pg-schema.sql')
    ];
    for (const p of pgCandidates) {
      try {
        if (p && fs.existsSync(p)) {
          pgSql = fs.readFileSync(p, 'utf8');
          if (pgSql) break;
        }
      } catch (e) {}
    }
    if (!pgSql) {
      pgSql = EMBEDDED_SCHEMA;
    }
    db.exec(pgSql, (err) => {
      if (err) {
        console.error('Error executing PostgreSQL schema:', err.message);
      } else {
        console.log('PostgreSQL schema initialized successfully.');
      }
      ensureColumns();
    });
    return;
  }

  const schemaPath = path.join(__dirname, 'schema.sql');
  let schemaSql = '';
  const candidatePaths = [
    schemaPath,
    path.join(process.cwd(), 'app/server/database/schema.sql'),
    path.join(projectRoot, 'app/server/database/schema.sql')
  ];

  for (const p of candidatePaths) {
    try {
      if (p && fs.existsSync(p)) {
        schemaSql = fs.readFileSync(p, 'utf8');
        if (schemaSql) break;
      }
    } catch (e) {}
  }

  if (!schemaSql) {
    schemaSql = EMBEDDED_SCHEMA;
  }

  db.exec(schemaSql, (err) => {
    if (err) {
      console.error('Error executing schema SQL:', err);
    } else {
      console.log('Database tables initialized.');
    }
    ensureColumns();
  });
}

// Safely ensure all columns exist for existing databases
function ensureColumns() {
  const safeAdd = (table, col, def) => {
    if (db.isPg) {
      db.run(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def}`, () => {});
    } else {
      db.run(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`, () => {});
    }
  };

  const statsTableSql = db.isPg
    ? `CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        icon_name TEXT NOT NULL DEFAULT 'Home',
        value TEXT NOT NULL,
        label TEXT NOT NULL,
        display_order INTEGER DEFAULT 1
      );`
    : `CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        icon_name TEXT NOT NULL DEFAULT 'Home',
        value TEXT NOT NULL,
        label TEXT NOT NULL,
        display_order INTEGER DEFAULT 1
      );`;
  db.run(statsTableSql, () => {});

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
  safeAdd('site_settings', 'site_title', "TEXT DEFAULT 'SK Builders & Property Consultant'");
  safeAdd('site_settings', 'meta_description', "TEXT DEFAULT ''");
  safeAdd('site_settings', 'phone', 'TEXT');
  safeAdd('site_settings', 'whatsapp_number', 'TEXT');

  safeAdd('admin_users', 'phone', "TEXT DEFAULT ''");
  safeAdd('admin_users', 'email', "TEXT DEFAULT ''");
  safeAdd('admin_users', 'facebook', "TEXT DEFAULT ''");
  safeAdd('admin_users', 'instagram', "TEXT DEFAULT ''");
  safeAdd('admin_users', 'whatsapp', "TEXT DEFAULT ''");
  safeAdd('admin_users', 'display_username', "TEXT DEFAULT ''");

  safeAdd('leads', 'email', "TEXT DEFAULT ''");
  safeAdd('leads', 'property_id', 'TEXT');
  safeAdd('leads', 'service', "TEXT DEFAULT 'General Inquiry'");
  safeAdd('leads', 'status', "TEXT DEFAULT 'Pending'");
  safeAdd('leads', 'contacted', "INTEGER DEFAULT 0");
  safeAdd('leads', 'message', 'TEXT');

  safeAdd('media_videos', 'video_type', "TEXT DEFAULT 'hero'");
  safeAdd('media_videos', 'frame_urls', "TEXT DEFAULT ''");

  if (!db.isPg) {
    // Migrate gallery table to only (id, image, created_at) in SQLite if needed
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
  }

  seedInitialData();
}

function seedInitialData() {
  const bgVideosDir = path.join(projectRoot, 'videos');
  const appPublicVideosDir = path.join(projectRoot, 'app/public/videos');
  safeMkdir(bgVideosDir);
  safeMkdir(appPublicVideosDir);

  // 1. Purge records pointing to deleted files ONLY in local development
  if (!process.env.VERCEL && !db.isPg) {
    db.all("SELECT * FROM media_videos", [], (err, rows) => {
      if (!err && Array.isArray(rows)) {
        rows.forEach(r => {
          let fullP = path.join(projectRoot, r.filepath);
          if (!fs.existsSync(fullP)) {
            const alt1 = path.join(bgVideosDir, r.filename);
            const alt2 = path.join(appPublicVideosDir, r.filename);
            const alt3 = path.join(projectRoot, 'uploads/videos', r.filename);
            if (!fs.existsSync(alt1) && !fs.existsSync(alt2) && !fs.existsSync(alt3)) {
              db.run("DELETE FROM media_videos WHERE id = ?", [r.id]);
            }
          }
        });
      }
    });
  }

  // 2. Register Background.mp4 if no background video exists
  db.get("SELECT COUNT(*) as count FROM media_videos WHERE video_type = 'background'", [], (err, row) => {
    if (!err && (!row || Number(row.count) === 0)) {
      db.run(
        "INSERT OR IGNORE INTO media_videos (filename, filepath, video_type, is_primary, file_size) VALUES (?, ?, 'background', 1, ?)",
        ['Background.mp4', 'videos/Background.mp4', 15420212]
      );
    }
  });

  // Auto-insert Row 1: Master recovery admin (buildername / iambuilder, hashed with salt)
  db.get("SELECT * FROM admin_users WHERE id = 1", [], (err, masterRow) => {
    if (!err && !masterRow) {
      const masterUser = 'buildername';
      const masterPass = 'iambuilder';
      const hashedMasterUser = hashUsername(masterUser);
      const hashedMasterPass = hashPassword(masterPass);
      db.run(
        "INSERT OR IGNORE INTO admin_users (id, username, display_username, password, phone, email, facebook, instagram, whatsapp) VALUES (1, ?, 'buildername', ?, '', 'info@skbuilders.com', '', '', '')",
        [hashedMasterUser, hashedMasterPass],
        (insertErr) => {
          if (insertErr) {
            console.error('Error auto-inserting Row 1 master recovery admin:', insertErr.message);
          } else {
            console.log('Row 1 master recovery admin auto-inserted (buildername / iambuilder).');
          }
        }
      );
    } else if (masterRow && (!masterRow.display_username || masterRow.display_username === '')) {
      db.run("UPDATE admin_users SET display_username = 'buildername' WHERE id = 1");
    }
  });

  // Seed site settings
  db.get("SELECT COUNT(*) as count FROM site_settings", [], (err, row) => {
    if (!err && (!row || Number(row.count) === 0)) {
      db.run(`
        INSERT INTO site_settings (
          company_name, company_subtitle, site_title, meta_description, phone, email, location, service_areas,
          hero_tagline, hero_headline_find, hero_headline_property, hero_headline_confidence, hero_subtitle,
          facebook_url, instagram_url, whatsapp_number
        ) VALUES (
          'SK BUILDERS', '& PROPERTY CONSULTANT', 'SK Builders & Property Consultant', 'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation in Poonamallee, Mangadu & Kundrathur.', '', 'info@skbuilders.com',
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
    if (!err && (!row || Number(row.count) === 0)) {
      const list = [
        ['Houses for Sale', 'Ready-to-move individual houses built with quality and trust.', 'Home', '#properties', 1],
        ['Lands for Sale', 'Residential plots in prime locations. DTCP approved plots available.', 'MapPin', '#properties', 2],
        ['Contract House Construction', 'We build your dream home on your land with quality and on-time delivery.', 'HardHat', '#contact', 3],
        ['Property Consultant', 'Expert help for buying or selling land and houses. End-to-end guidance.', 'Users', '#contact', 4],
        ['Documentation Support', 'Assistance for all property related documents and legal process.', 'FileText', '#contact', 5],
        ['Construction Consultation', 'Planning, estimation, site visit and expert construction advice.', 'Compass', '#contact', 6]
      ];
      list.forEach(s => {
        db.run(
          "INSERT INTO services (title, description, icon_name, link_url, display_order) VALUES (?, ?, ?, ?, ?)",
          [s[0], s[1], s[2], s[3], s[4]]
        );
      });
    }
  });

  // Seed stats
  db.get("SELECT COUNT(*) as count FROM stats", [], (err, row) => {
    if (err || !row || Number(row.count) === 0) {
      const defaultStats = [
        ['Home', '40+', 'Homes Built', 1],
        ['MapPin', '75+', 'Plots Sold', 2],
        ['Users', '150+', 'Property Deals', 3],
        ['Users', '100+', 'Happy Families', 4]
      ];
      defaultStats.forEach(s => {
        db.run(
          "INSERT INTO stats (icon_name, value, label, display_order) VALUES (?, ?, ?, ?)",
          [s[0], s[1], s[2], s[3]]
        );
      });
    }
  });

  // Seed testimonials - check each default testimonial individually so all 3 are always present
  const defaultTestimonialList = [
    ["Ramesh & Family", "Poonamallee", "Professional approach, quality construction and on-time delivery. We are very happy with our new home in Poonamallee.", 5],
    ["Karthik Raja", "Mangadu", "Transparent dealings and smooth legal registration assistance for our plot in Mangadu. Highly recommended!", 5],
    ["Suresh Kumar", "Kundrathur", "Built our dream villa with top notch engineering standards and milestone updates. The engineering team made the process effortless.", 5]
  ];
  defaultTestimonialList.forEach(t => {
    db.get("SELECT id FROM testimonials WHERE LOWER(client_name) = LOWER(?)", [t[0]], (err, exists) => {
      if (!err && !exists) {
        db.run(
          "INSERT INTO testimonials (client_name, location, quote, rating) VALUES (?, ?, ?, ?)",
          [t[0], t[1], t[2], t[3]]
        );
      }
    });
  });
}

export default db;


