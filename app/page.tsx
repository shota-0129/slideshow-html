import Link from "next/link";
import Image from "next/image";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatSlugAsTitle } from "@/lib/utils";
import { getAllPresentations } from "@/lib/server-utils";
import { SlugSchema, safeParseWithSchema } from "@/lib/validation";

export default function Home() {
  const presentations = getAllPresentations();
  const isStatic = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8 text-center">
        HTML スライドショービューア
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presentations.map((p) => {
          // Sanitize slug to prevent XSS attacks
          const sanitizedSlug = safeParseWithSchema(SlugSchema, p.slug);
          if (!sanitizedSlug.success) {
            console.warn(`Invalid slug detected: ${p.slug}`);
            return null;
          }
          const safeSlug = sanitizedSlug.data;
          
          return (
            <Card key={safeSlug} className="overflow-hidden">
              <CardHeader>
                <CardTitle>{formatSlugAsTitle(safeSlug)}</CardTitle>
                <CardDescription>スライド数: {p.totalPages}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                  <Image
                    src={
                      isStatic
                         ? `${basePath}/thumb/${encodeURIComponent(safeSlug)}/1.jpg`                     
                         : `/api/thumb?slug=${encodeURIComponent(safeSlug)}&page=1`
                    }
                    alt={`${safeSlug} preview`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Link href={`/presentations/${encodeURIComponent(safeSlug)}/1`} className="w-full">
                  <Button className="w-full">表示する</Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
