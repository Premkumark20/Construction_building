import express from 'express';
import cors from 'cors';
import path from 'path';
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
import mediaRouter from './routes/media.js';

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
app.use('/logo', express.static(path.join(__dirname, '../../logo')));
app.use('/videos', express.static(path.join(__dirname, '../public/videos'), { acceptRanges: true }));

// API Routes
app.use('/api/settings', siteSettingsRouter);
app.use('/api/services', servicesRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/land', landRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/contact', contactRouter);
app.use('/api/media', mediaRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SK Builders API', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SK Builders Express Backend Server listening on http://0.0.0.0:${PORT}`);
});
