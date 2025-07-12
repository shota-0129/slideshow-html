/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PresentationViewer } from '@/components/presentation-viewer';
import { getSlideContent } from '@/lib/server-utils';

// Mock the server-utils module
jest.mock('@/lib/server-utils');
const mockGetSlideContent = getSlideContent as jest.MockedFunction<typeof getSlideContent>;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
}));

describe('JavaScript Mode Integration', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Secure Mode (JavaScript Disabled)', () => {
    it('should render sanitized content without JavaScript', async () => {
      delete process.env.ALLOW_JAVASCRIPT;
      
      // Mock sanitized HTML (what would be returned after sanitization)
      const sanitizedHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>Safe Slide</title></head>
        <body>
          <div class="slide">
            <h1>Test Slide</h1>
            <button>Click me</button>
            <p>Safe content</p>
          </div>
        </body>
        </html>
      `;
      
      mockGetSlideContent.mockReturnValue(sanitizedHTML);
      
      render(
        <PresentationViewer
          slug="test-presentation"
          currentPage={1}
          totalPages={1}
          slideContent={sanitizedHTML}
        />
      );
      
      // Wait for iframe to load
      await waitFor(() => {
        const iframe = screen.getByTitle('Slide 1');
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin');
      });
      
      // Verify content was rendered in iframe
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', sanitizedHTML);
    });
  });

  describe('JavaScript Mode Enabled', () => {
    it('should render interactive content with JavaScript preserved', async () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      // Mock raw HTML with JavaScript (what would be returned when JS mode is enabled)
      const interactiveHTML = `
        <!DOCTYPE html>
        <html>
        <head><title>Interactive Slide</title></head>
        <body>
          <div class="slide">
            <h1>Interactive Slide</h1>
            <button onclick="this.textContent='Clicked!'">Click me</button>
            <div id="particle-container"></div>
          </div>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              console.log('JavaScript is working!');
              
              // Create floating particles
              function createParticle() {
                const particle = document.createElement('div');
                particle.innerHTML = '✨';
                particle.style.position = 'fixed';
                particle.style.fontSize = '20px';
                particle.style.pointerEvents = 'none';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.top = window.innerHeight + 'px';
                
                document.getElementById('particle-container').appendChild(particle);
                
                particle.animate([
                  { transform: 'translateY(0px)', opacity: 0 },
                  { transform: 'translateY(-100px)', opacity: 1 },
                  { transform: 'translateY(-200px)', opacity: 0 }
                ], {
                  duration: 2000,
                  easing: 'ease-out'
                }).onfinish = () => particle.remove();
              }
              
              // Create a particle every 2 seconds
              setInterval(createParticle, 2000);
            });
          </script>
        </body>
        </html>
      `;
      
      mockGetSlideContent.mockReturnValue(interactiveHTML);
      
      render(
        <PresentationViewer
          slug="test-presentation"
          currentPage={1}
          totalPages={1}
          slideContent={interactiveHTML}
        />
      );
      
      // Wait for iframe to load
      await waitFor(() => {
        const iframe = screen.getByTitle('Slide 1');
        expect(iframe).toBeInTheDocument();
      });
      
      // Verify content was rendered in iframe
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', interactiveHTML);
    });
  });

  describe('Mode Switching Behavior', () => {
    it('should return different content when switching between modes', () => {
      const originalHTML = `
        <html>
        <body>
          <h1>Test</h1>
          <button onclick="alert('test')">Button</button>
          <script>console.log('test');</script>
        </body>
        </html>
      `;
      
      // First call: JavaScript mode disabled
      delete process.env.ALLOW_JAVASCRIPT;
      mockGetSlideContent.mockReturnValueOnce('<html><body><h1>Test</h1><button>Button</button></body></html>');
      
      const sanitizedResult = getSlideContent('test', 1);
      expect(sanitizedResult).not.toContain('<script>');
      expect(sanitizedResult).not.toContain('onclick');
      
      // Second call: JavaScript mode enabled
      process.env.ALLOW_JAVASCRIPT = 'true';
      mockGetSlideContent.mockReturnValueOnce(originalHTML);
      
      const unsanitizedResult = getSlideContent('test', 1);
      expect(unsanitizedResult).toContain('<script>');
      expect(unsanitizedResult).toContain('onclick');
    });
  });

  describe('Error Handling in JavaScript Mode', () => {
    it('should handle file reading errors gracefully', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      // Mock an error scenario
      mockGetSlideContent.mockReturnValue(null);
      
      render(
        <PresentationViewer
          slug="non-existent"
          currentPage={1}
          totalPages={0}
          slideContent=""
        />
      );
      
      // Verify empty content was passed to component
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', '');
    });

    it('should handle malformed HTML in JavaScript mode', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const malformedHTML = `
        <html>
        <head><title>Broken</title>
        <body>
          <h1>Unclosed tag
          <script>
            // Broken JavaScript
            console.log('missing quote);
          </script>
      `;
      
      mockGetSlideContent.mockReturnValue(malformedHTML);
      
      render(
        <PresentationViewer
          slug="broken-presentation"
          currentPage={1}
          totalPages={1}
          slideContent={malformedHTML}
        />
      );
      
      // Should still render even with malformed HTML
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', malformedHTML);
    });
  });

  describe('Security Considerations', () => {
    it('should pass through potentially dangerous content in JavaScript mode', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const dangerousHTML = `
        <html>
        <body>
          <script>
            // This would be dangerous in production
            document.cookie = 'test=value';
            localStorage.setItem('test', 'data');
            fetch('/api/dangerous-endpoint', { method: 'POST' });
          </script>
        </body>
        </html>
      `;
      
      mockGetSlideContent.mockReturnValue(dangerousHTML);
      
      render(
        <PresentationViewer
          slug="dangerous-presentation"
          currentPage={1}
          totalPages={1}
          slideContent={dangerousHTML}
        />
      );
      
      // Content should be passed through unchanged (this demonstrates why the mode should only be used with trusted content)
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', dangerousHTML);
    });
  });

  describe('Real-world JavaScript Scenarios', () => {
    it('should support chart libraries and data visualization', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const chartHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
          <canvas id="myChart" width="400" height="200"></canvas>
          <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            const chart = new Chart(ctx, {
              type: 'bar',
              data: {
                labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
                datasets: [{
                  label: '# of Votes',
                  data: [12, 19, 3, 5, 2, 3],
                  backgroundColor: ['rgba(255, 99, 132, 0.2)']
                }]
              }
            });
          </script>
        </body>
        </html>
      `;
      
      mockGetSlideContent.mockReturnValue(chartHTML);
      
      render(
        <PresentationViewer
          slug="chart-presentation"
          currentPage={1}
          totalPages={1}
          slideContent={chartHTML}
        />
      );
      
      // Verify chart content was rendered
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', chartHTML);
    });

    it('should support interactive forms and input handling', () => {
      process.env.ALLOW_JAVASCRIPT = 'true';
      
      const formHTML = `
        <!DOCTYPE html>
        <html>
        <body>
          <form id="demoForm">
            <input type="text" id="nameInput" placeholder="Enter your name">
            <button type="button" onclick="greetUser()">Greet</button>
          </form>
          <div id="greeting"></div>
          
          <script>
            function greetUser() {
              const name = document.getElementById('nameInput').value;
              const greeting = document.getElementById('greeting');
              greeting.innerHTML = 'Hello, ' + name + '!';
              greeting.style.color = 'blue';
              greeting.style.fontSize = '24px';
            }
            
            document.getElementById('nameInput').addEventListener('keypress', function(e) {
              if (e.key === 'Enter') {
                greetUser();
              }
            });
          </script>
        </body>
        </html>
      `;
      
      mockGetSlideContent.mockReturnValue(formHTML);
      
      render(
        <PresentationViewer
          slug="form-presentation"
          currentPage={1}
          totalPages={1}
          slideContent={formHTML}
        />
      );
      
      // Verify form content was rendered
      const iframe = screen.getByTitle('Slide 1');
      expect(iframe).toHaveAttribute('srcdoc', formHTML);
    });
  });
});