# 🏗️ SK Builders & Property Consultant - Business Showcase & Admin Portal

A full-stack, high-performance, scroll-animated web application and management portal for **SK Builders & Property Consultant**, serving **Poonamallee, Mangadu, Kundrathur, and Chennai**.

---

## 🌟 Key Features

### 🏢 **Public Showcase Website**
- **Interactive 3D Frame Scrubbing (`ConstructionStory.jsx`)**: Canvas-rendered 121-frame 3D interactive video scrubbing that animates a house build step-by-step as visitors scroll down.
- **Dual-Track Continuous Infinite Marquee (`Gallery.jsx`)**: Hardware-accelerated X-axis continuous marquee scrolling with dynamic row balancing (e.g. 11 images automatically split into two balanced 6-image rows).
- **Cinematic Timeline Storyline (`Projects.jsx`)**: Slow-paced, pinned milestone progression (*1. Architectural Plan ➔ 2. Foundation ➔ 3. Column Structure ➔ 4. Finishing ➔ 5. Key Handover*) with sequential project card reveals.
- **Featured Property Listings (`FeaturedProperties.jsx`)**: Filterable Individual House & DTCP Land Plot showcases with compound pricing (`₹58 Lakhs`), 3D specular card tilts, and detailed modal views.
- **Instant Preloaded Cache Hydration**: 0ms latency page rendering on refresh via `sessionStorage` caching paired with silent background API re-validation.
- **Zero-Flash Skeleton Loaders**: Shimmering skeleton placeholders during data fetching to prevent empty state layout shifts or "Not Found" flashes.
- **Lenis & GSAP Momentum Scroll Engine**: Pinned stage containers (`WhyChooseUs`, `Gallery`, `Services`, `Properties`, `Projects`, `ContactCTA`) powered by Lenis smooth momentum scrolling and GSAP ScrollTrigger.

### 🔐 **Admin Management Portal (`AdminDashboard.jsx`)**
- **Full CRUD Control**: Manage Properties, Land Plots, Construction Projects, Photo Gallery, Customer Inquiry Leads, and Hero/Background Videos.
- **Custom Multi-Step Property Form**: 7-step wizard with compound inputs (fixed `₹` symbol + editable number + denomination select; editable number + fixed `BHK` badge; area number + unit select).
- **Media Management**: Single & batch image uploads, physical disk file unlinking on deletion, custom video file renaming, and instant primary video selection.
- **Security & Session Management**: Session token authentication and credentials management (username/password update).

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React 18, Vite 6, Tailwind CSS v4, GSAP (ScrollTrigger), Lenis Smooth Scroll, Lucide React icons.
- **Backend**: Node.js, Express.js API server.
- **Database**: SQLite3 (embedded relational database with automated migrations).
- **Storage**: Multer file storage for images and videos, with physical `fs.unlinkSync` disk file deletion.
- **Frame Pipeline**: Python OpenCV script (`python/extract_frames.py`) for automated 3D WebP frame extraction from uploaded hero construction videos.

---

## 💡 Engineering & Problem Solving Solutions

1. **Preventing Page Reloads on Admin Updates (Vite Watcher Optimization)**:
   - *Problem*: Vite's dev server was watching the root directory `.`. Whenever an admin uploaded media to `uploads/` or updated SQLite `showcase.db`, Vite triggered a full page reload (`[vite] page reload`) in all open tabs.
   - *Solution*: Configured `server.watch.ignored` in `vite.config.js` to ignore `uploads/**`, `app/server/**`, `frames/**`, and `*.db*`. Admin updates now update React state and trigger real-time events without refreshing the browser.

2. **Eliminating Empty State "Not Found" Flashes on Refresh**:
   - *Problem*: On page refresh, while async data was loading from API, components briefly flashed empty "No items found" containers.
   - *Solution*: Implemented `sessionStorage` initial cache hydration in `useSiteData.js` for 0ms initial load, combined with sleek pulsing skeleton loaders across all public components and admin dashboard tabs while `loading` is true.

3. **Smooth Infinite Marquee Sub-Pixel Math**:
   - *Problem*: Marquee animations stuttered or jumped at the loop boundary.
   - *Solution*: Aligned 3x duplicate loop arrays with keyframes `transform: translate3d(0, 0, 0)` to `transform: translate3d(-33.333333%, 0, 0)`. At `-33.333333%`, set 2 maps to set 1 with 100% sub-pixel accuracy for a seamless 60fps infinite loop.

4. **Section Pinning & Layout Overlap Resolution**:
   - *Problem*: GSAP section pinning caused adjacent sections to bleed or overlap into each other.
   - *Solution*: Standardized stage container bounds (`min-h-0 sm:min-h-screen h-auto sm:h-screen`), expanded scroll distances (`end: '+=2000'` to `'+=3400'`), set `anticipatePin: 1`, and added automatic `ScrollTrigger.refresh()` on data load.

5. **Physical Disk File Cleanup**:
   - *Problem*: Deleting database records left orphan files taking up disk space.
   - *Solution*: Implemented automated physical file unlinking using `fs.unlinkSync` across all API delete endpoints (`/api/properties`, `/api/land`, `/api/projects`, `/api/gallery`, `/api/media`).

---

## 🚀 Development Setup

Run the project directly from the root directory:

```bash
# Using npm
npm run dev

# OR using pnpm
pnpm dev
```

### Services Launched:
- **Frontend (Vite)**: [http://localhost:5173](http://localhost:5173)
- **Backend (Express + SQLite)**: [http://localhost:5000](http://localhost:5000)

---

## 📦 Production Build & Deployment

Generate the production bundle:

```bash
npm run build
```

The output build files are generated in `dist/`.

### 🌐 GitHub Pages Deployment
1. Go to repository Settings ➔ **Pages** on GitHub.
2. Select **Source**: `Deploy from a branch` ➔ **Branch**: `main` ➔ **Folder**: `/dist` (or root).
3. Save to deploy live!

### ⚡ Netlify / Vercel Deployment
1. Import repository in Netlify/Vercel.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Deploy!
