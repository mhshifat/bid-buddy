/**
 * Root page – redirects based on authentication state.
 *
 * If the user has a session → dashboard
 * If the user has no session → login
 */

import { redirect } from "next/navigation";
import { getServerSession } from "@/server/auth/get-session";

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
