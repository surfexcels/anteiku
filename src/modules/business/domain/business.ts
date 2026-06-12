export type MembershipRole = "owner" | "admin" | "manager" | "staff";

export interface CurrentBusiness {
  id: string;
  name: string;
  countryCode: string;
  currencyCode: string;
  timezone: string;
  role: MembershipRole;
  carbonDisclosureEnabled: boolean;
}

export interface BusinessLocation {
  id: string;
  name: string;
}

export interface BusinessLocationDetail extends BusinessLocation {
  countryCode: string;
  timezone: string;
  isActive: boolean;
  createdAt: string;
}

export interface BusinessMember {
  id: string;
  userId: string;
  fullName: string | null;
  email?: string | null;
  role: MembershipRole;
  isActive: boolean;
  createdAt: string;
}

export interface BusinessInvitation {
  id: string;
  email: string;
  role: MembershipRole;
  fullName: string | null;
  createdAt: string;
}
