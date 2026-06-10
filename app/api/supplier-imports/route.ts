import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { createSupplierImportSchema } from "@/src/modules/imports/application/import-schemas";
import { processSupplierImport } from "@/src/modules/imports/application/process-supplier-import";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseSupplierImportRepository } from "@/src/modules/imports/infrastructure/supabase-import-repository";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseSupplierImportRepository(context.supabase);
    const imports = await repository.list(context.business.id);
    return NextResponse.json({ imports });
  } catch {
    return NextResponse.json({ error: "Could not load imports" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const contentType = request.headers.get("content-type") ?? "";

  try {
    const repository = new SupabaseSupplierImportRepository(context.supabase);
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");

      if (!(file instanceof File) || !file.name) {
        return NextResponse.json({ error: "Invoice file is required" }, { status: 400 });
      }

      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "File must be 10 MB or smaller" }, { status: 400 });
      }

      const storagePath = `imports/${context.business.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await context.supabase.storage
        .from("supplier-imports")
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

      if (uploadError) {
        return NextResponse.json(
          { error: "Could not store invoice file" },
          { status: 500 },
        );
      }

      const [menuProducts, fileBytes] = await Promise.all([
        catalogRepository.listBusinessProducts(context.business.id),
        file.arrayBuffer(),
      ]);

      const processingResult = await processSupplierImport({
        filename: file.name,
        fileBytes,
        menuProducts,
        currencyCode: context.business.currencyCode,
      });

      const record = await repository.create({
        businessId: context.business.id,
        userId: context.userId,
        originalFilename: file.name,
        storagePath,
        processingResult,
      });

      return NextResponse.json({ import: record }, { status: 201 });
    }

    const parsed = createSupplierImportSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const storagePath = `imports/${context.business.id}/${Date.now()}-${parsed.data.originalFilename}`;
    const record = await repository.create({
      businessId: context.business.id,
      userId: context.userId,
      originalFilename: parsed.data.originalFilename,
      storagePath,
    });

    return NextResponse.json({ import: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not register import" }, { status: 500 });
  }
}
