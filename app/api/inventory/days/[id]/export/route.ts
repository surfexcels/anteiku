import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { exportInventoryCsv } from "@/src/modules/inventory/application/export-inventory-csv";
import { exportInventoryXls } from "@/src/modules/inventory/application/export-inventory-xls";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await requireCapability("exportData");
  if ("error" in context) return context.error;

  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";

  try {
    const repository = new SupabaseInventoryRepository(context.supabase);
    const day = await repository.getDayById(context.business.id, id);

    if (!day) {
      return NextResponse.json({ error: "Inventory day not found" }, { status: 404 });
    }

    const baseName = `anteiku-inventory-${day.stockDate}`;

    if (format === "xls" || format === "xlsx" || format === "excel") {
      const xml = exportInventoryXls(day, context.business.name);
      return new NextResponse(xml, {
        headers: {
          "Content-Type": "application/vnd.ms-excel; charset=utf-8",
          "Content-Disposition": `attachment; filename="${baseName}.xls"`,
        },
      });
    }

    const csv = exportInventoryCsv(day, context.business.name);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not export inventory day" },
      { status: 500 },
    );
  }
}
