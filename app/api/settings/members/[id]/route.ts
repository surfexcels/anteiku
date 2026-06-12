import { NextResponse } from "next/server";
import { requireWorkspaceSettings } from "@/src/lib/auth/require-tenant-admin";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { updateMemberSchema } from "@/src/modules/business/application/settings-schemas";
import { canManageTeam } from "@/src/modules/business/domain/permissions";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireWorkspaceSettings();
  if ("error" in context) return context.error;

  if (!canManageTeam(context.business.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = updateMemberSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id } = await params;
  const repository = new SupabaseBusinessRepository(context.supabase);

  try {
    const members = await repository.listMembers(context.business.id);
    const target = members.find((member) => member.id === id);

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (target.role === "owner") {
      return NextResponse.json(
        { error: "The workspace owner cannot be changed here." },
        { status: 400 },
      );
    }

    if (target.userId === context.userId && parsed.data.isActive === false) {
      return NextResponse.json(
        { error: "You cannot deactivate your own access." },
        { status: 400 },
      );
    }

    const member = await repository.updateMember({
      businessId: context.business.id,
      membershipId: id,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    });

    return NextResponse.json({ member });
  } catch {
    return NextResponse.json(
      { error: "Could not update team member" },
      { status: 500 },
    );
  }
}
