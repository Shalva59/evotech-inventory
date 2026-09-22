"use client";

import { usePathname } from "next/navigation";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/shell/Sidebar";
import { MobileNav } from "@/components/shell/MobileNav";

/**
 * The sign-in screen is the one page with no chrome around it — a cashier
 * looking at a nav bar they cannot use would just be confused.
 */
function Shell({ children }) {
  const pathname = usePathname();
  const { user, checking } = useAuth();

  if (pathname === "/login") return children;

  if (checking || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="h-1 w-24 animate-pulse-line rounded-full bg-brass-dim" />
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pb-14 lg:pb-0">{children}</div>
      </div>
      <MobileNav />
    </>
  );
}

export function Providers({ children }) {
  return (
    <I18nProvider>
      <AuthProvider>
        <Shell>{children}</Shell>
      </AuthProvider>
    </I18nProvider>
  );
}
