import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { invalidateBusinessDashboardCache } from "@/src/lib/cache/invalidate-business-dashboard-cache";
import { canCloseInventoryDay } from "@/src/modules/business/domain/permissions";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

const UNDO_WINDOW_MS = 10 * 60_000;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = verifyMutationRequest(_request);
  if (blocked) return blocked;

  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const { id } = await params;

  try {
    const repository = new SupabaseWasteRepository(context.supabase);
    const log = await repository.getLog(context.business.id, id);

    if (!log) {
      return NextResponse.json({ error: "Log not found" }, { status: 404 });
    }

    const isManager = canCloseInventoryDay(context.business.role);
    const isOwnLog = log.createdBy === context.userId;
    const isRecent =
      Date.now() - new Date(log.occurredAt).getTime() <= UNDO_WINDOW_MS;

    if (!isManager && (!isOwnLog || !isRecent)) {
      return NextResponse.json({ error: "Cannot undo this log" }, { status: 403 });
    }

    await repository.deleteLog(context.business.id, id);
    await invalidateBusinessDashboardCache(context.business.id);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete waste log" }, { status: 500 });
  }
}
