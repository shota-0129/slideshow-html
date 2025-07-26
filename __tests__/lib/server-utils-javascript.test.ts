/**
 * @jest-environment node
 */

import fs from 'fs';
import path from 'path';
import { getSlideContent } from '@/lib/server-utils';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock path module partially to control resolve behavior
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn()
}));
const mockPath = path as jest.Mocked<typeof path>;

// Mock html-sanitizer functions to test different scenarios
jest.mock('@/lib/html-sanitizer', () => {
  const actual = jest.requireActual('@/lib/html-sanitizer');
  return {
    validateHtmlContent: jest.fn(() => true),
    sanitizeHtml: jest.fn((html: string) => {
      // Use the actual DOMPurify-based sanitizer for testing
      return actual.sanitizeHtml(html);
    })
  };
});

// Import mocked functions after setting up the mock
import { validateHtmlContent, sanitizeHtml } from '@/lib/html-sanitizer';
const mockValidateHtmlContent = validateHtmlContent as jest.MockedFunction<typeof validateHtmlContent>;
const mockSanitizeHtml = sanitizeHtml as jest.MockedFunction<typeof sanitizeHtml>;

describe('JavaScript Mode Server Utils', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    process.env = { ...originalEnv };
    delete process.env.ALLOW_JAVASCRIPT;
    
    // Mock file system operations
    mockFs.readdirSync.mockReturnValue([
      { name: '1.html', isDirectory: () => false, isFile: () => true } as any
    ]);
    mockFs.existsSync.mockImplementation((path: fs.PathLike) => {
      return String(path).includes('/public/slides/public/test-presentation');
    });
    
    // Mock path resolution for security checks - need to return paths that pass security validation
    const mockResolve = mockPath.resolve as jest.MockedFunction<typeof path.resolve>;
    mockResolve.mockImplementation((pathSegment: string) => {
      if (pathSegment.includes('public/slides/public/test-presentation') && !pathSegment.includes('.html')) {
        return '/app/public/slides/public/test-presentation';
      }
      if (pathSegment.includes('public/slides/private/test-presentation') && !pathSegment.includes('.html')) {
        return '/app/public/slides/private/test-presentation';
      }
      if (pathSegment.includes('public/slides') && !pathSegment.includes('test-presentation')) {
        return '/app/public/slides';
      }
      if (pathSegment.includes('1.html')) {
        return '/app/public/slides/public/test-presentation/1.html';
      }
      return pathSegment;
    });
    
    // Reset html-sanitizer mocks to use actual implementation
    mockValidateHtmlContent.mockReturnValue(true);
    mockSanitizeHtml.mockImplementation((html: string) => {
      // Use actual DOMPurify-based sanitization for security testing
      const actual = jest.requireActual('@/lib/html-sanitizer');
      return actual.sanitizeHtml(html);
    });
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });

  describe('JavaScript Mode Disabled (Default)', () => {
    it('should sanitize HTML and remove JavaScript when ALLOW_JAVASCRIPT is not set', () => {
      const htmlWithJS = `<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Slide</h1><button onclick="alert('hello')">Click me</button><script>console.log('This should be removed');</script></body></html>`;
      
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      const result = getSlideContent('test-presentation', 1);
      console.log('Test result:', result); // Debug log
      
      if (result === null) {
        // If still null, let's check what's happening
        expect(result).not.toBeNull();
      } else {
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onclick');
        expect(result).not.toContain('alert');
        expect(result).toContain('<h1>Test Slide</h1>');
      }
    });

    it('should sanitize HTML when ALLOW_JAVASCRIPT is explicitly false', () => {
      process.env.ALLOW_JAVASCRIPT = 'false';
      
      const htmlWithJS = `
        <!DOCTYPE html>
        <html>
        <head><title>Test</title></head>
        <body>
          <h1>Test Slide</h1>
          <script>document.body.style.background = 'red';</script>
          <div onclick="doSomething()">Interactive div</div>
        </body>
        </html>
      `;
      
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('onclick');
        expect(result).toContain('<h1>Test Slide</h1>');
        expect(result).toContain('Interactive div');
      }
    });
  });

  describe('JavaScript Mode Enabled', () => {
    it('should preserve JavaScript when ALLOW_JAVASCRIPT=true', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const htmlWithJS = `
        <!DOCTYPE html>
        <html>
        <head><title>Interactive Test</title></head>
        <body>
          <h1>Interactive Slide</h1>
          <button onclick="this.textContent='Clicked!'">Click me</button>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              console.log('JavaScript is working!');
            });
          </script>
        </body>
        </html>
      `;
      
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).toContain('<script>');
      expect(result).toContain('onclick');
      expect(result).toContain('console.log');
      expect(result).toContain('this.textContent=');
      expect(result).toContain('<h1>Interactive Slide</h1>');
      expect(result).toBe(htmlWithJS); // Should return original content
    });

    it('should preserve event handlers when ALLOW_JAVASCRIPT=true', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const htmlWithEvents = `
        <!DOCTYPE html>
        <html>
        <body>
          <div onmouseover="this.style.color='red'" onmouseout="this.style.color='black'">
            Hover me
          </div>
          <button onclick="alert('Button clicked!')" onkeydown="console.log('Key pressed')">
            Interactive Button
          </button>
        </body>
        </html>
      `;
      
      mockFs.readFileSync.mockReturnValue(htmlWithEvents);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).toContain('onmouseover');
      expect(result).toContain('onmouseout');
      expect(result).toContain('onclick');
      expect(result).toContain('onkeydown');
      expect(result).toContain('alert(');
      expect(result).toBe(htmlWithEvents);
    });

    it('should handle complex JavaScript content when ALLOW_JAVASCRIPT=true', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const complexHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
          <canvas id="myChart"></canvas>
          <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            const chart = new Chart(ctx, {
              type: 'bar',
              data: { labels: ['A', 'B', 'C'], datasets: [{data: [1, 2, 3]}] }
            });
            
            function updateChart() {
              chart.update();
            }
          </script>
          <button onclick="updateChart()">Update Chart</button>
        </body>
        </html>
      `;
      
      mockFs.readFileSync.mockReturnValue(complexHTML);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).toContain('chart.js');
      expect(result).toContain('new Chart(');
      expect(result).toContain('updateChart()');
      expect(result).toContain('chart.update()');
      expect(result).toBe(complexHTML);
    });
  });

  describe('File Size Validation in JavaScript Mode', () => {
    it('should reject files larger than 2MB even in JavaScript mode', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      // Create a large content string (over 2MB)
      const largeContent = 'a'.repeat(2 * 1024 * 1024 + 1);
      const htmlWithLargeContent = `<html><body>${largeContent}</body></html>`;
      
      mockFs.readFileSync.mockReturnValue(htmlWithLargeContent);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeNull();
    });

    it('should accept files under 2MB in JavaScript mode', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      // Create content just under 2MB
      const acceptableContent = 'a'.repeat(1024 * 1024); // 1MB
      const htmlContent = `<html><body><script>console.log('${acceptableContent}');</script></body></html>`;
      
      mockFs.readFileSync.mockReturnValue(htmlContent);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).toContain('<script>');
      expect(result).toBe(htmlContent);
    });
  });

  describe('Environment Variable Variations', () => {
    it('should treat "TRUE" (uppercase) as false (case sensitive)', () => {
      process.env.ALLOW_JAVASCRIPT = 'TRUE';
      
      const htmlWithJS = '<html><body><script>test</script></body></html>';
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      const result = getSlideContent('test-presentation', 1);
      
      // Should still sanitize because we check for exact 'true' string
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result).not.toContain('<script>');
      }
    });

    it('should treat "1" as false (only "true" string enables JS mode)', () => {
      process.env.ALLOW_JAVASCRIPT = '1';
      
      const htmlWithJS = '<html><body><script>test</script></body></html>';
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result).not.toContain('<script>');
      }
    });

    it('should treat empty string as false', () => {
      process.env.ALLOW_JAVASCRIPT = '';
      
      const htmlWithJS = '<html><body><script>test</script></body></html>';
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      const result = getSlideContent('test-presentation', 1);
      
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect(result).not.toContain('<script>');
      }
    });
  });

  describe('Logging Behavior', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should log when JavaScript mode is enabled', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const htmlWithJS = '<html><body><script>test</script></body></html>';
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      getSlideContent('test-presentation', 1);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'JavaScript mode enabled - preserving all content for test-presentation/1.html'
      );
    });

    it('should not log when JavaScript mode is disabled', () => {
      process.env.ALLOW_JAVASCRIPT = 'false';
      
      const htmlWithJS = '<html><body><script>test</script></body></html>';
      mockFs.readFileSync.mockReturnValue(htmlWithJS);
      
      getSlideContent('test-presentation', 1);
      
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('JavaScript mode enabled')
      );
    });
  });
});