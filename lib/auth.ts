import { auth } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/orders");
  }
  return session;
}

export function hasRole(session: { user: { role: string } } | null, role: string) {
  return session?.user?.role === role;
}

export function isAdmin(session: { user: { role: string } } | null) {
  return hasRole(session, "admin");
}

export function isManager(session: { user: { role: string } } | null) {
  return hasRole(session, "manager") || isAdmin(session);
}