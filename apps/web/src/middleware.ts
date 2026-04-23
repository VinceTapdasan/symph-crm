export { auth as middleware } from './auth'

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api/auth (NextAuth routes)
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, sitemap.xml, robots.txt
     * - sw.js, workbox-*.js, manifest.webmanifest (PWA files must be public)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|sw\\.js|workbox-.*\\.js|manifest\\.webmanifest).*)',
  ],
}
