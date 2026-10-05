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
  const defaultSettings = {
    company_name: 'SK BUILDERS',
    company_subtitle: '& PROPERTY CONSULTANT',
    phone: '',
    whatsapp_number: '',
    email: 'info@skbuilders.com',
    location: 'Poonamallee, Mangadu, Kundrathur, Tamil Nadu - 600056',
    service_areas: 'Poonamallee • Mangadu • Kundrathur',
    hero_tagline: 'BUILDING QUALITY HOMES.',
    hero_headline_find: 'Find',
    hero_headline_property: 'Right Property',
    hero_headline_confidence: 'Confidence',
    hero_subtitle: 'We build individual houses, offer residential land plots, execute contract house construction, and provide expert property consultation in Poonamallee, Mangadu & Kundrathur.',
    logo_url: '/logo/sk-builders-logo.png'
  };

  const defaultAdmin = { username: '', phone: '', email: 'info@skbuilders.com', facebook: '', instagram: '', whatsapp: '' };

  db.get('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1', [], (err, row) => {
    if (err) {
      console.warn('site_settings query error, returning defaults:', err.message);
      return res.json({ settings: defaultSettings, admin: defaultAdmin });
    }
    db.get('SELECT username, display_username, phone, email, facebook, instagram, whatsapp FROM admin_users ORDER BY id DESC LIMIT 1', [], (err2, adminRow) => {
      let resolvedUsername = '';
      if (adminRow) {
        resolvedUsername = adminRow.display_username || (adminRow.username && adminRow.username.length < 32 ? adminRow.username : '');
      }
      res.json({
        settings: row || defaultSettings,
        admin: {
          ...(adminRow || defaultAdmin),
          username: resolvedUsername
        }
      });
    });
  });
});

// 2. GET Admin Auth Status (checks if the single registered user exists in Row 2)
router.get('/auth-status', (req, res) => {
  // Ensure Row 1 master recovery admin exists
  db.get('SELECT * FROM admin_users WHERE id = 1', [], (mErr, masterRow) => {
    if (!masterRow) {
      const masterUser = 'buildername';
      const masterPass = 'iambuilder';
      db.run(
        "INSERT OR IGNORE INTO admin_users (id, username, display_username, password, phone, email, facebook, instagram, whatsapp) VALUES (1, ?, 'buildername', ?, '', 'info@skbuilders.com', '', '', '')",
        [hashUsername(masterUser), hashPassword(masterPass)]
      );
    }
  });

  db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const count = row ? row.count : 0;
    // Row 1 is master recovery admin. Row 2 is the registered user.
    // If count <= 1: only master recovery exists, user hasn't registered yet -> hasAdmin: false
    // If count >= 2: user has already registered -> hasAdmin: true
    db.get('SELECT username, display_username FROM admin_users ORDER BY id DESC LIMIT 1', [], (uErr, uRow) => {
      let resolvedUsername = '';
      if (uRow) {
        resolvedUsername = uRow.display_username || (uRow.username && uRow.username.length < 32 ? uRow.username : '');
      }
      res.json({
        hasAdmin: count >= 2,
        count,
        username: resolvedUsername
      });
    });
  });
});

// 3. POST Register First User (Row 2 in admin_users; only 1 user allowed)
router.post('/register', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM admin_users', [], (err, countRow) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const count = countRow ? countRow.count : 0;
    if (count >= 2) {
      return res.status(403).json({ error: 'Admin account already registered. Only one user is allowed.' });
    }

    const { username, password, phone = '', email = '', facebook = '', instagram = '', whatsapp = '' } = req.body;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Admin username is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Mobile number is required.' });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanUsername = username.trim();
    if (cleanUsername.toLowerCase() === 'buildername') {
      return res.status(400).json({ error: 'Username "buildername" is reserved for master recovery. Please choose another username.' });
    }

    const hashedUser = hashUsername(cleanUsername);
    const hashedPass = hashPassword(password);
    const cleanPhone = phone.trim();
    const cleanEmail = (email || '').trim();
    const cleanFb = (facebook || '').trim();
    const cleanInsta = (instagram || '').trim();
    const cleanWa = (whatsapp || '').trim();

    const finishRegistration = () => {
      // Set registered mobile number as site's phone; WhatsApp only if provided
      const finalWa = cleanWa;
      db.run(
        `UPDATE site_settings SET 
          phone = ?,
          whatsapp_number = ?,
          email = CASE WHEN ? != '' THEN ? ELSE email END
         WHERE id = (SELECT id FROM site_settings ORDER BY id ASC LIMIT 1)`,
        [cleanPhone, finalWa, cleanEmail, cleanEmail]
      );

      res.status(201).json({
        success: true,
        message: 'Admin account created successfully!',
        token: 'AUTH_ADMIN_SESSION_TOKEN',
        user: {
          username: cleanUsername,
          email: cleanEmail,
          phone: cleanPhone
        }
      });
    };

    const insertRow2 = () => {
      db.run(
        `INSERT INTO admin_users (id, username, display_username, password, phone, email, facebook, instagram, whatsapp)
         VALUES (2, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [hashedUser, cleanUsername, hashedPass, cleanPhone, cleanEmail, cleanFb, cleanInsta, cleanWa],
        function (insertErr) {
          if (insertErr) {
            // Fallback without explicit id
            return db.run(
              `INSERT INTO admin_users (username, display_username, password, phone, email, facebook, instagram, whatsapp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [hashedUser, cleanUsername, hashedPass, cleanPhone, cleanEmail, cleanFb, cleanInsta, cleanWa],
              function (err2) {
                if (err2) return res.status(500).json({ error: err2.message });
                finishRegistration();
              }
            );
          }
          finishRegistration();
        }
      );
    };

    // Ensure Row 1 (master recovery) exists before inserting Row 2
    db.get('SELECT * FROM admin_users WHERE id = 1', [], (mErr, mRow) => {
      if (!mRow) {
        const masterUser = 'buildername';
        const masterPass = 'iambuilder';
        db.run(
          "INSERT OR IGNORE INTO admin_users (id, username, display_username, password, phone, email, facebook, instagram, whatsapp) VALUES (1, ?, 'buildername', ?, '', 'info@skbuilders.com', '', '', '')",
          [hashUsername(masterUser), hashPassword(masterPass)],
          () => insertRow2()
        );
      } else {
        insertRow2();
      }
    });
  });
});

// 4. POST Admin Login Verification (verifies salt-hashed credentials or master recovery)
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  const cleanUsername = username.trim();

  // Check Master Recovery Credentials
  const masterUser = (process.env.MASTER_ADMIN_USERNAME || 'buildername').trim();
  const masterPass = (process.env.MASTER_ADMIN_PASSWORD || 'iambuilder').trim();

  if (
    cleanUsername.toLowerCase() === masterUser.toLowerCase() &&
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

  // Match hashed username, plain username, or display_username
  db.get('SELECT * FROM admin_users WHERE username = ? OR username = ? OR display_username = ?', [hashedUser, cleanUsername, cleanUsername], (err, user) => {
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

    // Auto-sync display_username if missing
    if (!user.display_username || user.display_username.trim() === '') {
      db.run('UPDATE admin_users SET display_username = ? WHERE id = ?', [cleanUsername, user.id]);
    }

    res.json({
      success: true,
      token: 'AUTH_ADMIN_SESSION_TOKEN',
      isMasterRecovery: user.id === 1,
      user: { username: cleanUsername, email: user.email, phone: user.phone }
    });
  });
});

// 5. PUT update Admin Username & Password credentials
router.put('/credentials', (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;

  const hasNewUsername = typeof newUsername === 'string' && newUsername.trim().length > 0;
  const hasNewPassword = typeof newPassword === 'string' && newPassword.trim().length > 0;

  if (!hasNewUsername && !hasNewPassword) {
    return res.status(400).json({ error: 'Please provide a new username, a new password, or both to update.' });
  }

  if (hasNewPassword && newPassword.length < 4) {
    return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
  }

  if (!currentPassword) {
    return res.status(400).json({ error: 'Current password is required to confirm changes.' });
  }

  const masterPass = (process.env.MASTER_ADMIN_PASSWORD || 'iambuilder').trim();
  const isMasterAuthorized = masterPass && currentPassword === masterPass;

  // Target the registered user (Row 2, or highest id in admin_users)
  db.get('SELECT * FROM admin_users ORDER BY id DESC LIMIT 1', [], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error retrieving admin account.' });
    }

    if (!user) {
      return res.status(404).json({ error: 'No admin user found to update.' });
    }

    // Verify current password or allow master recovery override
    const isCurrentValid = isMasterAuthorized || (currentPassword && verifyPassword(currentPassword, user.password));
    if (!isCurrentValid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const cleanNewUsername = hasNewUsername ? newUsername.trim() : '';
    const isSameUsername = cleanNewUsername && (
      user.username === hashUsername(cleanNewUsername) ||
      user.username === cleanNewUsername ||
      user.display_username === cleanNewUsername
    );
    const shouldUpdateUsername = hasNewUsername && !isSameUsername;
    const shouldUpdatePassword = hasNewPassword;

    if (!shouldUpdateUsername && !shouldUpdatePassword) {
      return res.status(400).json({ error: 'No changes detected. Please provide a new username or new password.' });
    }

    const updates = [];
    const params = [];
    const updatedFields = [];

    if (shouldUpdateUsername) {
      updates.push('username = ?');
      params.push(hashUsername(cleanNewUsername));
      updates.push('display_username = ?');
      params.push(cleanNewUsername);
      updatedFields.push('username');
    }

    if (shouldUpdatePassword) {
      updates.push('password = ?');
      params.push(hashPassword(newPassword));
      updatedFields.push('password');
    }

    params.push(user.id);

    db.run(
      `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`,
      params,
      function (updateErr) {
        if (updateErr) {
          return res.status(500).json({ error: updateErr.message });
        }
        res.json({
          success: true,
          message: `Admin ${updatedFields.join(' and ')} updated successfully!`
        });
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

  db.get('SELECT id FROM site_settings ORDER BY id ASC LIMIT 1', [], (checkErr, existingRow) => {
    const handleSuccess = () => {
      updateIndexHtmlFiles(finalTitle, finalDesc);
      db.run(
        `UPDATE admin_users SET phone = ?, email = ?, facebook = ?, instagram = ?, whatsapp = ? WHERE id = (SELECT id FROM admin_users ORDER BY id DESC LIMIT 1)`,
        [phone, email, facebook_url, instagram_url, whatsapp_number],
        () => {
          res.json({
            message: 'Site settings updated successfully.',
            site_title: finalTitle,
            meta_description: finalDesc
          });
        }
      );
    };

    if (!existingRow) {
      const sqlInsert = `
        INSERT INTO site_settings (
          id, company_name, company_subtitle, site_title, meta_description,
          phone, email, location, service_areas,
          hero_tagline, hero_headline_find, hero_headline_property, hero_headline_confidence, hero_subtitle,
          facebook_url, instagram_url, whatsapp_number, logo_url
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.run(sqlInsert, [
        company_name || 'SK BUILDERS', company_subtitle || '& PROPERTY CONSULTANT', finalTitle, finalDesc,
        phone || '', email || 'info@skbuilders.com', location || '', service_areas || '',
        hero_tagline || 'BUILDING QUALITY HOMES.', hero_headline_find || 'Find', hero_headline_property || 'Right Property', hero_headline_confidence || 'Confidence', hero_subtitle || '',
        facebook_url || '', instagram_url || '', whatsapp_number || '', logo_url || '/logo/sk-builders-logo.png'
      ], function(insertErr) {
        if (insertErr) {
          return res.status(500).json({ error: insertErr.message });
        }
        handleSuccess();
      });
    } else {
      const sqlSettings = `
        UPDATE site_settings SET
          company_name = ?, company_subtitle = ?, site_title = ?, meta_description = ?,
          phone = ?, email = ?, location = ?, service_areas = ?,
          hero_tagline = ?, hero_headline_find = ?, hero_headline_property = ?, hero_headline_confidence = ?, hero_subtitle = ?,
          facebook_url = ?, instagram_url = ?, whatsapp_number = ?, logo_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      db.run(sqlSettings, [
        company_name, company_subtitle, finalTitle, finalDesc,
        phone, email, location, service_areas,
        hero_tagline, hero_headline_find, hero_headline_property, hero_headline_confidence, hero_subtitle,
        facebook_url, instagram_url, whatsapp_number, logo_url || '/logo/sk-builders-logo.png',
        existingRow.id
      ], function (err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        handleSuccess();
      });
    }
  });
});

// 7. POST Reset & Purge Data (Properties, Land / Plots, Projects, Gallery, Feedbacks, Leads)
// Strictly preserves videos, video uploads, and frame assets
router.post('/reset-data', async (req, res) => {
  const {
    properties: resetProperties = false,
    land: resetLand = false,
    projects: resetProjects = false,
    gallery: resetGallery = false,
    feedbacks: resetFeedbacks = false,
    leads: resetLeads = false
  } = req.body || {};

  const summary = {
    purged: [],
    deletedFilesCount: 0
  };

  const safeDeletePhysicalFile = (relPath) => {
    if (!relPath || typeof relPath !== 'string') return;
    const lower = relPath.toLowerCase();
    // STRICT SAFETY CHECK: Never touch video or frame files!
    if (
      lower.includes('video') ||
      lower.includes('frame') ||
      lower.endsWith('.mp4') ||
      lower.endsWith('.webm') ||
      lower.endsWith('.mov') ||
      lower.endsWith('.mkv') ||
      lower.endsWith('.avi')
    ) {
      return;
    }
    // Must be inside uploads directory
    if (!lower.includes('uploads/images') && !lower.includes('uploads/')) {
      return;
    }
    try {
      const cleanRel = relPath.replace(/^\//, '');
      const fullPath = path.resolve(projectRoot, cleanRel);
      const allowedDir = path.resolve(projectRoot, 'uploads/images');
      if (fullPath.startsWith(allowedDir) && fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          fs.unlinkSync(fullPath);
          summary.deletedFilesCount++;
        }
      }
    } catch (e) {
      console.warn(`[Reset Purge] Could not delete file ${relPath}:`, e.message);
    }
  };

  const cleanImageSubfolder = (subfolder) => {
    try {
      const targetDir = path.resolve(projectRoot, 'uploads/images', subfolder);
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        for (const f of files) {
          const fp = path.join(targetDir, f);
          const stat = fs.statSync(fp);
          if (stat.isFile()) {
            const lower = f.toLowerCase();
            if (
              !lower.endsWith('.mp4') &&
              !lower.endsWith('.webm') &&
              !lower.includes('frame') &&
              !lower.includes('video')
            ) {
              fs.unlinkSync(fp);
              summary.deletedFilesCount++;
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Reset Purge] Could not clean folder uploads/images/${subfolder}:`, e.message);
    }
  };

  const tasks = [];

  // 1. Properties
  if (resetProperties) {
    tasks.push(new Promise((resolve) => {
      db.all("SELECT image, cover_image FROM properties", [], (e1, pRows = []) => {
        db.all("SELECT image_url FROM property_images", [], (e2, piRows = []) => {
          (pRows || []).forEach(r => {
            safeDeletePhysicalFile(r.image);
            safeDeletePhysicalFile(r.cover_image);
          });
          (piRows || []).forEach(r => safeDeletePhysicalFile(r.image_url));
          cleanImageSubfolder('properties');

          db.run("DELETE FROM property_images", [], () => {
            db.run("DELETE FROM properties", [], () => {
              summary.purged.push('Properties');
              resolve();
            });
          });
        });
      });
    }));
  }

  // 2. Land / Plots
  if (resetLand) {
    tasks.push(new Promise((resolve) => {
      db.all("SELECT image, cover_image FROM land", [], (e1, lRows = []) => {
        db.all("SELECT image_url FROM land_images", [], (e2, liRows = []) => {
          (lRows || []).forEach(r => {
            safeDeletePhysicalFile(r.image);
            safeDeletePhysicalFile(r.cover_image);
          });
          (liRows || []).forEach(r => safeDeletePhysicalFile(r.image_url));
          cleanImageSubfolder('land');

          db.run("DELETE FROM land_images", [], () => {
            db.run("DELETE FROM land", [], () => {
              db.run("DELETE FROM land_plots", [], () => {
                summary.purged.push('Land / Plots');
                resolve();
              });
            });
          });
        });
      });
    }));
  }

  // 3. Projects
  if (resetProjects) {
    tasks.push(new Promise((resolve) => {
      db.all("SELECT image, cover_image FROM projects", [], (e1, prRows = []) => {
        db.all("SELECT image_url FROM project_images", [], (e2, priRows = []) => {
          (prRows || []).forEach(r => {
            safeDeletePhysicalFile(r.image);
            safeDeletePhysicalFile(r.cover_image);
          });
          (priRows || []).forEach(r => safeDeletePhysicalFile(r.image_url));
          cleanImageSubfolder('projects');

          db.run("DELETE FROM project_images", [], () => {
            db.run("DELETE FROM project_stages", [], () => {
              db.run("DELETE FROM projects", [], () => {
                summary.purged.push('Projects');
                resolve();
              });
            });
          });
        });
      });
    }));
  }

  // 4. Gallery
  if (resetGallery) {
    tasks.push(new Promise((resolve) => {
      db.all("SELECT image, image_url FROM gallery", [], (e1, gRows = []) => {
        (gRows || []).forEach(r => {
          safeDeletePhysicalFile(r.image);
          safeDeletePhysicalFile(r.image_url);
        });
        cleanImageSubfolder('gallery');

        db.run("DELETE FROM gallery", [], () => {
          db.run("DELETE FROM gallery_clean", [], () => {
            summary.purged.push('Gallery');
            resolve();
          });
        });
      });
    }));
  }

  // 5. Feedbacks (Testimonials are protected and NOT deleted)
  if (resetFeedbacks) {
    tasks.push(new Promise((resolve) => {
      db.all("SELECT image_url FROM feedback", [], (e1, fRows = []) => {
        (fRows || []).forEach(r => safeDeletePhysicalFile(r.image_url));
        db.run("DELETE FROM feedback", [], () => {
          db.run("DELETE FROM client_feedbacks", [], () => {
            summary.purged.push('Feedbacks');
            resolve();
          });
        });
      });
    }));
  }

  // 6. Leads
  if (resetLeads) {
    tasks.push(new Promise((resolve) => {
      db.run("DELETE FROM leads", [], () => {
        summary.purged.push('Leads');
        resolve();
      });
    }));
  }

  try {
    await Promise.all(tasks);
    res.json({
      success: true,
      message: `Reset complete! Purged: ${summary.purged.join(', ') || 'No categories selected'}. (${summary.deletedFilesCount} physical image files deleted). Videos & frames preserved.`,
      purged: summary.purged,
      deletedFilesCount: summary.deletedFilesCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete reset: ' + err.message });
  }
});

export default router;
