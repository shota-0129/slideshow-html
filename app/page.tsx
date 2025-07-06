import Link from "next/link";
import Image from "next/image";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatSlugAsTitle } from "@/lib/utils";
import { getAllPresentations } from "@/lib/server-utils";

export default function Home() {
  const presentations = getAllPresentations();
  const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">
        HTML スライドショービューア
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presentations.map((p) => (
          <Card key={p.slug} className="overflow-hidden">
            <CardHeader>
              <CardTitle>{formatSlugAsTitle(p.slug)}</CardTitle>
              <CardDescription>スライド数: {p.totalPages}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                <Image
                  src={
                    isStatic
                       ? `/thumb/${p.slug}/1.jpg`                     
                       : `/api/thumb?slug=${p.slug}&page=1`
                  }
                  alt={`${p.slug} preview`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </CardContent>

            <CardFooter>
              <Link href={`/presentations/${p.slug}/1`} className="w-full">
                <Button className="w-full">表示する</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
