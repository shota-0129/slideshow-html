import { PresentationViewer } from "@/components/presentation-viewer";
import { getPresentationData, getSlideContent } from "@/lib/server-utils"; // server-utilsからインポート
import { getAllPresentations } from "@/lib/server-utils"; // generateStaticParamsで使用
import { notFound } from "next/navigation";

type Params = Promise<{ slug: string; page: string }>;

export default async function PresentationPage({ params }: { params: Params }) {
  const { slug, page } = await params;
  const currentPage = parseInt(page, 10);

  // サーバーサイドでスライドデータを取得
  const { totalPages } = getPresentationData(slug);
  const slideContent = getSlideContent(slug, currentPage);

  if (totalPages === 0 || !slideContent) {
    notFound();
  }

  return (
    <PresentationViewer
      slug={slug}
      currentPage={currentPage}
      totalPages={totalPages}
      slideContent={slideContent} // スライドの内容をコンポーネントに渡す
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

export const dynamicParams = false;
