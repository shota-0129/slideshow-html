import { formatSlugAsTitle, cn } from '@/lib/utils'

describe('Utils Functions', () => {
  describe('formatSlugAsTitle', () => {
    it('should convert kebab-case to Title Case', () => {
      expect(formatSlugAsTitle('web-development')).toBe('Web Development')
      expect(formatSlugAsTitle('casual-study-lt')).toBe('Casual Study Lt')
      expect(formatSlugAsTitle('eng-lt')).toBe('Eng Lt')
    })

    it('should handle single words', () => {
      expect(formatSlugAsTitle('react')).toBe('React')
      expect(formatSlugAsTitle('javascript')).toBe('Javascript')
    })

    it('should handle empty strings', () => {
      expect(formatSlugAsTitle('')).toBe('')
    })

    it('should handle strings without dashes', () => {
      expect(formatSlugAsTitle('presentation')).toBe('Presentation')
    })
  })

  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'hidden')).toBe('base conditional')
    })

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })
  })
})