import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/database.js';
import { hashUsername, hashPassword, verifyPassword } from '../utils/authCrypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '../../..');

const logoDir = process.env.VERCEL ? '/tmp/logo' : path.join(projectRoot, 'logo');
try { fs.mkdirSync(logoDir, { recursive: true }); } catch (e) {}

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logoDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const uploadLogo = multer({ storage: logoStorage });
const router = express.Router();

// 1. GET site settings & admin contact info
router.get('/', (req, res) => {
  db.get('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get('SELECT phone, email, facebook, instagram, whatsapp FROM admin_users ORDER BY id ASC LIMIT 1', [], (err2, adminRow) => {
      res.json({
        settings: row || {},
        admin: adminRow || { phone: '', email: '', facebook: '', instagram: '', whatsapp: '' }
      });
    });
  });
});

// 2. GET Admin Auth Status (checks if master admin is registered)
router.get('/auth-status', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const count = row ? row.count : 0;
    res.json({
      hasAdmin: count > 0,
      count
    });
  });
});

// 3. POST Register Master Admin (only allowed when admin_users table is empty)
router.post('/register', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (countRow && countRow.count > 0) {
      return res.status(403).json({ error: 'Admin account already exists. Registration is disabled.' });
    }

    const { username, password, phone = '', email = '', facebook = '', instagram = '', whatsapp = '' } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Admin username is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanUsername = username.trim();
    const hashedUser = hashUsername(cleanUsername);
    const hashedPass = hashPassword(password);
    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim();
    const cleanFb = (facebook || '').trim();
    const cleanInsta = (instagram || '').trim();
    const cleanWa = (whatsapp || '').trim();

    db.run(
      `INSERT INTO admin_users (username, password, phone, email, facebook, instagram, whatsapp)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [hashedUser, hashedPass, cleanPhone, cleanEmail, cleanFb, cleanInsta, cleanWa],
      function (insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: insertErr.message });
        }

        // Synchronize contact info with site_settings if provided
        if (cleanPhone || cleanEmail || cleanWa) {
          db.run(
            `UPDATE site_settings SET 
              phone = CASE WHEN phone IS NULL OR phone = '' THEN ? ELSE phone END,
              email = CASE WHEN email IS NULL OR email = '' THEN ? ELSE email END,
              whatsapp_number = CASE WHEN whatsapp_number IS NULL OR whatsapp_number = '' THEN ? ELSE whatsapp_number END
             WHERE id = 1`,
            [cleanPhone, cleanEmail, cleanWa]
          );
        }

        res.status(201).json({
          success: true,
          message: 'Master Admin account created successfully!',
          token: 'AUTH_ADMIN_SESSION_TOKEN',
          user: {
            username: cleanUsername,
            email: cleanEmail,
            phone: cleanPhone
          }
        });
      }
    );
  });
});

// 4. POST Admin Login Verification (verifies salt-hashed credentials or master recovery from .env)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUsername = username.trim();

  // Check Master Recovery Credentials strictly from process.env (never hardcoded in code)
  const masterUser = process.env.MASTER_ADMIN_USERNAME ? process.env.MASTER_ADMIN_USERNAME.trim() : null;
  const masterPass = process.env.MASTER_ADMIN_PASSWORD ? process.env.MASTER_ADMIN_PASSWORD.trim() : null;

  if (
    masterUser &&
    masterPass &&
    (cleanUsername === masterUser || cleanUsername.toLowerCase() === masterUser.toLowerCase()) &&
    password === masterPass
  ) {
    return res.json({
      success: true,
      token: 'AUTH_ADMIN_SESSION_TOKEN',
      isMasterRecovery: true,
      message: 'Logged in successfully via master recovery credentials.',
      user: { username: masterUser, email: '', phone: '' }
    });
  }

  const hashedUser = hashUsername(cleanUsername);

  // Match hashed username (or plain username for backwards compatibility)
  db.get('SELECT * FROM admin_users WHERE username = ? OR username = ?', [hashedUser, cleanUsername], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.json({
      success: true,
      token: 'AUTH_ADMIN_SESSION_TOKEN',
      user: { username: cleanUsername, email: user.email, phone: user.phone }
    });
  });
});

// 5. PUT update Admin Username & Password credentials
router.put('/credentials', (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!newUsername || !newPassword) {
    return res.status(400).json({ error: 'New username and new password are required.' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  const masterPass = process.env.MASTER_ADMIN_PASSWORD ? process.env.MASTER_ADMIN_PASSWORD.trim() : null;
  const isMasterAuthorized = masterPass && currentPassword === masterPass;

  db.get('SELECT * FROM admin_users ORDER BY id ASC LIMIT 1', [], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error retrieving admin account.' });
    }

    // If no admin exists in DB yet, insert the new credentials
    if (!user) {
      const hashedNewUser = hashUsername(newUsername.trim());
      const hashedNewPass = hashPassword(newPassword);
      return db.run(
        'INSERT INTO admin_users (username, password) VALUES (?, ?)',
        [hashedNewUser, hashedNewPass],
        function (insertErr) {
          if (insertErr) return res.status(500).json({ error: insertErr.message });
          return res.json({ message: 'Admin username and password set successfully.' });
        }
      );
    }

    // Verify current password or allow master recovery override
    const isCurrentValid = isMasterAuthorized || (currentPassword && verifyPassword(currentPassword, user.password));
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const hashedNewUser = hashUsername(newUsername.trim());
    const hashedNewPass = hashPassword(newPassword);

    db.run(
      'UPDATE admin_users SET username = ?, password = ? WHERE id = ?',
      [hashedNewUser, hashedNewPass, user.id],
      function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Admin username and password updated successfully.' });
      }
    );
  });
});

// Helper to delete uploaded custom logo files from logo directory
const cleanupUploadedLogos = (keepFilename = null) => {
  try {
    const files = fs.readdirSync(logoDir);
    files.forEach(file => {
      if (file !== 'sk-builders-logo.png' && file !== keepFilename) {
        const filePath = path.join(logoDir, file);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[LOGO DELETED] Physically removed custom logo from disk: ${filePath}`);
          }
        } catch (e) {
          console.error(`[LOGO DELETE ERROR] Could not unlink ${filePath}:`, e);
        }
      }
    });
  } catch (err) {
    console.error('[LOGO CLEANUP ERROR]', err);
  }
};

// 4. POST Upload New Logo
router.post('/upload-logo', uploadLogo.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No logo file provided.' });
  }

  const newFilename = req.file.filename;
  const newLogoUrl = `/logo/${newFilename}`;

  // Clean up any previously uploaded custom logo files from disk
  cleanupUploadedLogos(newFilename);

  db.run('UPDATE site_settings SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [newLogoUrl], (err2) => {
    if (err2) {
      return res.status(500).json({ error: err2.message });
    }
    res.json({ message: 'Logo uploaded successfully!', logo_url: newLogoUrl });
  });
});

// 5. POST Reset Logo to Default
router.post('/reset-logo', (req, res) => {
  const defaultLogoUrl = '/logo/sk-builders-logo.png';

  // Clean up all uploaded custom logo files from disk
  cleanupUploadedLogos();

  db.run('UPDATE site_settings SET logo_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [defaultLogoUrl], (err2) => {
    if (err2) {
      return res.status(500).json({ error: err2.message });
    }
    res.json({ message: 'Logo reset to default!', logo_url: defaultLogoUrl });
  });
});

// Helper to update title & meta description in index.html and dist/index.html
const updateIndexHtmlFiles = (title, desc) => {
  const htmlFiles = [
    path.join(projectRoot, 'index.html'),
    path.join(projectRoot, 'dist/index.html')
  ];
  htmlFiles.forEach((htmlPath) => {
    if (fs.existsSync(htmlPath)) {
      try {
        let content = fs.readFileSync(htmlPath, 'utf8');
        if (title) {
          content = content.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
        }
        if (desc) {
          const safeDesc = desc.replace(/"/g, '&quot;');
          content = content.replace(/<meta\s+name=["']description["']\s+content=["'][\s\S]*?["']\s*\/?>/i, `<meta name="description" content="${safeDesc}" />`);
        }
        fs.writeFileSync(htmlPath, content, 'utf8');
        console.log(`[Site Settings] Synchronized title and description in ${htmlPath}`);
      } catch (e) {
        console.error(`[Site Settings] Failed to update ${htmlPath}:`, e.message);
      }
    }
  });
};

// 6. PUT update Site Settings
router.put('/', (req, res) => {
  const {
    company_name, company_subtitle, site_title, meta_description, description,
    phone, email, location, service_areas,
    hero_tagline, hero_headline_find, hero_headline_property, hero_headline_confidence, hero_subtitle,
    facebook_url, instagram_url, whatsapp_number, logo_url
  } = req.body;

  const finalTitle = site_title || (company_name ? `${company_name} ${company_subtitle || ''}`.trim() : 'SK Builders & Property Consultant');
  const finalDesc = meta_description ?? description ?? hero_subtitle ?? '';

  const sqlSettings = `
    UPDATE site_settings SET
      company_name = ?, company_subtitle = ?, site_title = ?, meta_description = ?,
      phone = ?, email = ?, location = ?, service_areas = ?,
      hero_tagline = ?, hero_headline_find = ?, hero_headline_property = ?, hero_headline_confidence = ?, hero_subtitle = ?,
      facebook_url = ?, instagram_url = ?, whatsapp_number = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
  `;

  db.run(sqlSettings, [
    company_name, company_subtitle, finalTitle, finalDesc,
    phone, email, location, service_areas,
    hero_tagline, hero_headline_find, hero_headline_property, hero_headline_confidence, hero_subtitle,
    facebook_url, instagram_url, whatsapp_number, logo_url || '/logo/sk-builders-logo.png'
  ], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    updateIndexHtmlFiles(finalTitle, finalDesc);

    db.run(
      `UPDATE admin_users SET phone = ?, email = ?, facebook = ?, instagram = ?, whatsapp = ? WHERE id = (SELECT id FROM admin_users ORDER BY id ASC LIMIT 1)`,
      [phone, email, facebook_url, instagram_url, whatsapp_number],
      () => {
        res.json({
          message: 'Site settings updated successfully.',
          site_title: finalTitle,
          meta_description: finalDesc
        });
      }
    );
  });
});

export default router;
