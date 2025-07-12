/**
 * @jest-environment node
 */
import { sanitizeHtml, validateHtmlContent } from '@/lib/html-sanitizer'

describe('HTML Sanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should allow safe HTML content', () => {
      const safeHtml = '<div><h1>Title</h1><p>Content</p></div>'
      const result = sanitizeHtml(safeHtml)
      // DOMPurify wraps fragments in full HTML document structure
      expect(result).toContain(safeHtml)
      expect(result).toContain('<html>')
      expect(result).toContain('<body>')
    })

    it('should remove script tags', () => {
      const unsafeHtml = '<div><script>alert("xss")</script><p>Content</p></div>'
      const result = sanitizeHtml(unsafeHtml)
      expect(result).not.toContain('<script>')
      expect(result).not.toContain('alert')
      expect(result).toContain('<p>Content</p>')
    })

    it('should remove iframe tags', () => {
      const unsafeHtml = '<div><iframe src="evil.com"></iframe><p>Content</p></div>'
      const result = sanitizeHtml(unsafeHtml)
      expect(result).not.toContain('<iframe>')
      expect(result).toContain('<p>Content</p>')
    })

    it('should remove javascript: URLs', () => {
      const unsafeHtml = '<a href="javascript:alert(\'xss\')">Link</a>'
      const result = sanitizeHtml(unsafeHtml)
      expect(result).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const unsafeHtml = '<div onclick="alert(\'xss\')">Click me</div>'
      const result = sanitizeHtml(unsafeHtml)
      expect(result).not.toContain('onclick')
      expect(result).toContain('Click me')
    })

    it('should handle empty or invalid input', () => {
      expect(sanitizeHtml('')).toBe('')
      expect(sanitizeHtml(null as any)).toBe('')
      expect(sanitizeHtml(undefined as any)).toBe('')
    })

    it('should truncate very large content', () => {
      const largeContent = 'a'.repeat(1024 * 1024 + 100) // Over 1MB
      const result = sanitizeHtml(largeContent)
      // Account for HTML wrapper tags added by DOMPurify
      const WRAPPER_LENGTH = '<html><head></head><body></body></html>'.length
      expect(result.length).toBe(1024 * 1024 + WRAPPER_LENGTH)
    })
  })

  describe('validateHtmlContent', () => {
    beforeEach(() => {
      // Set production mode for strict validation
      (process.env as any).NODE_ENV = 'production'
    })

    afterEach(() => {
      // Reset to test mode
      (process.env as any).NODE_ENV = 'test'
    })

    it('should validate safe HTML content', () => {
      const safeHtml = '<html><head><title>Test</title></head><body><div><h1>Title</h1></div></body></html>'
      expect(validateHtmlContent(safeHtml)).toBe(true)
    })

    it('should reject script tags in production', () => {
      const unsafeHtml = '<div><script>alert("xss")</script></div>'
      expect(validateHtmlContent(unsafeHtml)).toBe(false)
    })

    it('should reject iframe tags in production', () => {
      const unsafeHtml = '<div><iframe src="evil.com"></iframe></div>'
      expect(validateHtmlContent(unsafeHtml)).toBe(false)
    })

    it('should reject excessive nesting', () => {
      const deeplyNested = '<div>'.repeat(1001) + 'content' + '</div>'.repeat(1001)
      expect(validateHtmlContent(deeplyNested)).toBe(false)
    })

    it('should handle empty or invalid input', () => {
      expect(validateHtmlContent('')).toBe(false)
      expect(validateHtmlContent(null as any)).toBe(false)
      expect(validateHtmlContent(undefined as any)).toBe(false)
    })

    it('should be more permissive in development mode', () => {
      (process.env as any).NODE_ENV = 'development'
      const unsafeHtml = '<div><script>console.log("debug")</script></div>'
      expect(validateHtmlContent(unsafeHtml)).toBe(true)
    })
  })
})