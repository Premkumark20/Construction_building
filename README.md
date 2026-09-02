# SK Builders & Property Consultant - Business Showcase Website

A state-of-the-art, full-stack web application and interactive digital showcase built for **SK Builders & Property Consultant**, serving **Poonamallee, Mangadu, Kundrathur, and Greater Chennai**.

![SK Builders Showcase](app/public/logo/sk-builders-logo.png)

---

## 🏢 About SK Builders & Property Consultant

**SK Builders & Property Consultant** is a trusted construction company and property consultancy specializing in individual house construction, residential plot developments, and end-to-end real estate solutions.

* **Primary Service Locations**: Poonamallee, Mangadu, Kundrathur, Kanchipuram District & Greater Chennai.
* **Core Value**: Uncompromising structural quality, transparent pricing, quality-certified engineering, and on-time delivery.

---

## 🛠️ Key Services

### 1. 🏡 Houses for Sale
Ready-to-move and under-construction individual luxury houses, duplex villas, and independent homes designed with RCC column foundations, red brick masonry, and premium fittings.

### 2. 🗺️ Lands & Plots for Sale
DTCP & CMDA approved residential plots in prime, rapidly developing locations with clear legal titles and high appreciation potential.

### 3. 🏗️ Contract House Construction
Complete turnkey contract house construction on customer land. We handle everything from 2D/3D architectural floor plans, foundation engineering, red brick wall construction, waterproof concrete roofing, to final key handover.

### 4. 👥 Property Consultation & Real Estate Guidance
Expert assistance for buyers, sellers, and plot investors. Transparent pricing, site visits, and market valuation guidance.

### 5. 📄 Documentation Support
End-to-end assistance with legal documents, Patta transfers, Encumbrance Certificates (EC), parent document verification, and registration guidance.

### 6. 📐 Construction Consultation & Estimation
Detailed cost estimation, structural design planning, site supervision, and quality engineer certification.

---

## ✨ Key Website Features & Interactive Experiences

- 🎬 **Interactive 3D Construction Hero Storyboard**: GSAP ScrollTrigger canvas frame scrubbing that renders 121 high-definition WebP frames as the user scrolls down, visually transforming vacant land into a finished home.
- 🔄 **Dual-Track Continuous Infinite Marquee Gallery**: Dual X-axis auto-scrolling showcase highlighting completed houses, plot layouts, and site progress.
- ⏱️ **5-Stage Construction Timeline Storyline**: Interactive step-by-step milestone progression (*1. Architectural Plan ➔ 2. Column Foundation ➔ 3. Red Brick Masonry ➔ 4. Waterproof Concrete Roof ➔ 5. Key Handover*).
- 🔐 **Comprehensive Admin Portal (`/admin`)**: Secure dashboard for real-time CRUD management:
  - Add, edit, or delete House Properties, Land Plots, and Construction Projects.
  - Upload Gallery photos and hero/background construction videos.
  - Review customer leads and enquiry messages.
  - Update company branding, phone numbers, email, service areas, and tagline.
- ⚡ **Instant Zero-Latency Data Hydration**: Uses `sessionStorage` caching with silent background synchronization for instant page reloads without empty state flashes.
- 📞 **Direct One-Touch Contact & WhatsApp Integration**: Integrated phone call buttons and pre-filled WhatsApp enquiry links for direct customer leads.

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS v4, GSAP 3 (ScrollTrigger), Lenis Smooth Scroll, Lucide React.
- **Backend**: Node.js, Express.js, SQLite (`showcase.db`), Multer File Storage.
- **Media Processing**: Python frame extraction script (`python/extract_frames.py` with OpenCV).

---

## 🚀 Quick Start & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/Premkumark20/Construction_building.git
cd Construction_building
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
This concurrently starts:
- **Frontend (Vite)**: `http://localhost:5173`
- **Backend (Express API & SQLite)**: `http://localhost:5000`

### 4. Admin Portal Access
Navigate to `http://localhost:5173/#admin` (or `http://localhost:5173/admin`) to manage site content.

---

## 🌐 Deployment Options

- **Static Hosting (GitHub Pages & Netlify)**: Pre-built production files are located in `dist/`.
- **Full Stack Hosting (Render / Railway / VPS)**: Deploy Express server with Node.js and SQLite.

---

## 📞 Business Contact Information

- **Company Name**: SK Builders & Property Consultant
- **Location**: Poonamallee, Mangadu, Kundrathur, Chennai, Tamil Nadu
- **Email**: info@skbuilders.com
- **Phone**: +91 98765 43210
