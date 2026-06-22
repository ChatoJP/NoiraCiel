import { NextResponse } from 'next/server'
import os from 'os'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

const DISK_WARN_MB = 1000
const MEM_WARN_MB  = 300

function diskFreeMb(): number | null {
  try {
    const out = execSync("df -m / | awk 'NR==2{print $4}'", { timeout: 2000 }).toString().trim()
    return parseInt(out, 10)
  } catch {
    return null
  }
}

export function GET() {
  const freeMemMb  = Math.round(os.freemem() / 1024 / 1024)
  const totalMemMb = Math.round(os.totalmem() / 1024 / 1024)
  const diskFree   = diskFreeMb()

  const warnings: string[] = []
  if (diskFree !== null && diskFree < DISK_WARN_MB) warnings.push(`disk free ${diskFree}MB < ${DISK_WARN_MB}MB`)
  if (freeMemMb < MEM_WARN_MB) warnings.push(`memory free ${freeMemMb}MB < ${MEM_WARN_MB}MB`)

  return NextResponse.json({
    status: warnings.length > 0 ? 'warn' : 'ok',
    ts: new Date().toISOString(),
    uptime: process.uptime(),
    disk: { freeMb: diskFree, warnThresholdMb: DISK_WARN_MB },
    memory: { freeMb: freeMemMb, totalMb: totalMemMb, warnThresholdMb: MEM_WARN_MB },
    warnings,
  })
}
