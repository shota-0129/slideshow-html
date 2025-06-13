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

export const dynamicParams = false;