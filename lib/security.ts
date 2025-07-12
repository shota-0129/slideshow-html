import "server-only";
import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure nonce for CSP
 * @returns Base64 encoded nonce string
 */
export function generateNonce(): string {
  return randomBytes(16).toString('base64');
}

/**
 * Generates a strict Content Security Policy with nonce support
 * @param nonce - The nonce to include in the CSP
 * @returns CSP header string
 */
export function generateCSP(nonce: string): string {
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self'`,
    `frame-src 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'none'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`
  ];
  
  return csp.join('; ');
}

/**
 * Generates comprehensive security headers
 * @param nonce - Optional nonce for CSP
 * @returns Object containing all security headers
 */
export function generateSecurityHeaders(nonce?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site'
  };

  if (nonce) {
    headers['Content-Security-Policy'] = generateCSP(nonce);
  }

  return headers;
}

/**
 * Context for passing nonce to client components
 */
export interface SecurityContext {
  nonce: string;
}