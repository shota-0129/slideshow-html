# HTML Slideshow Viewer

A secure, high-performance Next.js application for viewing HTML-based presentations with thumbnail generation capabilities.

## 🚀 Features

- **Secure HTML Rendering**: Built-in HTML sanitization and XSS protection
- **Dynamic Thumbnails**: Automatic thumbnail generation using Puppeteer
- **Static Export Support**: Can be deployed as static files or server-side rendered
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Navigation**: Arrow keys, Enter, and Space for slide navigation
- **Full-screen Mode**: Dedicated full-screen presentation view
- **Rate Limiting**: Built-in API protection against abuse
- **Path Traversal Protection**: Secure file system access

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

## 🛠️ Installation

```bash
# Clone the repository
git clone <repository-url>
cd slideshow-html

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

## 🏗️ Development vs Production

### Development Mode (`npm run dev`)

**Purpose**: Local development and testing
- **Hot Reload**: Instant updates during development
- **Dynamic Thumbnails**: Generated on-demand via API routes
- **Detailed Logging**: Full error messages and debug information
- **No Build Optimization**: Faster startup, larger bundle size
- **Security**: Development-friendly settings

**Use Cases**:
- Adding new presentations
- Modifying UI components
- Testing functionality
- Debugging issues

### Production Build (`npm run build` + `npm start`)

**Purpose**: Server-side rendered production deployment
- **Optimized Bundle**: Minified and tree-shaken code
- **Dynamic API Routes**: Thumbnail generation via `/api/thumb`
- **Server-Side Rendering**: Better SEO and initial load performance
- **Production Logging**: Sanitized error messages
- **Enhanced Security**: Strict CSP headers and rate limiting

**Use Cases**:
- Vercel, Netlify, or similar platform deployment
- Docker containerization
- Server environments with Node.js runtime

### Static Export (`npm run build:static`)

**Purpose**: Static file deployment without server requirements
- **Pre-generated Thumbnails**: All thumbnails created during build
- **No Server Required**: Can be served from CDN or static hosting
- **Maximum Performance**: No runtime thumbnail generation
- **Highest Security**: No server-side code execution
- **Build-time Processing**: Longer build time, faster runtime

**Use Cases**:
- GitHub Pages deployment
- AWS S3 + CloudFront
- Any static file hosting service
- Maximum security environments

## 🚀 Quick Start

### 1. Add Your Presentations

Create directories in the `public/` folder with HTML files:

```
public/
├── my-presentation/
│   ├── 1.html
│   ├── 2.html
│   └── 3.html
└── another-presentation/
    ├── 1.html
    └── 2.html
```

### 2. HTML File Format

Each HTML file should be a complete slide:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slide Title</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    .slide {
      padding: 40px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="slide">
    <h1>Your Slide Content</h1>
    <p>Add your content here</p>
  </div>
</body>
</html>
```

### 3. Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start

# Static export
npm run build:static
npm run preview:static
```

## 📁 Project Structure

```
slideshow-html/
├── app/                          # Next.js App Router
│   ├── api/thumb/               # Thumbnail generation API
│   ├── presentations/[slug]/    # Dynamic presentation routes
│   ├── layout.tsx              # Root layout with security headers
│   └── page.tsx                # Home page with presentation list
├── components/                  # React components
│   ├── ui/                     # Reusable UI components
│   ├── presentation-viewer.tsx  # Main presentation viewer
│   └── full-screen-viewer.tsx  # Full-screen mode component
├── lib/                        # Utility libraries
│   ├── server-utils.ts         # Server-side utilities
│   ├── html-sanitizer.ts       # HTML security functions
│   ├── logger.ts              # Logging utilities
│   └── utils.ts               # General utilities
├── public/                     # Static files and presentations
│   ├── [presentation-name]/    # Your presentation directories
│   └── thumbs/                # Generated thumbnails (static mode)
├── scripts/                    # Build scripts
│   └── generate-thumbnails-post.ts
└── README.md
```

## 🔒 Security Features

### Input Validation
- Strict slug validation (alphanumeric, hyphens, underscores only)
- Path traversal protection
- File size limits

### HTML Sanitization
- Removal of dangerous tags (`<script>`, `<iframe>`, `<object>`)
- Event handler stripping (`onclick`, `onload`, etc.)
- Content size limits

### API Protection
- Rate limiting (10 requests/minute per IP)
- Request timeout handling
- Secure Puppeteer configuration

### Browser Security
- Content Security Policy (CSP) headers
- X-Frame-Options protection
- Referrer policy configuration

## ⚡ Performance Optimizations

### Development Mode
- Hot module replacement
- On-demand thumbnail generation
- Unoptimized images for faster development

### Production Mode
- Code splitting and tree shaking
- Image optimization
- Caching headers for thumbnails
- Gzip compression

### Static Export Mode
- Pre-generated thumbnails
- No server-side processing
- CDN-friendly static assets

## 🌐 Deployment Options

### Vercel (Recommended for SSR)
```bash
npm run build
# Deploy to Vercel
```

### Static Hosting (GitHub Pages, Netlify, etc.)
```bash
npm run build:static
# Deploy the 'out' directory
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` for local development:

```env
# Development settings
NODE_ENV=development
ENABLE_RATE_LIMITING=false
LOG_LEVEL=debug

# Production settings (uncomment for production)
# NODE_ENV=production
# ENABLE_RATE_LIMITING=true
# LOG_LEVEL=info
```

### Customization

- **Styling**: Modify `app/globals.css` and Tailwind configuration
- **Components**: Customize components in `components/` directory
- **Security**: Adjust settings in `lib/html-sanitizer.ts`
- **Performance**: Configure caching in API routes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

**Thumbnails not generating**
- Check if Puppeteer dependencies are installed
- Verify HTML files are valid
- Check browser console for errors

**Build failures**
- Ensure Node.js version is 18+
- Clear `.next` directory and rebuild
- Check for TypeScript errors

**Security warnings**
- Review HTML content for dangerous elements
- Check file permissions
- Verify environment variables

### Getting Help

- Check the [Issues](../../issues) page
- Review the [Discussions](../../discussions) section
- Submit bug reports with detailed information

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Thumbnails powered by [Puppeteer](https://pptr.dev/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
