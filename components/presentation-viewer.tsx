'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { formatSlugAsTitle } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Home, Maximize } from 'lucide-react';
import { useEffect, useRef, useState, useLayoutEffect, useCallback } from 'react';

interface PresentationViewerProps {
  slug: string;
  currentPage: number;
  totalPages: number;
  slideContent: string;
}

export function PresentationViewer({
  slug,
  currentPage,
  totalPages,
  slideContent,
}: PresentationViewerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate the correct scale for the slide to fit the container
  useLayoutEffect(() => {
    const calculateScale = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const slideWidth = 1280; // Slide's native width
        const slideHeight = 720; // Slide's native height
        const scaleX = clientWidth / slideWidth;
        const scaleY = clientHeight / slideHeight;
        setScale(Math.min(scaleX, scaleY));
      }
    };
    
    calculateScale();
    const resizeObserver = new ResizeObserver(calculateScale);
    const currentContainer = containerRef.current;
    
    if (currentContainer) {
      resizeObserver.observe(currentContainer);
    }
    
    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Set up keyboard navigation with useCallback for performance
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const navigationKeys = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Enter', ' '];
    
    if (navigationKeys.includes(e.key)) {
      e.preventDefault();
      
      // Next slide: Right arrow, Down arrow, Enter, Space
      if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(e.key) && currentPage < totalPages) {
        router.push(`/presentations/${slug}/${currentPage + 1}`);
      }
      // Previous slide: Left arrow, Up arrow
      else if (['ArrowLeft', 'ArrowUp'].includes(e.key) && currentPage > 1) {
        router.push(`/presentations/${slug}/${currentPage - 1}`);
      }
    }
  }, [currentPage, totalPages, slug, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-2 md:p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 text-gray-800 dark:text-gray-200 shrink-0">
        <h1 className="text-lg md:text-xl font-bold truncate">
          {formatSlugAsTitle(slug)}
        </h1>
        <div className="flex items-center gap-3 md:gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" title="ホームに戻る">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <span className="font-mono text-sm">
            {currentPage} / {totalPages}
          </span>
        </div>
      </header>

      {/* Main Content: Scaled slide */}
      <main
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center bg-gray-300 dark:bg-black overflow-hidden p-2"
      >
        <div
          style={{
            width: '1280px',
            height: '720px',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <iframe
            srcDoc={slideContent}
            className="w-full h-full border-0"
            title={`Slide ${currentPage}`}
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>
      </main>

      {/* Footer (Navigation) */}
      <footer className="flex items-center justify-center p-2 md:p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 gap-2 md:gap-4 shrink-0">
        <Link
          href={`/presentations/${slug}/${currentPage - 1}`}
          className={currentPage <= 1 ? 'pointer-events-none' : ''}
          aria-disabled={currentPage <= 1}
        >
          <Button variant="outline" disabled={currentPage <= 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            前へ
          </Button>
        </Link>
        <Link
          href={`/presentations/${slug}/${currentPage}/full-screen`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" title="全画面で表示">
            <Maximize className="h-5 w-5" />
          </Button>
        </Link>
        <Link
          href={`/presentations/${slug}/${currentPage + 1}`}
          className={currentPage >= totalPages ? 'pointer-events-none' : ''}
          aria-disabled={currentPage >= totalPages}
        >
          <Button variant="outline" disabled={currentPage >= totalPages}>
            次へ
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </footer>
    </div>
  );
}