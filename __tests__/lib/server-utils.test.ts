/**
 * @jest-environment node
 */
import fs from 'fs'
import path from 'path'
import { getPresentationData, getAllPresentations, getSlideContent } from '@/lib/server-utils'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

describe('Server Utils', () => {
  const originalCwd = process.cwd()
  
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock process.cwd() to return a predictable path
    jest.spyOn(process, 'cwd').mockReturnValue('/test/project')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getPresentationData', () => {
    it('should return correct page count for valid presentation', () => {
      // Mock directory structure
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        return String(path).includes('/public/slides/public/test-presentation')
      })
      
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
        { name: '2.html', isDirectory: () => false, isFile: () => true } as any,
        { name: '3.html', isDirectory: () => false, isFile: () => true } as any,
      ])

      const result = getPresentationData('test-presentation')
      expect(result.totalPages).toBe(3)
    })

    it('should return 0 pages for non-existent presentation', () => {
      mockFs.existsSync.mockReturnValue(false)
      
      const result = getPresentationData('non-existent')
      expect(result.totalPages).toBe(0)
    })

    it('should reject invalid slugs', () => {
      const result = getPresentationData('../../../evil')
      expect(result.totalPages).toBe(0)
    })

    it('should reject slugs with path traversal attempts', () => {
      const result = getPresentationData('valid-name/../../../etc/passwd')
      expect(result.totalPages).toBe(0)
    })

    it('should handle empty slug input', () => {
      const result = getPresentationData('')
      expect(result.totalPages).toBe(0)
    })

    it('should filter out non-HTML files', () => {
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        return String(path).includes('/public/slides/public/test-presentation')
      })
      
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
        { name: '2.txt', isDirectory: () => false, isFile: () => true } as any,
        { name: '.hidden', isDirectory: () => false, isFile: () => true } as any,
        { name: 'script.js', isDirectory: () => false, isFile: () => true } as any,
        { name: '3.html', isDirectory: () => false, isFile: () => true } as any,
      ])

      const result = getPresentationData('test-presentation')
      expect(result.totalPages).toBe(2) // Only count .html files
    })
  })

  describe('getAllPresentations', () => {
    it('should return list of presentations with page counts', () => {
      // Mock existence of public slides directory
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path)
        if (pathStr.includes('/public/slides/public')) return true
        if (pathStr.includes('/public/slides/private')) return false
        if (pathStr.includes('/public/slides/public/presentation1')) return true
        if (pathStr.includes('/public/slides/public/presentation2')) return true
        return false
      })
      
      // Mock public directory listing
      mockFs.readdirSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path)
        if (pathStr.endsWith('/public/slides/public')) {
          return [
            { name: 'presentation1', isDirectory: () => true } as any,
            { name: 'presentation2', isDirectory: () => true } as any,
            { name: 'file.txt', isDirectory: () => false } as any, // Should be ignored
          ]
        }
        if (pathStr.includes('presentation1')) {
          return [
            { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
            { name: '2.html', isDirectory: () => false, isFile: () => true } as any,
          ]
        }
        if (pathStr.includes('presentation2')) {
          return [
            { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
          ]
        }
        return []
      })

      const result = getAllPresentations()
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ slug: 'presentation1', totalPages: 2 })
      expect(result[1]).toEqual({ slug: 'presentation2', totalPages: 1 })
    })

    it('should filter out presentations with 0 pages', () => {
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path)
        if (pathStr.includes('/public/slides/public')) return true
        if (pathStr.includes('/public/slides/private')) return false
        if (pathStr.includes('/public/slides/public/valid-presentation')) return true
        if (pathStr.includes('/public/slides/public/empty-presentation')) return true
        return false
      })
      
      mockFs.readdirSync.mockImplementation((path: fs.PathLike) => {
        const pathStr = String(path)
        if (pathStr.endsWith('/public/slides/public')) {
          return [
            { name: 'valid-presentation', isDirectory: () => true } as any,
            { name: 'empty-presentation', isDirectory: () => true } as any,
          ]
        }
        if (pathStr.includes('valid-presentation')) {
          return [
            { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
          ]
        }
        if (pathStr.includes('empty-presentation')) {
          return [] // Empty directory
        }
        return []
      })

      const result = getAllPresentations()
      expect(result).toHaveLength(1)
      expect(result[0]?.slug).toBe('valid-presentation')
    })
  })

  describe('getSlideContent', () => {
    beforeEach(() => {
      // Set development mode for more permissive validation
      (process.env as any).NODE_ENV = 'development'
    })

    afterEach(() => {
      // Reset to test mode
      (process.env as any).NODE_ENV = 'test'
    })

    it('should return slide content for valid inputs', () => {
      // Use a complete, valid HTML document that will pass DOMPurify validation
      const mockContent = '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Slide</h1><p>Content</p></body></html>'
      
      // Mock file existence check
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        return String(path).includes('/public/slides/public/test-presentation')
      })
      
      // Mock directory listing for the presentation directory
      mockFs.readdirSync.mockImplementation((dirPath: any) => {
        // Return different results based on the directory being read
        if (dirPath.includes('test-presentation')) {
          return [
            { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
            { name: '2.html', isDirectory: () => false, isFile: () => true } as any,
          ]
        }
        return []
      })
      
      // Mock file reading
      mockFs.readFileSync.mockReturnValue(mockContent)

      const result = getSlideContent('test-presentation', 1)
      expect(result).not.toBeNull()
      expect(result).toContain('<h1>Test Slide</h1>')
      expect(result).toContain('<p>Content</p>')
    })

    it('should return null for invalid page numbers', () => {
      expect(getSlideContent('test-presentation', 0)).toBeNull()
      expect(getSlideContent('test-presentation', -1)).toBeNull()
      expect(getSlideContent('test-presentation', 1001)).toBeNull()
      expect(getSlideContent('test-presentation', NaN)).toBeNull()
    })

    it('should return null for invalid slugs', () => {
      expect(getSlideContent('', 1)).toBeNull()
      expect(getSlideContent('../../../evil', 1)).toBeNull()
      expect(getSlideContent('valid/../invalid', 1)).toBeNull()
    })

    it('should return null for page out of range', () => {
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        return String(path).includes('/public/slides/public/test-presentation')
      })
      
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
      ])

      const result = getSlideContent('test-presentation', 5) // Only 1 page exists
      expect(result).toBeNull()
    })

    it('should handle file read errors gracefully', () => {
      mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
        return String(path).includes('/public/slides/public/test-presentation')
      })
      
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
      ])
      
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error')
      })

      const result = getSlideContent('test-presentation', 1)
      expect(result).toBeNull()
    })
  })
})