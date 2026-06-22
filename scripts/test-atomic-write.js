#!/usr/bin/env node
'use strict'
/**
 * test-atomic-write.js
 * Fault-injection test for r2-client.js's atomicWriteJSON(). Simulates the
 * exact failure mode that truncated lyric-videos.json earlier this session
 * (a write that succeeds at the syscall level but produces fewer bytes than
 * intended — e.g. disk-full mid-write) by monkey-patching fs.writeFileSync
 * to truncate the temp file for one call, then asserts the target file is
 * never left in a half-written state.
 */

const fs   = require('fs')
const path = require('path')
const os   = require('os')
const assert = require('assert')

const r2 = require('./lib/r2-client')

const dir    = fs.mkdtempSync(path.join(os.tmpdir(), 'atomic-write-test-'))
const target = path.join(dir, 'target.json')

function listTmpFiles() {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'))
}

function run() {
  console.log(`Test dir: ${dir}`)

  // 1. Normal write establishes a known-good baseline.
  r2.atomicWriteJSON(target, { version: 'A', n: 1 })
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(target, 'utf-8')), { version: 'A', n: 1 })
  console.log('✓ baseline write succeeded')

  // 2. Inject a truncated write — simulates disk-full mid-write. The real
  //    fs.writeFileSync is patched for exactly one call so only the temp-file
  //    write inside atomicWriteJSON is affected.
  const realWriteFileSync = fs.writeFileSync
  let patched = true
  fs.writeFileSync = function (filePath, data, ...rest) {
    if (patched && String(filePath).endsWith('.tmp')) {
      patched = false
      const truncated = String(data).slice(0, 5) // well short of valid JSON
      return realWriteFileSync.call(fs, filePath, truncated, ...rest)
    }
    return realWriteFileSync.call(fs, filePath, data, ...rest)
  }

  let threw = false
  try {
    r2.atomicWriteJSON(target, { version: 'B', n: 2 })
  } catch (e) {
    threw = true
    console.log(`✓ atomicWriteJSON threw as expected: ${e.message.slice(0, 60)}...`)
  } finally {
    fs.writeFileSync = realWriteFileSync
  }
  assert.ok(threw, 'atomicWriteJSON should have thrown on a truncated write')

  // 3. The target must still hold the last GOOD version, never the garbage.
  const survived = JSON.parse(fs.readFileSync(target, 'utf-8'))
  assert.deepStrictEqual(survived, { version: 'A', n: 1 })
  console.log('✓ target file still holds the last valid version (no corruption)')

  // 4. No leftover .tmp files from the failed attempt.
  assert.strictEqual(listTmpFiles().length, 0, 'temp file should be cleaned up after failure')
  console.log('✓ no leftover temp files')

  // 5. A subsequent normal write still works after a prior failure.
  r2.atomicWriteJSON(target, { version: 'C', n: 3 })
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(target, 'utf-8')), { version: 'C', n: 3 })
  console.log('✓ recovery write after failure succeeded')

  fs.rmSync(dir, { recursive: true, force: true })
  console.log('\nAll atomic-write fault-injection checks passed.')
}

try {
  run()
  process.exit(0)
} catch (e) {
  console.error(`\n✗ FAILED: ${e.message}`)
  process.exit(1)
}
