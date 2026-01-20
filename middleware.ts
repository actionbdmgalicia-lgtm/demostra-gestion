import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // If accessing /auth/login, let them pass
    if (request.nextUrl.pathname.startsWith('/auth/login')) {
        return NextResponse.next();
    }

    // Check cookie
    const userCookie = request.cookies.get('demostra_user');

    if (!userCookie) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    let user;
    try {
        user = JSON.parse(userCookie.value);
    } catch {
        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const role = user.role; // 'ADMIN' or 'COSTES'
    const path = request.nextUrl.pathname;

    // RULE: COSTES Role Limit
    if (role === 'COSTES') {
        // Allowed: /gastos, /comparativo
        // Blocked: / (home), /informes, /ferias/*
        // Actually home / might be needed to navigate? Or we redirect them?
        // User Update: "Costes: solo permite imputar coste y sacar comparativos."

        // Explicit allow list
        if (path.startsWith('/gastos') || path.startsWith('/comparativo')) {
            return NextResponse.next();
        }

        // Allow static assets
        if (path.startsWith('/_next') || path.startsWith('/templates') || path.includes('.')) {
            return NextResponse.next();
        }

        // Default redirect to /gastos for Costes role if they hit root or unauthorized
        if (path === '/') {
            return NextResponse.redirect(new URL('/gastos', request.url));
        }

        // Otherwise block/redirect
        return NextResponse.redirect(new URL('/gastos', request.url));
    }

    // ADMIN allowed everywhere
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - templates (public files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|templates).*)',
    ],
};
