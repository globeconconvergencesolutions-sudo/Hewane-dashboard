import { Sidebar } from "@/components/dashboard/sidebar";
import { getServerSession } from "@/lib/auth-session";
import { createMetadata } from "@/lib/metadata";
import { redirect } from "next/navigation";

export const metadata = createMetadata({
  title: "Dashboard",
  noIndex: true,
});
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/sign-in?callbackUrl=" + encodeURIComponent("/"));
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar userEmail={session.user.email} />
      <main className="flex-1 overflow-y-auto md:ml-64">
        <div className="mx-auto max-w-7xl p-4 pt-16 md:p-8 md:pt-8">{children}</div>
      </main>
    </div>
  );
}
