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
