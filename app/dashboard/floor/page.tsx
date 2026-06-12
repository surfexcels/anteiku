import { signOut } from "../actions";
import { FloorPageClient } from "./floor-page-client";

export default function FloorPage() {
  return <FloorPageClient signOutAction={signOut} />;
}
