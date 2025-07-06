import "server-only";
import fs from 'fs';
import path from 'path';
import { sanitizeHtml, validateHtmlContent } from './html-sanitizer';
import { SlugSchema, PageSchema, FilePathSchema, safeParseWithSchema } from './validation';

// -----------------------------------------------------------------------------
// Security Functions
// -----------------------------------------------------------------------------

/**
 * Validates and sanitizes a slug parameter using Zod schema
 * @param slug - The slug to validate.
 * @returns A sanitized slug or null if invalid.
 */
function sanitizeSlug(slug: string): string | null {
  const validation = safeParseWithSchema(SlugSchema, slug);
  return validation.success ? validation.data : null;
}

/**
 * Validates page number using Zod schema
 * @param page - The page number to validate
 * @returns The validated page number or null if invalid
 */
function validatePageNumber(page: number): number | null {
  const validation = safeParseWithSchema(PageSchema, page);
  return validation.success ? validation.data : null;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Recursively finds all .html files within a given directory with depth limit.
 * @param dirPath - The absolute path to the directory to search.
 * @param maxDepth - Maximum recursion depth (default: 3).
 * @param currentDepth - Current recursion depth (internal use).
 * @returns An array of full file paths for all found .html files.
 */
function getHtmlFilePaths(dirPath: string, maxDepth: number = 3, currentDepth: number = 0): string[] {
    let htmlFiles: string[] = [];
    
    // Prevent excessive recursion
    if (currentDepth > maxDepth) {
        return htmlFiles;
    }
    
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        // Limit the number of entries processed to prevent DoS
        const limitedEntries = entries.slice(0, 100);
        
        for (const entry of limitedEntries) {
            const fullPath = path.join(dirPath, entry.name);
            
            // Skip hidden files and directories
            if (entry.name.startsWith('.')) {
                continue;
            }
            
            if (entry.isDirectory()) {
                htmlFiles = htmlFiles.concat(getHtmlFilePaths(fullPath, maxDepth, currentDepth + 1));
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                // Additional security check: ensure filename is safe
                if (/^[a-zA-Z0-9-_.]+\.html$/.test(entry.name)) {
                    htmlFiles.push(fullPath);
                }
            }
            
            // Limit total files to prevent memory exhaustion
            if (htmlFiles.length > 1000) {
                break;
            }
        }
    } catch (error) {
        // Log security-relevant errors in development
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Error reading directory ${dirPath}:`, error);
        }
    }
    return htmlFiles;
}

/**
 * Gets all HTML file paths and sorts them to ensure consistent page order.
 * @param dirPath - The absolute path to the directory to search.
 * @returns A sorted array of full file paths.
 */
function getSortedHtmlFilePaths(dirPath: string): string[] {
    const paths = getHtmlFilePaths(dirPath);
    // Sort alphabetically to ensure page order is predictable (1.html, 2.html, ...)
    return paths.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}


// -----------------------------------------------------------------------------
// Exported Functions
// -----------------------------------------------------------------------------

/**
 * Gets the total number of pages (HTML files) for a single presentation slug.
 * @param slug - The directory name of the presentation in `public`.
 * @returns An object containing the total number of pages.
 */
export function getPresentationData(slug: string): { totalPages: number } {
  try {
    // Validate and sanitize the slug to prevent path traversal
    const sanitizedSlug = sanitizeSlug(slug);
    if (!sanitizedSlug) {
      console.warn(`Invalid slug provided: "${slug}"`);
      return { totalPages: 0 };
    }

    const presentationPath = path.join(process.cwd(), 'public', sanitizedSlug);
    
    // Additional security check: ensure the resolved path is within the public directory
    const publicDir = path.join(process.cwd(), 'public');
    const resolvedPath = path.resolve(presentationPath);
    if (!resolvedPath.startsWith(path.resolve(publicDir))) {
      console.warn(`Path traversal attempt detected for slug: "${slug}"`);
      return { totalPages: 0 };
    }

    const htmlFiles = getSortedHtmlFilePaths(presentationPath);
    return { totalPages: htmlFiles.length };
  } catch (error) {
    // Don't log the full error details in production to prevent information leakage
    console.warn(`Failed to get presentation data for slug: "${slug}"`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    return { totalPages: 0 };
  }
}

/**
 * Scans the `public` directory to find all available presentations.
 * @returns An array of presentation objects, each with a slug and total page count.
 */
export function getAllPresentations(): Array<{ slug:string; totalPages: number }> {
    try {
        const publicDir = path.join(process.cwd(), 'public');
        const allEntries = fs.readdirSync(publicDir, { withFileTypes: true });
        const presentationSlugs = allEntries
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        const presentations = presentationSlugs.map(slug => {
            const { totalPages } = getPresentationData(slug);
            return { slug, totalPages };
        });

        return presentations.filter(p => p.totalPages > 0);
    } catch (error) {
        console.error("Failed to get all presentations:", error);
        return [];
    }
}

/**
 * Reads the content of a specific slide's HTML file.
 * @param slug - The directory name of the presentation.
 * @param page - The page number to retrieve (1-based).
 * @returns The HTML content of the slide as a string, or null if not found.
 */
export const getSlideContent = (slug: string, page: number): string | null => {
  try {
    // Validate and sanitize the slug using Zod
    const sanitizedSlug = sanitizeSlug(slug);
    if (!sanitizedSlug) {
      console.warn(`Invalid slug provided: "${slug}"`);
      return null;
    }

    // Validate page number using Zod
    const validatedPage = validatePageNumber(page);
    if (validatedPage === null) {
      console.warn(`Invalid page number: ${page}`);
      return null;
    }

    const presentationPath = path.join(process.cwd(), 'public', sanitizedSlug);
    
    // Security check: ensure the resolved path is within the public directory
    const publicDir = path.join(process.cwd(), 'public');
    const resolvedPath = path.resolve(presentationPath);
    if (!resolvedPath.startsWith(path.resolve(publicDir))) {
      console.warn(`Path traversal attempt detected for slug: "${slug}"`);
      return null;
    }

    const allHtmlFiles = getSortedHtmlFilePaths(presentationPath);
    
    // Check if the requested page is within the valid range
    if (validatedPage > 0 && validatedPage <= allHtmlFiles.length) {
        const filePath = allHtmlFiles[validatedPage - 1]; // Convert 1-based page to 0-based index
        if (filePath) {
          // Additional security check for the file path
          const resolvedFilePath = path.resolve(filePath);
          if (!resolvedFilePath.startsWith(path.resolve(publicDir))) {
            console.warn(`File path traversal attempt detected: "${filePath}"`);
            return null;
          }
          
          const rawContent = fs.readFileSync(filePath, 'utf-8');
          
          // Validate and sanitize HTML content
          if (!validateHtmlContent(rawContent)) {
            console.warn(`Potentially dangerous HTML content detected in: "${filePath}"`);
            return null;
          }
          
          return sanitizeHtml(rawContent);
      }
    }
    return null; // Page not found
  } catch (error) {
    // Don't log sensitive error details in production
    console.warn(`Error reading slide content for ${slug}, page ${page}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    return null;
  }
}