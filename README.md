# CatShare - Product Catalog & Inventory Management App

![CatShare Logo](/public/logo-catalogue-share.svg)

A powerful mobile-first product catalog and inventory management application built with React, TypeScript, and Capacitor. Create, organize, and share product listings with customers across multiple channels.

## Features

- 📦 **Product Catalog Management** - Create and manage product listings with ease
- 📊 **Inventory Tracking** - Keep track of your product inventory
- ✏️ **Bulk Product Editor** - Edit multiple products at once
- 🖼️ **Image Rendering Engine** - Automatically render product images in multiple formats
- 📤 **Multi-Channel Export** - Export to CSV and other formats
- 💾 **Backup & Restore** - Backup your entire catalog and restore anytime
- 📂 **Category Management** - Organize products by categories
- 💰 **Pricing Tiers** - Support wholesale, resell, and retail pricing
- 🌙 **Dark Mode** - User-friendly dark mode support
- 📱 **Offline Support** - Works offline with local storage
- 🎯 **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

- **Frontend Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Mobile**: Capacitor (iOS & Android)
- **State Management**: React Hooks
- **Database**: Local Storage / Capacitor Filesystem
- **Icons**: React Icons

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- pnpm (v10.18.0 or higher)

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Build for mobile
npx cap build ios
npx cap build android
```

## App Store Optimization (ASO)

This project includes comprehensive ASO optimization for better discoverability across app stores and search engines:

### SEO Optimization
- ✅ Meta tags for search engines (title, description, keywords)
- ✅ Open Graph tags for social media sharing
- ✅ Twitter Card integration
- ✅ Structured data (JSON-LD) for rich snippets
- ✅ Robots.txt for search crawler guidance
- ✅ Sitemap.xml for indexing
- ✅ Canonical URLs

### Performance Optimization
- ✅ Code splitting and lazy loading
- ✅ GZIP compression
- ✅ Image optimization
- ✅ Minified production builds
- ✅ HTTP caching headers
- ✅ Optimized bundle size

### App Store Metadata
- ✅ App name and description optimized
- ✅ Keywords for discoverability
- ✅ Icons in multiple resolutions (192x192, 512x512, maskable)
- ✅ App categories and features list
- ✅ Web app manifest with all required fields
- ✅ Shortcuts for quick actions
- ✅ Share target integration

### Security & Trust Signals
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ HTTPS enabled (for production)
- ✅ CORS properly configured
- ✅ No insecure content warnings

## Key ASO Files

- `index.html` - Comprehensive meta tags and structured data
- `public/manifest.json` - Web app manifest with metadata
- `public/robots.txt` - Search engine crawler instructions
- `public/sitemap.xml` - URL indexing map
- `public/browserconfig.xml` - Windows tile configuration
- `public/.htaccess` - Server configuration with caching and security
- `capacitor.config.ts` - Mobile app configuration

## Directory Structure

```
src/
├── CatalogueApp.tsx       # Main app component
├── SideDrawer.jsx         # Navigation menu
├── CreateProduct.tsx      # Product creation page
├── Shelf.jsx              # Inventory management
├── Retail.tsx             # Retail view
├── MediaLibrary.jsx       # Image management
├── BulkEdit.jsx           # Bulk editing
├── App.tsx                # Root app wrapper
├── index.css              # Global styles
└── main.tsx               # Entry point
```

## Configuration

### Environment Variables
Create a `.env` file for environment-specific settings:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_KEY=your_supabase_key
```

### App Store Submission

For iOS App Store:
1. Update `capacitor.config.ts` with your bundle ID
2. Configure signing certificates
3. Submit with the optimized metadata
4. Use keywords from `index.html` for App Store listing

For Google Play Store:
1. Set up app ID: `com.catshare.official`
2. Use optimized description and keywords
3. Upload screenshots and feature graphics
4. Enable language and region targeting

## Building for Production

```bash
# Build web version
pnpm run build

# Generate optimized icons
pnpm run generate-icons

# Build mobile apps
npx cap sync
npx cap build android
npx cap build ios
```

## Performance Metrics

The app is optimized for key metrics:
- **Core Web Vitals**: LCP, FID, CLS
- **Lighthouse**: 90+ score target
- **Mobile Friendly**: Fully responsive
- **Load Time**: < 3 seconds on 4G

## File Size Optimization

- Main bundle: ~150KB (gzipped)
- Vendor chunks: Optimized for parallel loading
- Images: WebP format support with fallbacks
- CSS: Purged unused styles with Tailwind

## Contributing

1. Follow existing code conventions
2. Use TypeScript for type safety
3. Test responsive design
4. Optimize assets before committing

## Author

Created by **Sabarish Arjunan**

## License

ISC

## Support

For issues, feature requests, or app store optimization questions, please reach out to the development team.

---

**Last Updated**: January 2024
**Version**: 1.0.0
