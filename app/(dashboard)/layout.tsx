"use client";

import { SessionProvider } from "next-auth/react";
import { Sidebar } from "@/components/ui";
import Image from "next/image";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

interface DashboardLayoutProps {
  children: ReactNode;
}

function SidebarWrapper({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const pageTitle = pathname?.startsWith("/management")
    ? "Gerenciamento"
    : pathname?.startsWith("/orders")
      ? "Pedidos"
      : "MS Imports";

  const user = session?.user ? {
    name: session.user.name || "Usuário",
    email: session.user.email || "user@example.com",
    role: (session.user as { role?: string }).role || "manager"
  } : { name: "Usuário", email: "user@example.com", role: "manager" };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.jpeg"
              alt="MS Imports Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {pageTitle}
            </h2>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <SidebarWrapper>{children}</SidebarWrapper>
    </SessionProvider>
  );
}