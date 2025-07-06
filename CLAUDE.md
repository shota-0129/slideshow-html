# Project Overview

A secure, high-performance Next.js application for viewing HTML-based presentations with thumbnail generation capabilities. Built with TypeScript, featuring XSS protection, dynamic thumbnails, and static export support for production deployment.

## Tech Stack

- **Language**: TypeScript 5.x
- **Framework**: Next.js 15.3.3 (App Router)
- **Runtime**: React 19.0.0
- **UI Library**: Radix UI + Tailwind CSS 4.x
- **Icons**: Lucide React
- **Thumbnail Generation**: Puppeteer 22.0.0
- **Build Tools**: ESLint 9.x, PostCSS, Autoprefixer
- **Node.js**: >=18.0.0, npm >=8.0.0

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `app/api/thumb/` - Thumbnail generation API endpoint
- `app/presentations/[slug]/[page]/` - Dynamic presentation viewer routes
- `components/` - React components (UI components, presentation viewer)
- `lib/` - Utility functions (HTML sanitizer, server utils, logger)
- `public/` - Static assets and HTML presentation files
- `public/[slug]/` - Individual presentation directories with HTML files
- `scripts/` - Build and deployment scripts

## Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Production build with static generation
- `npm start` - Start production server
- `npm run build:static` - Build static export with thumbnails
- `npm run preview:static` - Preview static build locally
- `npm run lint` - Run ESLint checks
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type-check` - TypeScript type checking
- `npm run security:audit` - Security vulnerability audit

## Code Style & Conventions

- **Formatter**: ESLint with Next.js config
- **Naming**: camelCase for variables/functions, PascalCase for components
- **File Structure**: kebab-case for files, PascalCase for React components
- **Import Order**: External libraries → Internal modules → Relative imports
- **TypeScript**: Strict mode enabled, explicit return types for functions
- **CSS**: Tailwind CSS utility classes, component-based styling

## Development Workflow

- **Branch Strategy**: Feature branches from main, PR-based workflow
- **Environment**: Development mode for local testing, production build for deployment
- **Security**: HTML sanitization in development (permissive), strict in production
- **Static Generation**: Use `generateStaticParams` for pre-rendering presentation pages
- **API Routes**: Rate limiting and input validation for all endpoints

## Testing Strategy

- **Type Safety**: TypeScript strict mode with `tsc --noEmit`
- **Linting**: ESLint with Next.js recommended rules
- **Security**: Built-in HTML sanitization and XSS protection
- **Manual Testing**: Test both development and production builds
- **Performance**: Monitor bundle size and Core Web Vitals

## Environment Setup

1. **Node.js**: Install Node.js 18+ and npm 8+
2. **Dependencies**: Run `npm install` to install packages
3. **Presentations**: Add HTML files to `public/[slug]/` directories
4. **Development**: Use `npm run dev` for local development
5. **Production**: Use `npm run build:static` for static deployment

## Repository Etiquette

- **Commits**: Use conventional commit format (`feat:`, `fix:`, `docs:`)
- **PR Requirements**: Type check, lint, and build must pass
- **Code Review**: Security-focused review for HTML sanitization changes
- **Merge Strategy**: Squash and merge for feature branches
- **Release**: Tag versions following semantic versioning

## Do Not Section

**IMPORTANT**: Do NOT edit the following:
- `public/*/` - Presentation HTML files (managed by content creators)
- `.next/` - Next.js build output directory
- `out/` - Static export output directory
- `node_modules/` - Package dependencies
- `package-lock.json` - Dependency lock file (unless updating packages)

## Terminology / Glossary

- **Slug**: URL-safe presentation identifier (directory name in public/)
- **Page**: Individual slide number within a presentation (1-based indexing)
- **Static Export**: Pre-built HTML files for CDN deployment
- **Thumbnail**: Auto-generated preview image for presentation slides
- **Sanitization**: HTML content validation and XSS prevention
- **Dynamic Route**: Next.js route with parameters like `[slug]` and `[page]`

## Review Process Guidelines

- [ ] TypeScript compilation passes without errors
- [ ] ESLint checks pass with no warnings
- [ ] Security: HTML sanitization logic is not weakened
- [ ] Performance: No unnecessary re-renders or large bundle increases
- [ ] Accessibility: Keyboard navigation and screen reader support maintained
- [ ] Cross-browser: Test in Chrome, Firefox, Safari
- [ ] Mobile: Responsive design works on mobile devices
- [ ] Static Export: `npm run build:static` completes successfully

## AI Working Instructions

- **IMPORTANT**: Always read `CLAUDE.md` first to understand project context and constraints
- **Workflow**: Plan → Implement → Test → Review → Document changes
- **Security First**: Never bypass HTML sanitization or security measures
- **Environment Awareness**: Distinguish between development and production behavior
- **Static Generation**: Ensure changes work with both SSR and static export
- **Performance**: Use `useCallback`, `useMemo` for React optimization
- **File Structure**: Follow established patterns for new components/pages
- **Testing**: Test both `npm run dev` and `npm run build` before completion
- **Documentation**: Update relevant sections when adding new features
- **Error Handling**: Implement proper error boundaries and 404 pages