#!/usr/bin/env node
'use strict'
/**
 * content-history.js
 * Version history for stories and Director's Cut commentary — both are now
 * committed to git (since the "commit to github" work earlier), so the
 * version history already exists; this just makes it convenient to use
 * without hand-rolling git log/show commands for the commentary.json case
 * (a single shared file where most tools would show the whole file's diff
 * history, not one track's).
 *
 * Usage:
 *   node scripts/content-history.js story <slug>        # git log -p for that file
 *   node scripts/content-history.js commentary <slug>    # per-commit value for that one key
 *   node scripts/content-history.js list                 # all commits touching any content file
 */

const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '..')

function git(args) {
  return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf-8' })
}

const [, , cmd, slug] = process.argv

function storyHistory(slug) {
  const rel = `content/stories/${slug}.md`
  console.log(`History for ${rel}:\n`)
  try {
    console.log(git(`log --follow --format="%h  %ad  %s" --date=short -- "${rel}"`))
  } catch {
    console.log('(no history — file not tracked or does not exist)')
  }
}

function commentaryHistory(slug) {
  const rel = 'public/directors-cut-commentary.json'
  console.log(`History for commentary["${slug}"]:\n`)
  let commits
  try {
    commits = git(`log --format="%H %ad" --date=short -- "${rel}"`).trim().split('\n').filter(Boolean)
  } catch {
    console.log('(no history)')
    return
  }
  if (commits.length === 0) {
    console.log('(no commits touched this file)')
    return
  }

  let prevValue = undefined
  // Walk oldest → newest so we can show when the text actually changed.
  for (const line of commits.reverse()) {
    const [hash, date] = line.split(' ')
    let value
    try {
      const content = git(`show ${hash}:${rel}`)
      value = JSON.parse(content)[slug]
    } catch {
      value = undefined
    }
    if (value !== prevValue) {
      console.log(`── ${hash.slice(0, 7)}  ${date} ──`)
      console.log(value ? `"${value.slice(0, 200)}${value.length > 200 ? '…' : ''}"` : '(absent)')
      console.log()
      prevValue = value
    }
  }
}

function listAll() {
  console.log('Commits touching content/stories/ or directors-cut-commentary.json:\n')
  console.log(git('log --format="%h  %ad  %s" --date=short -- content/stories/ public/directors-cut-commentary.json'))
}

if (cmd === 'story' && slug) storyHistory(slug)
else if (cmd === 'commentary' && slug) commentaryHistory(slug)
else if (cmd === 'list') listAll()
else {
  console.error('Usage:')
  console.error('  node scripts/content-history.js story <slug>')
  console.error('  node scripts/content-history.js commentary <slug>')
  console.error('  node scripts/content-history.js list')
  process.exit(1)
}
