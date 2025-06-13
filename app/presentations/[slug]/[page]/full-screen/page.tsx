import { FullScreenViewer } from '@/components/full-screen-viewer';
import { getPresentationData, getSlideContent } from '@/lib/server-utils';
import { notFound } from 'next/navigation';

type Params = Promise<{ slug: string; page: string }>;

export default async function FullScreenPage({ params }: { params: Params }) {
  const { slug, page } = await params;
  const currentPage = parseInt(page, 10);

  // Fetch total pages and the specific slide content on the server
  const { totalPages } = getPresentationData(slug);
  const slideContent = getSlideContent(slug, currentPage);

  // If the presentation or the specific page doesn't exist, show a 404 error.
  if (totalPages === 0 || !slideContent) {
    notFound();
  }

  // Pass the data to the client component for interactive viewing.
  return (
    <FullScreenViewer
      slug={slug}
      currentPage={currentPage}
      totalPages={totalPages}
      slideContent={slideContent}
    />
  );
}