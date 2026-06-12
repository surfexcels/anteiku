import type { MembershipRole } from "@/src/modules/business/domain/business";

const MANAGER_ROLES: MembershipRole[] = ["owner", "admin", "manager"];

export function canManageCatalog(role: MembershipRole) {
  return MANAGER_ROLES.includes(role);
}

export function canCloseInventoryDay(role: MembershipRole) {
  return MANAGER_ROLES.includes(role);
}

export function canEditOpeningStock(role: MembershipRole) {
  return MANAGER_ROLES.includes(role);
}

export function canExportData(role: MembershipRole) {
  return MANAGER_ROLES.includes(role);
}

export function canLogWaste(_role: MembershipRole) {
  return true;
}

export function canInviteMembers(role: MembershipRole) {
  return role === "owner" || role === "admin";
}

export function canManageLocations(role: MembershipRole) {
  return role === "owner" || role === "admin";
}

export function canManageTeam(role: MembershipRole) {
  return role === "owner" || role === "admin";
}

export function canManageBusinessProfile(role: MembershipRole) {
  return role === "owner";
}
