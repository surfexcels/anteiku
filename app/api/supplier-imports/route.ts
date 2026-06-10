import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { createSupplierImportSchema } from "@/src/modules/imports/application/import-schemas";
import { SupabaseSupplierImportRepository } from "@/src/modules/imports/infrastructure/supabase-import-repository";

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

  const parsed = createSupplierImportSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  try {
    const repository = new SupabaseSupplierImportRepository(context.supabase);
    const record = await repository.create({
      businessId: context.business.id,
      userId: context.userId,
      originalFilename: parsed.data.originalFilename,
    });
    return NextResponse.json({ import: record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not register import" }, { status: 500 });
  }
}
