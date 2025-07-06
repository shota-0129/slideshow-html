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
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
        { name: '2.html', isDirectory: () => false, isFile: () => true } as any,
        { name: '3.html', isDirectory: () => false, isFile: () => true } as any,
      ])

      const result = getPresentationData('test-presentation')
      expect(result.totalPages).toBe(3)
    })

    it('should return 0 pages for non-existent presentation', () => {
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory')
      })

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
      // Mock public directory listing
      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'presentation1', isDirectory: () => true } as any,
        { name: 'presentation2', isDirectory: () => true } as any,
        { name: 'file.txt', isDirectory: () => false } as any, // Should be ignored
      ])

      // Mock individual presentation directories
      mockFs.readdirSync
        .mockReturnValueOnce([ // presentation1
          { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
          { name: '2.html', isDirectory: () => false, isFile: () => true } as any,
        ])
        .mockReturnValueOnce([ // presentation2
          { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
        ])

      const result = getAllPresentations()
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ slug: 'presentation1', totalPages: 2 })
      expect(result[1]).toEqual({ slug: 'presentation2', totalPages: 1 })
    })

    it('should filter out presentations with 0 pages', () => {
      mockFs.readdirSync.mockReturnValueOnce([
        { name: 'valid-presentation', isDirectory: () => true } as any,
        { name: 'empty-presentation', isDirectory: () => true } as any,
      ])

      // Mock: valid presentation has files, empty doesn't
      mockFs.readdirSync
        .mockReturnValueOnce([
          { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
        ])
        .mockImplementationOnce(() => {
          throw new Error('ENOENT')
        })

      const result = getAllPresentations()
      expect(result).toHaveLength(1)
      expect(result[0].slug).toBe('valid-presentation')
    })
  })

  describe('getSlideContent', () => {
    it('should return slide content for valid inputs', () => {
      const mockContent = '<html><body><h1>Test Slide</h1></body></html>'
      
      // Mock directory listing
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
        { name: '2.html', isDirectory: () => false, isFile: () => true } as any,
      ])
      
      // Mock file reading
      mockFs.readFileSync.mockReturnValue(mockContent)

      const result = getSlideContent('test-presentation', 1)
      expect(result).toContain('<h1>Test Slide</h1>')
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
      mockFs.readdirSync.mockReturnValue([
        { name: '1.html', isDirectory: () => false, isFile: () => true } as any,
      ])

      const result = getSlideContent('test-presentation', 5) // Only 1 page exists
      expect(result).toBeNull()
    })

    it('should handle file read errors gracefully', () => {
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