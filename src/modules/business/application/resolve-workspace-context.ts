import type { BusinessRepository } from "@/src/modules/business/application/business-repository";
import type { WorkspaceContext } from "@/src/modules/business/domain/workspace";

export async function resolveWorkspaceContext(
  repository: BusinessRepository,
  userId: string,
  requestedLocationId?: string | null,
): Promise<WorkspaceContext | null> {
  const business = await repository.getCurrentForUser(userId);
  if (!business) return null;

  const locations = await repository.listLocations(business.id);
  if (locations.length === 0) return null;

  const preference = await repository.getActiveLocationPreference(
    userId,
    business.id,
  );

  const candidates = [
    requestedLocationId,
    preference?.locationId,
    locations[0]?.id,
  ].filter((id): id is string => Boolean(id));

  const location =
    candidates
      .map((id) => locations.find((item) => item.id === id))
      .find(Boolean) ?? locations[0];

  return { business, location, locations };
}
