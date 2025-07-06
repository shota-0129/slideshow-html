import "server-only";

/**
 * Basic HTML sanitization for slide content
 * This is a simple implementation - for production, consider using DOMPurify
 */

const ALLOWED_TAGS = [
  'html', 'head', 'body', 'title', 'meta', 'link', 'style',
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'hr', 'img', 'a', 'strong', 'em',
  'code', 'pre', 'blockquote', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'tfoot', 'section', 'article', 'header',
  'footer', 'nav', 'aside', 'main'
];

/**
 * Checks if a tag is in the allowed list
 * @param tagName - The tag name to check
 * @returns true if the tag is allowed, false otherwise
 */
function isAllowedTag(tagName: string): boolean {
  return ALLOWED_TAGS.includes(tagName.toLowerCase());
}

const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?<\/iframe>/gi,
  /<object[\s\S]*?<\/object>/gi,
  /<embed[\s\S]*?>/gi,
  /<form[\s\S]*?<\/form>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /\son\w+\s*=/gi, // Event handlers like onclick, onload, etc. (more specific pattern)
];

/**
 * Basic sanitization of HTML content
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  let sanitized = html;

  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Remove potentially dangerous attributes (preserve data-* attributes for legitimate use)
  sanitized = sanitized.replace(/\s(on\w+|javascript|vbscript)\s*=\s*["'][^"']*["']/gi, '');

  // Additional validation: log warning for disallowed tags (for monitoring)
  const tagMatches = sanitized.match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g);
  if (tagMatches) {
    const disallowedTags = tagMatches
      .map(tag => tag.replace(/[<>/]/g, '').toLowerCase())
      .filter(tagName => !isAllowedTag(tagName));
    
    if (disallowedTags.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('Potentially disallowed HTML tags found:', [...new Set(disallowedTags)]);
    }
  }

  // Limit HTML size to prevent DoS
  if (sanitized.length > 1024 * 1024) { // 1MB limit
    console.warn('HTML content too large, truncating');
    sanitized = sanitized.substring(0, 1024 * 1024);
  }

  return sanitized;
}

/**
 * Validates if HTML content is safe for display
 * @param html - The HTML content to validate
 * @returns true if content appears safe, false otherwise
 */
export function validateHtmlContent(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // In development mode, be more permissive and only warn
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Check for suspicious patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(html)) {
      if (isDevelopment) {
        console.warn('Potentially dangerous HTML pattern detected, but allowing in development mode');
        continue; // Allow in development
      }
      return false; // Reject in production
    }
  }

  // Check for excessive nesting (potential DoS)
  const nestingLevel = (html.match(/<[^\/]/g) || []).length;
  if (nestingLevel > 1000) {
    console.warn('Excessive HTML nesting detected');
    return false;
  }

  return true;
}