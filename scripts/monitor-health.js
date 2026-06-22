#!/usr/bin/env node
'use strict'
/**
 * monitor-health.js
 * Cron target: hits /api/health (disk/memory) and checks pm2 directly for
 * the noiraciel process (status the app itself can't observe about its own
 * process manager). Emails on any breach using the same SMTP env vars
 * already used by /api/join/route.ts — if SMTP isn't configured, it logs
 * instead of silently doing nothing, so a cron-failure monitor can still
 * catch a non-zero exit.
 *
 * Usage:
 *   node scripts/monitor-health.js              # real check
 *   node scripts/monitor-health.js --test       # force a fake breach, verify the alert path end-to-end
 *   node scripts/monitor-health.js --url <url>  # check a different host (default http://localhost:3000)
 */

const path = require('path')
const { execSync } = require('child_process')
const http = require('http')
const https = require('https')

function loadEnv() {
  const fs = require('fs')
  const envPath = path.join(__dirname, '..', '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    if (!process.env[k]) process.env[k] = t.slice(eq + 1).trim()
  }
}
loadEnv()

const args = process.argv.slice(2)
const TEST_MODE = args.includes('--test')
const url = args.includes('--url') ? args[args.indexOf('--url') + 1] : 'http://localhost:3000'

function fetchHealth(healthUrl) {
  return new Promise((resolve, reject) => {
    const client = healthUrl.startsWith('https') ? https : http
    const req = client.get(healthUrl, { timeout: 10000 }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
  })
}

function checkPm2() {
  try {
    const out = execSync('pm2 jlist', { timeout: 5000 }).toString()
    const list = JSON.parse(out)
    const app = list.find((p) => p.name === 'noiraciel')
    if (!app) return { ok: false, reason: 'noiraciel not found in pm2 process list' }
    if (app.pm2_env.status !== 'online') return { ok: false, reason: `pm2 status is "${app.pm2_env.status}", not online` }
    return { ok: true, restarts: app.pm2_env.restart_time }
  } catch (e) {
    return { ok: false, reason: `pm2 jlist failed: ${e.message}` }
  }
}

async function sendAlert(subject, lines) {
  const smtpHost = process.env.SMTP_HOST
  console.log(`\n── ALERT: ${subject} ──`)
  for (const l of lines) console.log(`  ${l}`)

  if (!smtpHost) {
    console.warn('\n⚠  SMTP_HOST not set — alert logged only, no email sent. Configure SMTP_HOST/SMTP_USER/SMTP_PASS in .env.local to enable email alerts.')
    return false
  }
  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
    await transporter.sendMail({
      from: `"NoiraCiel Monitor" <${process.env.SMTP_USER}>`,
      to: process.env.ALERT_EMAIL ?? process.env.JOIN_EMAIL ?? 'jorge.manuel.granja@gmail.com',
      subject: `[NoiraCiel] ${subject}`,
      text: lines.join('\n'),
    })
    console.log('✓ alert email sent')
    return true
  } catch (e) {
    console.error(`✗ failed to send alert email: ${e.message}`)
    return false
  }
}

async function main() {
  const issues = []

  if (TEST_MODE) {
    issues.push('TEST MODE: simulated disk-space breach (disk free 50MB < 1000MB)')
  } else {
    let health
    try {
      health = await fetchHealth(`${url}/api/health`)
    } catch (e) {
      issues.push(`could not reach ${url}/api/health: ${e.message}`)
    }
    if (health) {
      if (health.status === 'warn') issues.push(...health.warnings)
      console.log(`health: disk free ${health.disk?.freeMb}MB, memory free ${health.memory?.freeMb}MB`)
    }

    const pm2Status = checkPm2()
    if (!pm2Status.ok) issues.push(`pm2: ${pm2Status.reason}`)
    else console.log(`pm2: noiraciel online (${pm2Status.restarts} restarts)`)
  }

  if (issues.length > 0) {
    await sendAlert('Production health warning', issues)
    process.exit(1)
  }

  console.log('✓ all checks passed')
}

main().catch((e) => { console.error(e.message); process.exit(1) })
