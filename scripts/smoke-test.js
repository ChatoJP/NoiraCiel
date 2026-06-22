#!/usr/bin/env node
'use strict'
/**
 * smoke-test.js
 * Hits a curated list of routes that must never 5xx/404 and fails the run if
 * any do. Designed to run against a freshly-built, freshly-started instance
 * (CI starts one on localhost) — deliberately avoids POST routes that need
 * paid API keys (e.g. /api/discover), since CI has none of those secrets.
 *
 * Usage:
 *   node scripts/smoke-test.js [baseUrl]   # default http://localhost:3000
 */

const http = require('http')
const https = require('https')

const baseUrl = process.argv[2] || 'http://localhost:3000'

const ROUTES = [
  '/',
  '/music',
  '/music/the-life-lessons',
  '/songs/why',
  '/objects',
  '/discover',
  '/scholarship',
  '/scholarship/transparency',
  '/stories',
  '/sitemap.xml',
  '/robots.txt',
  '/api/health',
  '/api/music',
]

function get(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { timeout: 15000 }, (res) => {
      res.resume() // drain, we only need the status code
      res.on('end', () => resolve(res.statusCode))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}

async function main() {
  console.log(`Smoke testing ${ROUTES.length} routes against ${baseUrl}\n`)
  let failed = 0
  for (const route of ROUTES) {
    const url = baseUrl + route
    try {
      const status = await get(url)
      const ok = status >= 200 && status < 400
      console.log(`  ${ok ? '✓' : '✗'} ${status}  ${route}`)
      if (!ok) failed++
    } catch (e) {
      console.log(`  ✗ ERR   ${route} (${e.message})`)
      failed++
    }
  }
  console.log(`\n${ROUTES.length - failed}/${ROUTES.length} passed`)
  if (failed > 0) {
    console.error(`✗ ${failed} route(s) failed`)
    process.exit(1)
  }
  console.log('✓ smoke test passed')
}

main()
