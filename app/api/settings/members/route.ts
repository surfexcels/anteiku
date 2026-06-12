import { NextResponse } from "next/server";
import { requireWorkspaceSettings } from "@/src/lib/auth/require-tenant-admin";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { createServiceRoleClient } from "@/src/lib/supabase/admin";
import { inviteMemberSchema } from "@/src/modules/business/application/settings-schemas";
import { canManageTeam } from "@/src/modules/business/domain/permissions";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireWorkspaceSettings();
  if ("error" in context) return context.error;

  if (!canManageTeam(context.business.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = inviteMemberSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invite", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const repository = new SupabaseBusinessRepository(context.supabase);

  try {
    const admin = createServiceRoleClient();
    const { data: existingUserId, error: lookupError } = await admin.rpc(
      "find_user_id_by_email",
      { target_email: email },
    );

    if (lookupError) throw lookupError;

    if (existingUserId) {
      const membership = await repository.getMembershipForUser(existingUserId);
      if (membership) {
        if (membership.businessId === context.business.id) {
          return NextResponse.json(
            { error: "This person is already on your team." },
            { status: 400 },
          );
        }
        return NextResponse.json(
          {
            error:
              "This email already belongs to another Anteiku workspace. They must leave that workspace first.",
          },
          { status: 400 },
        );
      }

      const member = await repository.addMember({
        businessId: context.business.id,
        userId: existingUserId,
        role: parsed.data.role,
      });

      if (parsed.data.fullName) {
        await context.supabase
          .from("profiles")
          .update({ full_name: parsed.data.fullName })
          .eq("id", existingUserId)
          .is("full_name", null);
      }

      return NextResponse.json(
        {
          status: "added",
          member: { ...member, email },
        },
        { status: 201 },
      );
    }

    const invitations = await repository.listPendingInvitations(
      context.business.id,
    );
    if (invitations.some((invite) => invite.email.toLowerCase() === email)) {
      return NextResponse.json(
        { error: "An invite is already pending for this email." },
        { status: 400 },
      );
    }

    const invitation = await repository.createInvitation({
      businessId: context.business.id,
      invitedBy: context.userId,
      email,
      role: parsed.data.role,
      fullName: parsed.data.fullName,
    });

    return NextResponse.json(
      {
        status: "invited",
        invitation,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not add team member" },
      { status: 500 },
    );
  }
}
