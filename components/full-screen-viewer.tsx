'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';

interface FullScreenViewerProps {
  slug: string;
  currentPage: number;
  totalPages: number;
  slideContent: string;
}

export function FullScreenViewer({
  slug,
  currentPage,
  totalPages,
  slideContent,
}: FullScreenViewerProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Calculate the correct scale for the slide to fit the screen
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
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Set up keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'Enter', ' ', 'ArrowLeft', 'ArrowUp', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      if (['ArrowRight', 'ArrowDown', 'Enter', ' '].includes(e.key)) {
        if (currentPage < totalPages) {
          router.push(`/presentations/${slug}/${currentPage + 1}/full-screen`);
        } else {
          // Close full-screen when on last slide and pressing next keys
          router.push(`/presentations/${slug}/${currentPage}`);
        }
      } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
        if (currentPage > 1) {
          router.push(`/presentations/${slug}/${currentPage - 1}/full-screen`);
        }
      } else if (e.key === 'Escape') {
        window.close(); // Try to close the tab
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, slug, router]);

  const goToNextSlide = () => {
      if (currentPage < totalPages) {
          router.push(`/presentations/${slug}/${currentPage + 1}/full-screen`);
      } else {
          // Close full-screen when on last slide and clicking
          router.push(`/presentations/${slug}/${currentPage}`);
      }
  }

  return (
    <div 
      ref={containerRef}
      className="w-screen h-screen bg-black flex items-center justify-center cursor-pointer overflow-hidden"
      onClick={goToNextSlide}
      title="次へ進む"
    >
      {/* This wrapper is scaled to fit the screen */}
      <div style={{
          width: '1280px',
          height: '720px',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
      }}>
        <iframe
            srcDoc={slideContent}
            className="w-full h-full border-0"
            title={`Slide ${currentPage} (Full Screen)`}
            sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}
