import "server-only";
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Initialize JSDOM window for server-side DOMPurify
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Configure allowed tags for presentation content
const ALLOWED_TAGS = [
  'html', 'head', 'body', 'title', 'meta', 'link', 'style',
  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'br', 'hr', 'img', 'a', 'strong', 'em',
  'code', 'pre', 'blockquote', 'table', 'tr', 'td', 'th',
  'thead', 'tbody', 'tfoot', 'section', 'article', 'header',
  'footer', 'nav', 'aside', 'main', 'figure', 'figcaption',
  'time', 'mark', 'small', 'sub', 'sup', 'del', 'ins'
];

// Configure allowed attributes
const ALLOWED_ATTR = [
  'class', 'id', 'style', 'title', 'alt', 'src', 'href', 'target',
  'width', 'height', 'colspan', 'rowspan', 'data-*', 'aria-*',
  'role', 'lang', 'dir'
];

// Configure forbidden tags that should never be allowed
const FORBIDDEN_TAGS = [
  'script', 'object', 'embed', 'form', 'input', 'button', 
  'textarea', 'select', 'option', 'iframe', 'frame', 'frameset',
  'applet', 'base', 'meta[http-equiv]'
];

/**
 * Enhanced HTML sanitization using DOMPurify
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML content
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Size limit check before processing to prevent DoS
  if (html.length > 1024 * 1024) { // 1MB limit
    console.warn('HTML content too large, truncating');
    html = html.substring(0, 1024 * 1024);
  }

  try {
    // Configure DOMPurify for presentation content
    const sanitized = purify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      ALLOWED_TAGS: ALLOWED_TAGS,
      ALLOWED_ATTR: ALLOWED_ATTR,
      FORBID_TAGS: FORBIDDEN_TAGS,
      FORBID_ATTR: ['on*'], // Block all event handlers
      ALLOW_DATA_ATTR: true,
      ALLOW_ARIA_ATTR: true,
      USE_PROFILES: { html: true },
      // Security configurations
      SANITIZE_DOM: true,
      SANITIZE_NAMED_PROPS: true,
      KEEP_CONTENT: false, // Don't keep content of forbidden elements
      // Custom URL validation
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });

    // Additional validation in development mode
    if (process.env.NODE_ENV === 'development') {
      const removedElements = html.length - sanitized.length;
      if (removedElements > 100) { // Significant content removed
        console.warn(`DOMPurify removed ${removedElements} characters from HTML content`);
      }
    }

    return sanitized;
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // Fallback to empty string on error to maintain security
    return '';
  }
}

/**
 * Validates if HTML content is safe for display using DOMPurify
 * @param html - The HTML content to validate
 * @returns true if content appears safe, false otherwise
 */
export function validateHtmlContent(html: string): boolean {
  if (!html || typeof html !== 'string') {
    return false;
  }

  // Size limit check
  if (html.length > 1024 * 1024) { // 1MB limit
    console.warn('HTML content too large');
    return false;
  }

  try {
    // Use DOMPurify to test sanitization
    const sanitized = purify.sanitize(html, {
      WHOLE_DOCUMENT: true,
      ALLOWED_TAGS: ALLOWED_TAGS,
      ALLOWED_ATTR: ALLOWED_ATTR,
      FORBID_TAGS: FORBIDDEN_TAGS,
      FORBID_ATTR: ['on*']
    });

    // Check for excessive nesting (potential DoS)
    const nestingLevel = (html.match(/<[^\/]/g) || []).length;
    if (nestingLevel > 1000) {
      console.warn('Excessive HTML nesting detected');
      return false;
    }

    // In development mode, be more permissive but warn about removed content
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment && sanitized !== html) {
      const removedContent = html.length - sanitized.length;
      console.warn(`Potentially dangerous HTML detected. ${removedContent} characters would be removed by sanitization.`);
      return true; // Allow in development with warning
    }

    // In production, content must match sanitized version exactly
    return sanitized === html || isDevelopment;
  } catch (error) {
    console.error('HTML validation failed:', error);
    return false;
  }
}