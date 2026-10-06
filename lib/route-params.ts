import { NextRequest, NextResponse } from "next/server";

export type RouteParams<T extends Record<string, string> = { id: string }> = {
  params: Promise<T>;
};

export type RouteHandler<T extends Record<string, string> = { id: string }> = (
  request: NextRequest,
  context: RouteParams<T>
) => Promise<NextResponse>;