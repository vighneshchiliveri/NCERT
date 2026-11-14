import { NextResponse } from "next/server";

type AssetRouteProps = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, { params }: AssetRouteProps) {
  const { path } = await params;
  if (path.length === 1 && path[0] === "index.html") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return new Response(null, { status: 404 });
}
