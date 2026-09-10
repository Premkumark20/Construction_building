import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import db from '../database/database.js';

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

// 1. GET site settings & admin info
router.get('/', (req, res) => {
  db.get('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    db.get('SELECT username, phone, email, facebook, instagram, whatsapp FROM admin_users ORDER BY id ASC LIMIT 1', [], (err2, adminRow) => {
      res.json({
        settings: row || {},
        admin: adminRow || { username: 'admin', phone: '', email: 'info@skbuilders.com' }
      });
    });
  });
});

// 2. POST Admin Login Verification
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  db.get('SELECT * FROM admin_users WHERE username = ? AND password = ?', [username.trim(), password], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    res.json({
      success: true,
      token: 'AUTH_ADMIN_SESSION_TOKEN',
      user: { username: user.username, email: user.email, phone: user.phone }
    });
  });
});

// 3. PUT update Admin Username & Password credentials
router.put('/credentials', (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  if (!newUsername || !newPassword) {
    return res.status(400).json({ error: 'New username and new password are required.' });
  }

  db.get('SELECT * FROM admin_users ORDER BY id ASC LIMIT 1', [], (err, user) => {
    if (err || !user) {
      return res.status(500).json({ error: 'Admin account not found.' });
    }

    if (currentPassword && currentPassword !== user.password) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    db.run(
      'UPDATE admin_users SET username = ?, password = ? WHERE id = ?',
      [newUsername.trim(), newPassword, user.id],
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
      `UPDATE admin_users SET phone = ?, email = ?, facebook = ?, instagram = ?, whatsapp = ? WHERE id = 1`,
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
