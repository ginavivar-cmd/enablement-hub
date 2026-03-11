"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/notification-bell";

const TABS = [
  { label: "Intake", href: "/intake" },
  { label: "What We're Hearing", href: "/hearing" },
  { label: "Calendar", href: "/calendar" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Archive", href: "/archive" },
];

export function AppShell({
  user,
  children,
}: {
  user: { name: string; displayName: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-[#f0f0f0]">
      {/* Top nav bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e5e5e5]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <Link href="/intake" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gladly-green text-white text-sm font-bold">
              E
            </div>
            <span className="text-sm font-bold text-[#1a1a1a] hidden sm:inline">
              Enablement Planning
            </span>
          </Link>

          {/* Tab navigation */}
          <nav className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "text-gladly-green font-semibold"
                      : "text-[#737373] hover:text-[#1a1a1a]"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gladly-green rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side: notifications + user */}
          <div className="flex items-center gap-3">
            <NotificationBell />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gladly-green/10 text-gladly-green text-xs font-semibold">
                {user.displayName.charAt(0)}
              </div>
              <span className="text-sm text-[#1a1a1a] hidden sm:inline">
                {user.displayName}
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-[#aaa] hover:text-[#1a1a1a] ml-1 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
