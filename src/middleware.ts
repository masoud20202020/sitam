import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    // Custom logic inside middleware if needed
    // e.g. check specific permissions
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Only allow if token exists (user is logged in)
        return !!token;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

export const config = {
  matcher: [
    // Protect all routes under /admin except login and static assets
    '/admin/((?!login|api|_next/static|_next/image|favicon.ico|uploads).*)',
    // Also protect /admin itself
    '/admin'
  ],
};
