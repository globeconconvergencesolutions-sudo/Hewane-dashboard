"use client";

import { BrandMark } from "@/components/brand-mark";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
  BookOpen,
} from "lucide-react";import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/templates", label: "Templates", icon: MessageSquare },
  { href: "/broadcast", label: "Broadcast", icon: Send },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ userEmail }: { userEmail?: string | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <Button variant="outline" size="icon" onClick={() => setOpen(!open)} className="bg-background/95 backdrop-blur">
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </Button>
      </div>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-[#1a1a2e] text-white transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="border-b border-white/10 p-6">
          <BrandMark variant="sidebar" />          {userEmail ? (
            <p className="mt-4 truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
              {userEmail}
            </p>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-gradient-to-r from-[#7D3F7E] to-[#9a4f9b] text-white shadow-lg shadow-[#7D3F7E]/20"
                    : "text-white/65 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-2">
          <Link
            href="/help"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
              pathname === "/help" || pathname?.startsWith("/help/")
                ? "bg-gradient-to-r from-[#7D3F7E] to-[#9a4f9b] text-white shadow-lg shadow-[#7D3F7E]/20"
                : "text-white/65 hover:bg-white/5 hover:text-white"
            )}
          >
            <BookOpen className="size-5 shrink-0" />
            Help & Guide
          </Link>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-white/10 bg-transparent text-white/75 hover:bg-white/5 hover:text-white"
            onClick={async () => {
              await authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    window.location.href = "/sign-in";
                  },
                },
              });
            }}
          >
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
