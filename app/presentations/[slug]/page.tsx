import { redirect } from "next/navigation";
import { getPresentationData, getAllPresentations } from "@/lib/server-utils";

// ⬇ Promise 版の型を受け取り、await（または React.use）
type Params = Promise<{ slug: string }>;

export default async function SlugPage({ params }: { params: Params }) {
  const { slug } = await params;          // ← ここがポイント
  const { totalPages } = getPresentationData(slug);

  if (totalPages > 0) {
    redirect(`/presentations/${slug}/1`);
  }

  // presentation が無い場合
  redirect("/");
}

// ─────────────────────────
// 静的生成する slug 一覧
// ─────────────────────────
export async function generateStaticParams() {
  const presentations = getAllPresentations();
  return presentations.map((p) => ({ slug: p.slug }));
}

// dynamicParamsのデフォルト値はtrueなので、明示的な設定は不要
// 開発環境では動的パラメータが許可され、静的エクスポート時は自動的に制限される