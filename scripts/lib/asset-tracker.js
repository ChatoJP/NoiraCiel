'use strict'
/**
 * asset-tracker.js
 * Shared state management for all NoiraCiel asset generation scripts.
 *
 * Each asset type stores a state JSON file inside its output folder:
 *   public/images/song-art/.state.json
 *   public/images/backgrounds/.state.json
 *   etc.
 *
 * State entry shape:
 *   {
 *     id:          string   — slug or concept id
 *     label:       string   — human-readable name
 *     taskId:      string | null
 *     status:      'none' | 'pending' | 'generating' | 'complete' | 'failed'
 *     remoteUrl:   string | null   — Kie.ai CDN URL (14-day expiry)
 *     localPath:   string | null   — absolute path on disk
 *     publicUrl:   string | null   — /images/... URL for the website
 *     submittedAt: string | null
 *     completedAt: string | null
 *     error:       string | null
 *   }
 */

'use strict'

const fs   = require('fs')
const path = require('path')

function stateFilePath(outputDir) {
  return path.join(outputDir, '.state.json')
}

function loadState(outputDir) {
  const fp = stateFilePath(outputDir)
  if (!fs.existsSync(fp)) return {}
  try { return JSON.parse(fs.readFileSync(fp, 'utf-8')) } catch { return {} }
}

function saveState(outputDir, data) {
  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(stateFilePath(outputDir), JSON.stringify(data, null, 2), 'utf-8')
}

function getEntry(state, id) {
  return state[id] ?? null
}

function isComplete(entry) {
  return entry?.status === 'complete' && entry?.localPath && fs.existsSync(entry.localPath)
}

function isPending(entry) {
  return entry?.status === 'pending' || entry?.status === 'generating'
}

/**
 * Build a fresh entry for a new asset.
 */
function blankEntry(id, label) {
  return {
    id,
    label,
    taskId:      null,
    status:      'none',
    remoteUrl:   null,
    localPath:   null,
    publicUrl:   null,
    submittedAt: null,
    completedAt: null,
    error:       null,
  }
}

module.exports = {
  loadState,
  saveState,
  getEntry,
  isComplete,
  isPending,
  blankEntry,
}
