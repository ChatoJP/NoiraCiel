const R2_BASE = 'https://pub-4f2a9205b35546bc8a934e9a92a39703.r2.dev'

// Music/ now lives in R2 — musicScanner builds R2 URLs directly, so the app
// itself never calls this route anymore. Kept as a redirect for any stale
// bookmarks/embeds pointing at the old local-disk streaming path.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathParts } = await params
  const r2Path = pathParts.map((p) => encodeURIComponent(decodeURIComponent(p))).join('/')
  return Response.redirect(`${R2_BASE}/music/${r2Path}`, 308)
}
