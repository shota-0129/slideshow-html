# Project Overview

A secure, high-performance Next.js application for viewing HTML-based presentations with thumbnail generation capabilities. Built with TypeScript, featuring XSS protection, dynamic thumbnails, and static export support for production deployment.

## Tech Stack

- **Language**: TypeScript 5.x
- **Framework**: Next.js 15.3.3 (App Router)
- **Runtime**: React 19.0.0
- **UI Library**: Radix UI + Tailwind CSS 4.x
- **Icons**: Lucide React
- **Thumbnail Generation**: Puppeteer 22.0.0
- **Security**: DOMPurify 3.2.6, Zod 3.25.74
- **Build Tools**: ESLint 9.x, PostCSS, Autoprefixer
- **Node.js**: >=18.0.0, npm >=8.0.0

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `app/api/thumb/` - Thumbnail generation API endpoint
- `app/presentations/[slug]/[page]/` - Dynamic presentation viewer routes
- `components/` - React components (UI components, presentation viewer)
- `lib/` - Utility functions (DOMPurify sanitizer, server utils, structured logger, validation, security, error handling)
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
- `npm run test` - Run unit tests (watch mode)
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:ci` - Run tests in CI mode (no watch)
- `npm run security:audit` - Security vulnerability audit

## Code Style & Conventions

- **Formatter**: ESLint with Next.js config
- **Naming**: camelCase for variables/functions, PascalCase for components
- **File Structure**: kebab-case for files, PascalCase for React components
- **Import Order**: External libraries → Internal modules → Relative imports
- **TypeScript**: Strict mode enabled, explicit return types for functions
- **CSS**: Tailwind CSS utility classes, component-based styling

## Security Architecture

- **HTML Sanitization**: DOMPurify with server-side JSDOM for bulletproof XSS protection
- **Content Security Policy**: Strict CSP with cryptographic nonces for inline scripts/styles
- **Input Validation**: Comprehensive Zod schemas for all user inputs and API parameters
- **Error Handling**: Structured logging with security event monitoring and safe error responses
- **Rate Limiting**: IP-based rate limiting with configurable windows and limits
- **Path Traversal Protection**: Multiple layers of validation for file system access

## Development Workflow

- **Branch Strategy**: Feature branches from main, PR-based workflow
- **Environment**: Development mode for local testing, production build for deployment
- **Security**: Multi-layered security with environment-based validation strictness
- **Static Generation**: Use `generateStaticParams` for pre-rendering presentation pages
- **API Routes**: Comprehensive validation, rate limiting, and structured error handling

## Testing Strategy

- **Unit Tests**: Jest + React Testing Library for component and utility testing
- **Integration Tests**: API route testing with mocked dependencies
- **Security Tests**: HTML sanitization and input validation testing  
- **Type Safety**: TypeScript strict mode with `tsc --noEmit`
- **Linting**: ESLint with Next.js recommended rules
- **Coverage**: Code coverage reports with minimum thresholds
- **CI/CD**: Automated testing in GitHub Actions with multi-node versions
- **Performance**: Lighthouse CI for performance monitoring

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
- **Test-Driven Development**: After editing any code, ALWAYS run `npm test` immediately. If tests fail, IMMEDIATELY rollback your changes and fix the underlying issue before proceeding

### **Shell Command Execution Policy**

To ensure safety and accuracy, you **must not** execute any shell commands (e.g., `npm`, `ls`, `git`, etc.) yourself. Your role is to assist the user, not to operate their system. Instead, you must follow this procedure:

1.  **Propose the Command**: Clearly state the command you believe is necessary in a `bash` code block and explain its purpose.

      * *Example 1: Linting*
        > "To check for any code style issues, please run the following command in your terminal:"
        > ```bash
        > npm run lint
        > ```
      * *Example 2: Listing files*
        > "To verify the contents of the `scripts` directory, could you please run this command?"
        > ```bash
        > ls -l scripts/
        > ```

2.  **Request Execution**: Politely ask the user to run the command in their own development environment.

3.  **Request Output**: Ask the user to provide the **full and complete output** from the command, including any error messages. This is critical for your analysis.

4.  **Analyze and Proceed**: Use the output provided by the user to inform your next steps, analysis, or code modifications. If the output indicates an error, analyze the error message to help the user debug the issue.