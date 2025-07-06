import { PresentationViewer } from "@/components/presentation-viewer";
import { getPresentationData, getSlideContent } from "@/lib/server-utils"; // server-utilsからインポート
import { getAllPresentations } from "@/lib/server-utils"; // generateStaticParamsで使用
import { notFound } from "next/navigation";

type Params = Promise<{ slug: string; page: string }>;

export default async function PresentationPage({ params }: { params: Params }) {
  const { slug, page } = await params;
  const currentPage = parseInt(page, 10);

  // ページ番号の基本検証
  if (isNaN(currentPage) || currentPage < 1) {
    notFound();
  }

  // サーバーサイドでスライドデータを取得
  const { totalPages } = getPresentationData(slug);
  
  // プレゼンテーションが存在しない場合
  if (totalPages === 0) {
    notFound();
  }

  // ページ番号が範囲外の場合も404を返す
  if (currentPage > totalPages) {
    notFound();
  }

  const slideContent = getSlideContent(slug, currentPage);

  // スライドコンテンツが取得できない場合
  if (!slideContent) {
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

// dynamicParamsのデフォルト値はtrueなので、明示的な設定は不要
// 開発環境では動的パラメータが許可され、静的エクスポート時は自動的に制限される
