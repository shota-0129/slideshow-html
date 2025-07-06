/**
 * @jest-environment node
 */


// Mock dependencies BEFORE any imports
jest.mock('puppeteer')
jest.mock('fs')
jest.mock('@/lib/server-utils')
jest.mock('@/lib/logger')

// Partially mock the rate limiter to make checkRateLimit replaceable for spying
jest.mock('@/lib/rate-limiter', () => {
  const actual = jest.requireActual('@/lib/rate-limiter')
  return {
    ...actual,
    checkRateLimit: jest.fn(actual.checkRateLimit)
  }
})

import { GET } from '@/app/api/thumb/route'
import { NextRequest } from 'next/server'
import { checkRateLimit, resetRateLimitMap } from '@/lib/rate-limiter'

import puppeteer from 'puppeteer'
import fs from 'fs'
import { getPresentationData } from '@/lib/server-utils'

const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>
const mockFs = fs as jest.Mocked<typeof fs>
const mockGetPresentationData = getPresentationData as jest.MockedFunction<typeof getPresentationData>
const mockCheckRateLimit = checkRateLimit as jest.MockedFunction<typeof checkRateLimit>

describe('/api/thumb', () => {
  let mockBrowser: any
  let mockPage: any

  beforeEach(() => {
    // 1. Clear the call history of all mocks
    jest.clearAllMocks()

    // 2. Completely reset the state of the rate limiter (★★★ Most Important ★★★)
    resetRateLimitMap()

    // 3. Configure the basic behavior for common mocks for each test
    mockGetPresentationData.mockReturnValue({ totalPages: 5 })
    
    // 4. Set up the mock for fs (Cause of the 500 errors)
    //    For success-case tests, we'll pretend the file exists.
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readFileSync = jest.fn().mockReturnValue('<html></html>')
    mockFs.promises = { readFile: jest.fn().mockResolvedValue('<html></html>') }
    
    // Mock Puppeteer
    mockPage = {
      setExtraHTTPHeaders: jest.fn(),
      setViewport: jest.fn(),
      setDefaultTimeout: jest.fn(),
      goto: jest.fn().mockResolvedValue(undefined),
      screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
      close: jest.fn().mockResolvedValue(undefined),
    }
    
    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn().mockResolvedValue(undefined),
    }
    
    mockPuppeteer.launch.mockResolvedValue(mockBrowser)
  })

  const createRequest = (searchParams: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/thumb')
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    
    return new NextRequest(url, {
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    })
  }

  describe('parameter validation', () => {
    it('should return 400 for missing slug parameter', async () => {
      const request = createRequest({ page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing slug or page parameter')
    })

    it('should return 400 for missing page parameter', async () => {
      const request = createRequest({ slug: 'test-presentation' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Missing slug or page parameter')
    })

    it('should return 400 for invalid slug with path traversal', async () => {
      const request = createRequest({ slug: '../../../evil', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid slug parameter')
    })

    it('should return 400 for invalid page number', async () => {
      const request = createRequest({ slug: 'test-presentation', page: 'invalid' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid page number')
    })

    it('should return 400 for negative page number', async () => {
      const request = createRequest({ slug: 'test-presentation', page: '-1' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid page number')
    })

    it('should return 400 for page number exceeding limit', async () => {
      const request = createRequest({ slug: 'test-presentation', page: '1001' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Invalid page number')
    })
  })

  describe('presentation validation', () => {
    it('should return 404 for non-existent presentation', async () => {
      mockGetPresentationData.mockReturnValue({ totalPages: 0 })
      
      const request = createRequest({ slug: 'non-existent', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('Presentation not found')
    })

    it('should return 400 for page number exceeding presentation pages', async () => {
      mockGetPresentationData.mockReturnValue({ totalPages: 3 })
      
      const request = createRequest({ slug: 'test-presentation', page: '5' })
      const response = await GET(request)
      
      expect(response.status).toBe(400)
      expect(await response.text()).toBe('Page number out of range')
    })

    it('should return 404 for non-existent slide file', async () => {
      mockFs.existsSync.mockReturnValue(false)
      
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(404)
      expect(await response.text()).toBe('Slide not found')
    })
  })

  describe('rate limiting', () => {
    it('should handle multiple requests when rate limit is bypassed', async () => {
      // The mock is already set up to call the real implementation
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      for (let i = 0; i < 5; i++) { // Less than the limit of 10
        const response = await GET(request)
        expect(response.status).toBe(200)
      }
      expect(mockCheckRateLimit).toHaveBeenCalledTimes(5)
    })

    it('should return 429 when rate limit is triggered', async () => {
      // This test uses the real checkRateLimit implementation via the mock
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      
      // The first 10 requests should succeed
      for (let i = 0; i < 10; i++) {
        const response = await GET(request)
        expect(response.status).toBe(200)
      }
      
      // The 11th request should be rate-limited and return a 429 error
      const finalResponse = await GET(request)
      expect(finalResponse.status).toBe(429)
    })
  })

  describe('thumbnail generation', () => {
    it('should generate thumbnail successfully', async () => {
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('image/jpeg')
      expect(response.headers.get('Cache-Control')).toContain('public')
      expect(mockPuppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({
        headless: true,
        args: expect.arrayContaining(['--no-sandbox', '--disable-setuid-sandbox']),
      }))
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'jpeg',
        quality: 80,
      })
    })

    it('should handle puppeteer errors gracefully', async () => {
      mockPuppeteer.launch.mockRejectedValue(new Error('Puppeteer error'))
      
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      expect(await response.text()).toBe('Error generating thumbnail')
    })

    it('should ensure browser cleanup on errors', async () => {
      mockPage.screenshot.mockRejectedValue(new Error('Screenshot error'))
      
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(500)
      expect(mockPage.close).toHaveBeenCalled()
      expect(mockBrowser.close).toHaveBeenCalled()
    })
  })

  describe('security features', () => {
    it('should set security headers on page', async () => {
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      await GET(request)
      
      expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalledWith({
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
      })
    })

    it('should set security headers on response', async () => {
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      const response = await GET(request)
      
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    })

    it('should validate file path to prevent traversal', async () => {
      const request = createRequest({ slug: 'valid-slug', page: '1' })
      const response = await GET(request)
      
      expect(response.status).toBe(200)
    })
  })

  describe('configuration options', () => {
    it('should use environment variables for configuration', async () => {
      // Set environment variables
      process.env.THUMBNAIL_WIDTH = '1920'
      process.env.THUMBNAIL_HEIGHT = '1080'
      process.env.THUMBNAIL_QUALITY = '90'
      process.env.PUPPETEER_HEADLESS = 'false'
      
      const request = createRequest({ slug: 'test-presentation', page: '1' })
      await GET(request)
      
      expect(mockPage.setViewport).toHaveBeenCalledWith({
        width: 1920,
        height: 1080,
      })
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'jpeg',
        quality: 90,
      })
      expect(mockPuppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({
        headless: false,
      }))
      
      // Clean up environment variables
      delete process.env.THUMBNAIL_WIDTH
      delete process.env.THUMBNAIL_HEIGHT
      delete process.env.THUMBNAIL_QUALITY
      delete process.env.PUPPETEER_HEADLESS
    })
  })
})