import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import propertiesRouter from './routes/properties.js';
import landRouter from './routes/land.js';
import projectsRouter from './routes/projects.js';
import leadsRouter from './routes/leads.js';
import contactRouter from './routes/contact.js';
import siteSettingsRouter from './routes/siteSettings.js';
import servicesRouter from './routes/services.js';
import galleryRouter from './routes/gallery.js';
import testimonialsRouter from './routes/testimonials.js';
import feedbackRouter from './routes/feedback.js';
import mediaRouter from './routes/media.js';
import statsRouter from './routes/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static assets from project root, uploads, logo, and videos folders
app.use(express.static(path.join(__dirname, '../../')));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/logo', express.static(path.join(__dirname, '../../logo')));
app.use('/logo', express.static(path.join(process.cwd(), 'logo')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos'), { acceptRanges: true }));
app.use('/videos', express.static(path.join(__dirname, '../../videos'), { acceptRanges: true }));
app.use('/frames', express.static(path.join(__dirname, '../../frames')));
app.use('/frames', express.static(path.join(__dirname, '../public/frames')));

if (process.env.VERCEL) {
  app.use('/uploads', express.static('/tmp/uploads'));
  app.use('/logo', express.static('/tmp/logo'));
  app.use('/videos', express.static('/tmp/videos', { acceptRanges: true }));
}

// Fallback explicit static handler for /uploads/*
app.get('/uploads/*', (req, res, next) => {
  const subPath = req.params[0];
  const candidates = [
    path.join(__dirname, '../../uploads', subPath),
    path.join(process.cwd(), 'uploads', subPath),
    path.join('/tmp/uploads', subPath)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return res.sendFile(c);
    }
  }
  next();
});

// API Routes
app.use('/api/settings', siteSettingsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/land', landRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/media', mediaRouter);


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SK Builders API', timestamp: new Date().toISOString() });
});

if (!process.env.VERCEL) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SK Builders Express Backend Server listening on http://0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[EADDRINUSE] Port ${PORT} is already in use by another running Node process.`);
      console.error(`If a previous backend instance is active, you can kill it or proceed with the existing server.`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });
}

export default app;
