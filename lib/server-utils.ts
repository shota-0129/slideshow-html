import "server-only";
import fs from 'fs';
import path from 'path';

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Recursively finds all .html files within a given directory.
 * @param dirPath - The absolute path to the directory to search.
 * @returns An array of full file paths for all found .html files.
 */
function getHtmlFilePaths(dirPath: string): string[] {
    let htmlFiles: string[] = [];
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                htmlFiles = htmlFiles.concat(getHtmlFilePaths(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    } catch (e) {
        // Directory may not exist, return empty array.
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
    const presentationPath = path.join(process.cwd(), 'public', slug);
    const htmlFiles = getSortedHtmlFilePaths(presentationPath);
    return { totalPages: htmlFiles.length };
  } catch (error) {
    console.error(`Failed to get presentation data for slug: "${slug}"`, error);
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
    const presentationPath = path.join(process.cwd(), 'public', slug);
    const allHtmlFiles = getSortedHtmlFilePaths(presentationPath);
    
    // Check if the requested page is within the valid range.
    if (page > 0 && page <= allHtmlFiles.length) {
        const filePath = allHtmlFiles[page - 1]; // Convert 1-based page to 0-based index
        if (filePath) {
          return fs.readFileSync(filePath, 'utf-8');
      }
    }
    return null; // Page not found
  } catch (error) {
    console.error(`Error reading slide content for ${slug}, page ${page}:`, error);
    return null;
  }
}