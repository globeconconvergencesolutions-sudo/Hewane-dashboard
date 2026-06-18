import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 md:ml-64 overflow-y-auto">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
