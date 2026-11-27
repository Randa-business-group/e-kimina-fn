import { NextResponse, type NextRequest } from "next/server";
import { ROLES_HINT_COOKIE, SESSION_HINT_COOKIE, canAccess, decodeRoles } from "@/lib/navigation/route-access";

/**
 * Route guard before render (msfts §9). The session itself is an httpOnly cookie on the API
 * origin that this server cannot read, so the app sets two hint cookies after sign-in:
 * `ek_session` and `ek_roles`. They only steer navigation — every API call is still
 * authorised by the API, so a forged hint shows an empty screen, never someone's data.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const signedIn = request.cookies.get(SESSION_HINT_COOKIE)?.value === "1";

  if (pathname.startsWith("/dashboard")) {
    if (!signedIn) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(url);
    }
    const roles = decodeRoles(request.cookies.get(ROLES_HINT_COOKIE)?.value);
    if (roles.length && !canAccess(pathname, roles)) {
      return NextResponse.redirect(new URL("/dashboard?denied=1", request.url));
    }
  }

  if ((pathname === "/login" || pathname === "/register") && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
