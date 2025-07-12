import { z } from 'zod';

/**
 * Schema for validating presentation slug parameters
 */
export const SlugSchema = z.string()
  .min(1, 'Slug is required')
  .max(100, 'Slug too long')
  .regex(/^[a-zA-Z0-9-_]+$/, 'Invalid slug format - only letters, numbers, hyphens, and underscores allowed')
  .refine(val => !val.includes('..'), 'Path traversal not allowed')
  .refine(val => !val.startsWith('.'), 'Hidden directories not allowed')
  .refine(val => !val.endsWith('.'), 'Invalid slug format');

/**
 * Schema for validating page number parameters
 */
export const PageSchema = z.coerce.number()
  .int('Page must be an integer')
  .min(1, 'Page must be at least 1')
  .max(1000, 'Page number too high');

/**
 * Schema for thumbnail API request parameters
 */
export const ThumbnailParamsSchema = z.object({
  slug: SlugSchema,
  page: PageSchema
});

/**
 * Schema for presentation route parameters
 */
export const PresentationParamsSchema = z.object({
  slug: SlugSchema,
  page: PageSchema
});

/**
 * Schema for IP address validation
 */
export const IPAddressSchema = z.string()
  .ip({ version: 'v4' })
  .or(z.string().ip({ version: 'v6' }))
  .or(z.literal('unknown'));

/**
 * Schema for HTTP headers validation
 */
export const HeadersSchema = z.object({
  'user-agent': z.string().max(500).optional(),
  'x-forwarded-for': z.string().max(100).optional(),
  'x-real-ip': z.string().max(45).optional(),
  'accept': z.string().max(200).optional(),
  'accept-language': z.string().max(100).optional(),
  'referer': z.string().url().max(500).optional(),
}).passthrough(); // Allow other headers but validate known ones

/**
 * Schema for validating file paths
 */
export const FilePathSchema = z.string()
  .min(1, 'File path is required')
  .max(500, 'File path too long')
  .refine(val => !val.includes('..'), 'Path traversal not allowed')
  .refine(val => !val.includes('\0'), 'Null bytes not allowed')
  .refine(val => !/[<>:"|?*]/.test(val), 'Invalid characters in file path');

/**
 * Schema for validating HTML content size and basic structure
 */
export const HtmlContentSchema = z.string()
  .min(1, 'HTML content cannot be empty')
  .max(10 * 1024 * 1024, 'HTML content too large (max 10MB)')
  .refine(val => {
    // Check for basic HTML structure
    const hasOpeningTag = /<[^\/][^>]*>/.test(val);
    return hasOpeningTag;
  }, 'Content must contain valid HTML tags');

/**
 * Schema for environment variables validation
 */
export const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  THUMBNAIL_WIDTH: z.coerce.number().min(100).max(4000).default(1280),
  THUMBNAIL_HEIGHT: z.coerce.number().min(100).max(4000).default(720),
  THUMBNAIL_QUALITY: z.coerce.number().min(10).max(100).default(80),
  PUPPETEER_HEADLESS: z.enum(['true', 'false']).default('true'),
  CACHE_MAX_AGE: z.coerce.number().min(0).max(31536000).default(3600), // Max 1 year
  RATE_LIMIT_WINDOW: z.coerce.number().min(1000).max(3600000).default(60000), // 1 second to 1 hour
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(1).max(1000).default(10),
}).partial();

/**
 * Utility function to safely parse and validate data
 */
export function safeParseWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  errorMessage?: string
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: errorMessage || errorMessages.join('; ') };
    }
    return { success: false, error: errorMessage || 'Validation failed' };
  }
}

/**
 * Utility function for validating request parameters
 */
export function validateRequestParams(
  searchParams: URLSearchParams
): { success: true; data: { slug: string; page: number } } | { success: false; error: string } {
  const slug = searchParams.get('slug');
  const page = searchParams.get('page');

  if (!slug || !page) {
    return { success: false, error: 'Missing slug or page parameter' };
  }

  return safeParseWithSchema(
    ThumbnailParamsSchema,
    { slug, page },
    'Invalid request parameters'
  );
}

/**
 * Type exports for use in other modules
 */
export type ThumbnailParams = z.infer<typeof ThumbnailParamsSchema>;
export type PresentationParams = z.infer<typeof PresentationParamsSchema>;
export type ValidatedHeaders = z.infer<typeof HeadersSchema>;