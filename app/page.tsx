import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Hewane School Music Dashboard",
  description: "WhatsApp Broadcast & Contact Management",
};

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Authenticated users see the dashboard
  if (session?.user) {
    redirect("/");
  }

  // Unauthenticated users go to sign-in
  redirect("/sign-in");
}
