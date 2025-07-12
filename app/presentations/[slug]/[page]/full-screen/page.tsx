import { FullScreenViewer } from '@/components/full-screen-viewer';
import { getPresentationData, getSlideContent, getAllPresentations } from '@/lib/server-utils';
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

// 静的生成するパス
export async function generateStaticParams() {
  const presentations = getAllPresentations();
  const paths: { slug: string; page: string }[] = [];

  for (const p of presentations) {
    for (let i = 1; i <= p.totalPages; i++) {
      paths.push({ slug: p.slug, page: String(i) });
    }
  }
  return paths;
}

// dynamicParamsのデフォルト値はtrueなので、明示的な設定は不要
// 開発環境では動的パラメータが許可され、静的エクスポート時は自動的に制限される