"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Send,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: "/contacts", label: "Contacts", icon: <Users className="w-5 h-5" /> },
  { href: "/templates", label: "Templates", icon: <MessageSquare className="w-5 h-5" /> },
  { href: "/broadcast", label: "Broadcast", icon: <Send className="w-5 h-5" /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 className="w-5 h-5" /> },
  { href: "/settings", label: "Settings", icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOpen(!open)}
          className="w-10 h-10"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold">Hewane Music</h1>
          <p className="text-xs text-slate-400">Broadcasting Dashboard</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + "/") && item.href !== "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-800">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={async () => {
              await signOut({ redirect: true, redirectUrl: "/login" });
            }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
