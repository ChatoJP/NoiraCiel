import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Case-insensitive page routes.
 *
 * Next.js routes are case-sensitive, so /ENTER or /Speaker 404 even though
 * /enter and /speaker exist. Visitors type these by hand, so we redirect any
 * mixed/upper-case page path to its lowercase canonical form (308, preserves
 * the method and is cacheable).
 *
 * Carefully preserved (these are case-sensitive on purpose):
 *  - /Videos, /Audio, /Books — proxied/redirected to R2 with capitalised keys
 *    (see next.config.ts); lowercasing them would break the media URLs.
 *  - Anything with a file extension (favicon.ico, *.json, *.mp4, …).
 *  - /_next and /api are already excluded by the matcher below.
 */

const PRESERVE_PREFIXES = ['/Videos', '/Audio', '/Books']

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PRESERVE_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.includes('.')) return NextResponse.next() // static files

  const lower = pathname.toLowerCase()
  if (lower !== pathname) {
    const url = req.nextUrl.clone()
    url.pathname = lower
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  // Run on everything except Next internals and API routes.
  matcher: ['/((?!_next|api).*)'],
}
