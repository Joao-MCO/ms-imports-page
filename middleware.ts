import { auth } from "@/lib/auth-config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/management");
  const isOnOrders = req.nextUrl.pathname.startsWith("/orders");
  const isOnUsers = req.nextUrl.pathname.startsWith("/management/users");

  if ((isOnDashboard || isOnOrders) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isOnUsers && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/management", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/management/:path*", "/orders/:path*"],
  runtime: "nodejs",
};