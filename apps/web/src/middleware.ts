import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { homePathForRole, parseRoleFromSessionClaims } from '@/lib/clerkRoles';

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isClientRoute = createRouteMatcher(['/dashboard(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/acesso-pendente']);
const isAccessPendingRoute = createRouteMatcher(['/acesso-pendente']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const role = parseRoleFromSessionClaims(
    sessionClaims as Record<string, unknown> | null | undefined,
  );

  if (!role) {
    if (!isAccessPendingRoute(req)) {
      return NextResponse.redirect(new URL('/acesso-pendente', req.url));
    }
    return NextResponse.next();
  }

  if (isAdminRoute(req) && role !== 'admin') {
    return NextResponse.redirect(new URL(homePathForRole(role), req.url));
  }
  if (isClientRoute(req) && role !== 'client') {
    return NextResponse.redirect(new URL(homePathForRole(role), req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};
