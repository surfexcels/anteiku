import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { searchCatalogSchema } from "@/src/modules/catalog/application/catalog-schemas";
import { searchStaticCatalog } from "@/src/modules/catalog/application/search-static-catalog";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = searchCatalogSchema.safeParse({
    query: url.searchParams.get("q") ?? "",
    countryCode: url.searchParams.get("country") || undefined,
    limit: url.searchParams.get("limit") ?? 12,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search parameters" },
      { status: 400 },
    );
  }

  const products = searchStaticCatalog(parsed.data);
  return NextResponse.json(
    { products },
    { headers: { "Cache-Control": "private, max-age=300" } },
  );
}
