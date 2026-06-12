import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { invalidateBusinessDashboardCache } from "@/src/lib/cache/invalidate-business-dashboard-cache";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import {
  previewWasteSpreadsheetImport,
  resolveImportReasonId,
  toBatchEntries,
} from "@/src/modules/waste/application/import-waste-spreadsheet";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireCapability("manageCatalog");
  if ("error" in context) return context.error;

  const form = await request.formData();
  const file = form.get("file");
  const previewOnly = form.get("preview") === "true";

  if (!(file instanceof File) || !file.name) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "File must be 2 MB or smaller" }, { status: 400 });
  }

  try {
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    const wasteRepository = new SupabaseWasteRepository(context.supabase);

    const [products, reasons, content] = await Promise.all([
      catalogRepository.listBusinessProductsForLocation(
        context.business.id,
        context.location.id,
      ),
      wasteRepository.listReasons(context.business.id),
      file.text(),
    ]);

    const preview = previewWasteSpreadsheetImport(content, products);

    if (previewOnly) {
      return NextResponse.json({ preview });
    }

    if (preview.matched.length === 0) {
      return NextResponse.json(
        {
          error: "No rows matched your menu. Check product names in the CSV.",
          preview,
        },
        { status: 400 },
      );
    }

    const logs = await wasteRepository.createLogsBatch({
      businessId: context.business.id,
      locationId: context.location.id,
      userId: context.userId,
      wasteReasonId: resolveImportReasonId(preview, reasons),
      entries: toBatchEntries(preview),
      source: "import",
    });

    await invalidateBusinessDashboardCache(context.business.id);

    return NextResponse.json(
      {
        preview,
        importedCount: logs.length,
        skippedCount: preview.unmatched.length,
        logs,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Could not import spreadsheet" }, { status: 500 });
  }
}
