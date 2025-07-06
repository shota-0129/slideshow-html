/**
 * @jest-environment node
 */

import { sanitizeHtml } from '@/lib/html-sanitizer';

describe('HTML Sanitization Security Regression Tests', () => {
  // Test cases to ensure CodeQL vulnerabilities are fixed
  
  it('should remove script tags completely', () => {
    const maliciousHTML = '<div>Safe content</div><script>alert("XSS")</script><p>More safe content</p>';
    const result = sanitizeHtml(maliciousHTML);
    
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert(');
    expect(result).toContain('Safe content');
    expect(result).toContain('More safe content');
  });

  it('should remove script tags with various spacing patterns', () => {
    const testCases = [
      '<script >alert("XSS")</script>',
      '<script\t>alert("XSS")</script>',
      '<script\n>alert("XSS")</script>',
      '< script>alert("XSS")</script>',
      '<SCRIPT>alert("XSS")</SCRIPT>',
    ];

    testCases.forEach((testCase) => {
      const result = sanitizeHtml(testCase);
      expect(result).not.toContain('alert(');
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<SCRIPT');
    });
  });

  it('should remove all event handlers', () => {
    const eventHandlers = [
      'onclick="alert(1)"',
      'onmouseover="alert(2)"',
      'onload="alert(3)"',
      'onerror="alert(4)"',
      'onkeydown="alert(5)"',
      'onfocus="alert(6)"',
    ];

    eventHandlers.forEach((handler) => {
      const maliciousHTML = `<div ${handler}>Content</div>`;
      const result = sanitizeHtml(maliciousHTML);
      
      expect(result).not.toContain('alert(');
      expect(result).not.toContain(handler);
      expect(result).toContain('Content');
    });
  });

  it('should remove javascript: protocol in URLs', () => {
    const maliciousHTML = '<a href="javascript:alert(\'XSS\')">Click me</a>';
    const result = sanitizeHtml(maliciousHTML);
    
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert(');
    expect(result).toContain('Click me');
  });

  it('should handle nested script tags', () => {
    const maliciousHTML = '<div><script>var x = "<script>alert(1)</script>"</script></div>';
    const result = sanitizeHtml(maliciousHTML);
    
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert(');
    expect(result).toContain('<div>');
  });

  it('should remove iframe and object tags', () => {
    const maliciousHTML = `
      <div>Safe content</div>
      <iframe src="javascript:alert('XSS')"></iframe>
      <object data="malicious.swf"></object>
      <embed src="malicious.swf">
    `;
    const result = sanitizeHtml(maliciousHTML);
    
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('<object');
    expect(result).not.toContain('<embed');
    expect(result).not.toContain('javascript:');
    expect(result).toContain('Safe content');
  });

  it('should preserve safe HTML elements and attributes', () => {
    const safeHTML = `
      <div class="container" id="main">
        <h1>Title</h1>
        <p style="color: blue;">Paragraph with <strong>bold</strong> text</p>
        <img src="/safe-image.jpg" alt="Safe image" width="100" height="100">
        <a href="https://example.com" target="_blank">Safe link</a>
      </div>
    `;
    const result = sanitizeHtml(safeHTML);
    
    expect(result).toContain('<div class="container" id="main">');
    expect(result).toContain('<h1>Title</h1>');
    expect(result).toContain('<strong>bold</strong>');
    expect(result).toContain('src="/safe-image.jpg"');
    expect(result).toContain('href="https://example.com"');
    expect(result).toContain('style="color: blue;"');
  });

  it('should handle malformed HTML gracefully', () => {
    const malformedHTML = '<div><script>alert(1)<div>content</div></script></div>';
    const result = sanitizeHtml(malformedHTML);
    
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert(');
    expect(result).toContain('content');
  });

  it('should prevent DOM clobbering attacks', () => {
    const clobberingHTML = '<form id="document"><input name="domain"></form>';
    const result = sanitizeHtml(clobberingHTML);
    
    // Forms should be removed as they're in FORBIDDEN_TAGS
    expect(result).not.toContain('<form');
    expect(result).not.toContain('<input');
  });

  it('should handle very large input safely', () => {
    // Test with content just under the 1MB limit
    const largeContent = 'a'.repeat(1024 * 1024 - 100);
    const largeHTML = `<div>${largeContent}</div>`;
    
    const result = sanitizeHtml(largeHTML);
    expect(result).toContain('<div>');
    expect(result.length).toBeLessThanOrEqual(1024 * 1024);
  });

  it('should truncate extremely large input', () => {
    // Test with content over the 1MB limit
    const veryLargeContent = 'a'.repeat(1024 * 1024 + 1000);
    const veryLargeHTML = `<div>${veryLargeContent}</div>`;
    
    const result = sanitizeHtml(veryLargeHTML);
    expect(result.length).toBeLessThanOrEqual(1024 * 1024);
  });
});